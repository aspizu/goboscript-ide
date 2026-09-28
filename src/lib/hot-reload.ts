import {decodeBlocks, type Primitive, type SerializedBlock} from "@/lib/sb3-blocks"
import JSZip from "jszip"

interface _Target {
    name: string
    isStage: boolean
    blocks: Record<string, SerializedBlock | Primitive>
    variables: Record<string, [string, VM.ScratchCompatibleValue, boolean?]>
    lists: Record<string, [string, VM.ScratchList]>
    broadcasts: Record<string, string>
}

interface _Project {
    targets: _Target[]
}

export function updateVariables(target: VM.Target, source: _Target) {
    for (const [id, [name, value, cloud]] of Object.entries(source.variables)) {
        if (Object.hasOwn(target.variables, id)) {
            if (target.variables[id].type === "") continue
            target.deleteVariable(id)
        }
        target.createVariable(id, name, "", cloud)
        target.variables[id].value = value
    }
    for (const [id, [name, value]] of Object.entries(source.lists)) {
        if (Object.hasOwn(target.variables, id)) {
            if (target.variables[id].type === "list") continue
            target.deleteVariable(id)
        }
        target.createVariable(id, name, "list")
        target.variables[id].value = [...value]
    }
    for (const [id, name] of Object.entries(source.broadcasts)) {
        target.createVariable(id, name, "broadcast_msg")
    }
}

export async function hotReload(vm: VM, file: ArrayBuffer) {
    const zip = await JSZip.loadAsync(file)
    const json = zip.file("project.json")
    if (!json) throw new Error("Project archive is missing project.json")
    const project = JSON.parse(await json.async("string")) as _Project
    const updates = project.targets.map((source) => ({
        source,
        blocks: decodeBlocks(source.blocks)
    }))
    for (const {blocks} of updates) {
        for (const block of blocks) {
            const extension = block.opcode.split("_")[0]
            if (
                vm.extensionManager.isBuiltinExtension(extension) &&
                !vm.extensionManager.isExtensionLoaded(extension)
            ) {
                await vm.extensionManager.loadExtensionURL(extension)
            }
        }
    }
    for (const {source, blocks} of updates) {
        const target = vm.runtime.targets.find(
            (target) =>
                target.isOriginal &&
                target.isStage === source.isStage &&
                target.getName() === source.name
        )
        if (!target) {
            const spriteZip = await JSZip.loadAsync(file)
            spriteZip.remove("project.json")
            spriteZip.file("sprite.json", JSON.stringify(source))
            await vm.addSprite(await spriteZip.generateAsync({type: "uint8array"}))
            const added = vm.runtime.targets.find(
                (target) => target.isOriginal && target.getName() === source.name
            )
            if (added) vm.runtime.startHats("event_whenflagclicked", undefined, added)
            continue
        }
        for (const clone of target.sprite.clones) updateVariables(clone, source)
        target.blocks.deleteAllBlocks()
        for (const block of blocks) target.blocks.createBlock(block)
        target.blocks.resetCache()
    }
    for (const target of [...vm.runtime.targets]) {
        if (target.isStage || !target.isOriginal) continue
        if (!project.targets.some((source) => source.name === target.getName())) {
            vm.deleteSprite(target.id)
        }
    }
    vm.emitTargetsUpdate(false)
}
