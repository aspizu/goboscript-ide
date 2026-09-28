import assert from "node:assert/strict"
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {after, test} from "node:test"
import {pathToFileURL} from "node:url"
import {build} from "esbuild"
import JSZip from "jszip"
import * as compiler from "../goboscript/pkg/libgoboscript_bg.js"
import {__wbg_set_wasm as setWasm} from "../goboscript/pkg/libgoboscript_bg.js"

// Scaffolding installs its stylesheet on import. These tests run the VM without a renderer.
globalThis.self = globalThis
globalThis.window = globalThis
globalThis.document = {
    createElement: () => ({style: {}, getContext: () => null}),
    head: {appendChild() {}}
}
const {default: scaffolding} = await import("@turbowarp/scaffolding")
const {Packages} = scaffolding
const directory = await mkdtemp(join(tmpdir(), "goboscript-hot-reload-"))
after(async () => {
    await rm(directory, {recursive: true, force: true})
})
const bundle = await build({
    entryPoints: ["src/lib/hot-reload.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false
})
const bundlePath = join(directory, "hot-reload.cjs")
await writeFile(bundlePath, bundle.outputFiles[0].contents)
const {hotReload} = await import(pathToFileURL(bundlePath).href)

const wasm = await WebAssembly.compile(
    await readFile("goboscript/pkg/libgoboscript_bg.wasm")
)
const imports = Object.fromEntries(
    [...new Set(WebAssembly.Module.imports(wasm).map((entry) => entry.module))].map(
        (name) => [name, compiler]
    )
)
const instance = await WebAssembly.instantiate(wasm, imports)
setWasm(instance.exports)
compiler.initialize()

const source = `costumes "blank.svg";
var counter = 7;
list history = [4, 5];
onflag {
  clone;
  forever {
    tick;
    history[1] = counter;
    wait 0;
  }
}
proc tick {
  counter += 1;
}
`

await test("live updates keep target, clone, thread and variable objects while changing running code", async () => {
    const vm = new Packages.VM()
    vm.attachStorage(new Packages.Storage())
    vm.setCompilerOptions({enabled: false})
    let disposed = 0
    let started = 0
    vm.runtime.on("RUNTIME_DISPOSED", () => {
        disposed++
    })
    vm.runtime.on("PROJECT_START", () => {
        started++
    })
    try {
        for (const [index, code] of [
            source,
            source.replace("counter += 1", "counter += 10")
        ].entries()) {
            const files = Object.fromEntries(
                Object.entries({
                    "main.gs": code,
                    "stage.gs": 'costumes "blank.svg";\n',
                    "blank.svg":
                        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
                }).map(([name, contents]) => [
                    `project/${name}`,
                    {inner: Buffer.from(contents).toString("base64")}
                ])
            )
            const result = compiler.build({files})
            assert.deepEqual(
                result.artifact.sprites_diagnostics.get("main").diagnostics,
                []
            )
            const file = Uint8Array.from(Buffer.from(result.file, "base64")).buffer
            if (index === 0) {
                await vm.loadProject(file)
                vm.greenFlag()
                vm.runtime.frameLoop.stepCallback()
                continue
            }
            const target = vm.runtime.targets.find(
                (target) => !target.isStage && target.isOriginal
            )
            const clone = target.sprite.clones.find((target) => !target.isOriginal)
            assert(clone)
            const threads = [...vm.runtime.threads]
            const blocks = target.blocks
            const counter = target.variables.counter
            const history = target.variables.history
            const list = history.value
            target.setXY(100, -30)
            counter.value = 1000
            list[0] = 123
            clone.variables.counter.value = 42
            const disposalsBeforeReload = disposed
            const startsBeforeReload = started

            await hotReload(vm, file)

            assert.equal(disposed, disposalsBeforeReload)
            assert.equal(started, startsBeforeReload)
            assert(vm.runtime.targets.includes(target))
            assert(vm.runtime.targets.includes(clone))
            assert.deepEqual(vm.runtime.threads, threads)
            assert.equal(target.blocks, blocks)
            assert.equal(clone.blocks, blocks)
            assert.equal(target.variables.counter, counter)
            assert.equal(target.variables.history, history)
            assert.equal(history.value, list)
            assert.equal(counter.value, 1000)
            assert.equal(list[0], 123)
            assert.equal(clone.variables.counter.value, 42)
            assert.equal(target.x, 100)
            assert.equal(target.y, -30)
            for (let step = 0; step < 5; step++) vm.runtime.frameLoop.stepCallback()
            assert(counter.value > 1000)
            assert.equal((counter.value - 1000) % 10, 0)
            assert.equal(history.value[0], counter.value)
        }
    } finally {
        vm.clear()
        vm.quit()
    }
})

await test("new variables and lists initialize on clones, extensions load, and sprites can be added or removed", async () => {
    const vm = new Packages.VM()
    vm.attachStorage(new Packages.Storage())
    vm.setCompilerOptions({enabled: false})
    try {
        for (const phase of ["initial", "added", "removed"]) {
            const code =
                phase === "initial" ? source : (
                    source
                        .replace(
                            "var counter = 7;",
                            "var counter = 999; var added = 13; list new_history = [8, 9];"
                        )
                        .replace(
                            "wait 0;",
                            "say added; say new_history[1]; erase_all; wait 0;"
                        )
                )
            const sources = {
                "main.gs": code,
                "stage.gs": 'costumes "blank.svg";\n',
                "blank.svg":
                    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
            }
            if (phase === "added")
                sources["extra.gs"] = 'costumes "blank.svg"; onflag { started = 1; }\n'
            const files = Object.fromEntries(
                Object.entries(sources).map(([name, contents]) => [
                    `project/${name}`,
                    {inner: Buffer.from(contents).toString("base64")}
                ])
            )
            const result = compiler.build({files})
            for (const diagnostics of result.artifact.sprites_diagnostics.values()) {
                assert.deepEqual(diagnostics.diagnostics, [])
            }
            const file = Uint8Array.from(Buffer.from(result.file, "base64")).buffer
            if (phase === "initial") {
                await vm.loadProject(file)
                vm.greenFlag()
                vm.runtime.frameLoop.stepCallback()
                continue
            }
            const target = vm.runtime.targets.find(
                (target) => target.isOriginal && target.getName() === "main"
            )
            const clone = target.sprite.clones.find((target) => !target.isOriginal)
            const oldCounter = target.variables.counter.value
            await hotReload(vm, file)
            assert.equal(target.variables.counter.value, oldCounter)
            assert(vm.extensionManager.isExtensionLoaded("pen"))
            assert.equal(target.variables.added.value, 13)
            assert.equal(clone.variables.added.value, 13)
            assert.deepEqual(target.variables.new_history.value, [8, 9])
            assert.deepEqual(clone.variables.new_history.value, [8, 9])
            assert.notEqual(
                target.variables.new_history.value,
                clone.variables.new_history.value
            )
            const extra = vm.runtime.targets.find(
                (target) => target.getName() === "extra"
            )
            if (phase === "added") {
                assert(extra)
                vm.runtime.frameLoop.stepCallback()
                assert.equal(extra.variables.started.value, 1)
            } else {
                assert.equal(extra, undefined)
            }
        }
    } finally {
        vm.clear()
        vm.quit()
    }
})

await test("changing a scalar to a list and back replaces the value on targets and clones", async () => {
    const vm = new Packages.VM()
    vm.attachStorage(new Packages.Storage())
    vm.setCompilerOptions({enabled: false})
    try {
        for (const [index, declaration] of [
            "var value = 7;",
            "list value = [7, 8];",
            "var value = 11;"
        ].entries()) {
            const code = `costumes "blank.svg";
${declaration}
onflag {
  clone;
  forever {
    ${index === 1 ? "value[1] = 9;" : "value += 1;"}
    wait 0;
  }
}`
            const files = Object.fromEntries(
                Object.entries({
                    "main.gs": code,
                    "stage.gs": 'costumes "blank.svg";\n',
                    "blank.svg":
                        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
                }).map(([name, contents]) => [
                    `project/${name}`,
                    {inner: Buffer.from(contents).toString("base64")}
                ])
            )
            const result = compiler.build({files})
            assert.deepEqual(
                result.artifact.sprites_diagnostics.get("main").diagnostics,
                []
            )
            const file = Uint8Array.from(Buffer.from(result.file, "base64")).buffer
            if (index === 0) {
                await vm.loadProject(file)
                vm.greenFlag()
                vm.runtime.frameLoop.stepCallback()
                continue
            }
            const target = vm.runtime.targets.find(
                (target) => target.isOriginal && target.getName() === "main"
            )
            const clone = target.sprite.clones.find((target) => !target.isOriginal)
            assert(clone)
            await hotReload(vm, file)
            for (const updated of [target, clone]) {
                assert.equal(updated.variables.value.type, index === 1 ? "list" : "")
                assert.deepEqual(
                    updated.variables.value.value,
                    index === 1 ? [7, 8] : 11
                )
            }
            if (index === 1) {
                assert.notEqual(
                    target.variables.value.value,
                    clone.variables.value.value
                )
            }
            for (let step = 0; step < 5; step++) vm.runtime.frameLoop.stepCallback()
            if (index === 1) assert.equal(Number(target.variables.value.value[0]), 9)
            else assert(target.variables.value.value > 11)
        }
    } finally {
        vm.clear()
        vm.quit()
    }
})

await test("invalid block inputs leave the running project untouched", async () => {
    const vm = new Packages.VM()
    vm.attachStorage(new Packages.Storage())
    try {
        const target = new vm.exports.RenderedTarget(
            new vm.exports.Sprite(null, vm.runtime),
            vm.runtime
        )
        vm.runtime.addTarget(target)
        const blocks = target.blocks
        const zip = new JSZip()
        zip.file(
            "project.json",
            JSON.stringify({
                targets: [
                    {
                        name: "main",
                        isStage: false,
                        variables: {},
                        lists: {},
                        broadcasts: {},
                        blocks: {invalid: [999, "value"]}
                    }
                ]
            })
        )
        await assert.rejects(
            hotReload(vm, await zip.generateAsync({type: "arraybuffer"})),
            /Unknown SB3 primitive/
        )
        assert.deepEqual(vm.runtime.targets, [target])
        assert.equal(target.blocks, blocks)
    } finally {
        vm.clear()
        vm.quit()
    }
})
