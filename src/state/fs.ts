import {localsignal} from "@/lib/localsignal"
import {monaco} from "@/state/editor"
import JSZip from "jszip"
import {err, ok, type Result} from "neverthrow"
import * as pathlib from "node:path"

export type Entry = string | Blob

const fs = await localsignal<Record<string, Entry>>("fs", {
    "stage.gs": `# This is the Stage, list more backdrops separated by comma.\ncostumes "blank.svg";\n`,
    "main.gs": `# This is a sprite.\ncostumes "blank.svg";\n\n# when green flag clicked\nonflag {\n  say "Hello, World!";\n}\n`,
    "blank.svg": `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"></svg>\n`,
    "goboscript.toml": `# goboscript project configuration\n\n# The target number of frames per second (FPS)\nframe_rate = 30\n\n# Maximum number of clones that can exist simultaneously\nmax_clones = 300.0\n\n# If true, removes various limits unrelated to clones or rendering\nno_miscellaneous_limits = false\n\n# If true, disables sprite fencing (sprites can move beyond stage borders)\nno_sprite_fencing = false\n\n# If true, enables frame interpolation for smoother animations\nframe_interpolation = false\n\n# If true, improves pen rendering quality (may affect performance)\nhigh_quality_pen = false\n\n# Width of the stage in pixels\nstage_width = 480\n\n# Height of the stage in pixels\nstage_height = 360\n`
})

const EDITABLE_TYPES = [".gs", ".json", ".svg", ".toml", ".txt"]

function syncWithMonaco() {
    const files = {...fs.value}
    for (const model of monaco.value.editor.getModels()) {
        if (model.uri.path in files) files[model.uri.path] = model.getValue()
    }
    return files
}

function syncToMonaco() {
    for (const model of monaco.value.editor.getModels()) {
        const entry = fs.value[model.uri.path]
        if (typeof entry === "string") model.setValue(entry)
    }
}

export type Tree = {[key: string]: Tree}

export function getTree() {
    const tree: Tree = {}
    for (const path of Object.keys(fs.value)) {
        const parts = path.split("/")
        let head = tree
        let currentPath = ""
        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            head[currentPath] ||= {}
            head = head[currentPath]
        }
    }
    return tree
}

export function getFiles() {
    return Object.entries(syncWithMonaco())
}

export function getFile(path?: string): Entry | undefined {
    if (path === undefined) {
        return undefined
    }
    return syncWithMonaco()[path]
}

export function getFileBlob(path?: string): Blob | undefined {
    if (path === undefined) {
        return undefined
    }
    const file = syncWithMonaco()[path]
    if (typeof file === "string") return new Blob([file])
    return file
}

export function getDefaultFile(path?: string): Entry | undefined {
    if (path === undefined) {
        return undefined
    }
    return fs.value[path]
}

export function exists(path: string) {
    return path in fs.value
}

export async function replaceFiles(newFiles: {path: string; file: Entry}[]) {
    const files: typeof fs.value = {}
    for (let {path, file} of newFiles) {
        if (
            typeof file !== "string" &&
            EDITABLE_TYPES.includes(pathlib.extname(path))
        ) {
            file = await file.text()
        }
        files[path] = file
    }
    fs.value = files
    syncToMonaco()
}

export async function addFile(...newFiles: {path: string; file: Entry}[]) {
    const files = syncWithMonaco()
    for (let {path, file} of newFiles) {
        if (
            typeof file !== "string" &&
            EDITABLE_TYPES.includes(pathlib.extname(path))
        ) {
            file = await file.text()
        }
        files[path] = file
    }
    fs.value = files
}

export function removeFile(...paths: string[]) {
    const files = syncWithMonaco()
    for (const path of paths) delete files[path]
    fs.value = files
}

export function removeDirectory(dir: string) {
    if (!dir.endsWith("/")) dir += "/"
    const files = Object.entries(syncWithMonaco())
    fs.value = Object.fromEntries(files.filter(([path]) => !path.startsWith(dir)))
}

export function renameFile(oldPath: string, newPath: string) {
    const files = syncWithMonaco()
    const file = files[oldPath]
    delete files[oldPath]
    files[newPath] = file
    fs.value = files
}

export function renameDirectory(oldDir: string, newDir: string) {
    if (!newDir.endsWith("/")) newDir += "/"
    if (!oldDir.endsWith("/")) oldDir += "/"
    const files = syncWithMonaco()
    for (let path in files) {
        if (!path.startsWith(oldDir)) continue
        const file = files[path]
        delete files[path]
        path = newDir + path.slice(oldDir.length)
        files[path] = file
    }
    fs.value = files
}

export function getDirectoryAsZip(dir: string): Promise<Blob> {
    if (!dir.startsWith("/") && dir !== "") dir += "/"
    const zip = new JSZip()
    const files = syncWithMonaco()
    for (const path in files) {
        if (!path.startsWith(dir)) continue
        zip.file(path.slice(dir.length), files[path])
    }
    return zip.generateAsync({type: "blob"})
}

export async function replaceFromZip(file: Blob): Promise<Result<void, string>> {
    const zip = await JSZip.loadAsync(file).catch(() => undefined)
    if (!zip) return err("Invalid zip file")
    const stagePath = Object.keys(zip.files).find(
        (name) => pathlib.basename(name) == "stage.gs"
    )
    if (!stagePath) return err("Missing stage.gs")
    const dirname = stagePath && pathlib.dirname(stagePath)
    const baseDir = dirname && dirname != "." ? `${dirname}/` : ""
    const entries: {path: string; file: Entry}[] = []
    for (let file of Object.values(zip.files)) {
        if (file.dir) continue
        if (baseDir && !file.name.startsWith(baseDir)) continue
        const path = file.name.slice(baseDir.length)
        if (!path) continue
        entries.push({path, file: await file.async("blob")})
    }
    await replaceFiles(entries)
    return ok(undefined)
}

export async function replaceFile(path: string, file: Entry) {
    const files = syncWithMonaco()
    if (typeof file !== "string" && EDITABLE_TYPES.includes(pathlib.extname(path))) {
        file = await file.text()
    }
    files[path] = file
    fs.value = files
    syncToMonaco()
}

setInterval(() => {
    fs.value = syncWithMonaco()
}, 1000 * 60)
