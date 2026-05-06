import * as base64 from "@/lib/base64"
import {attachDebugger} from "@/lib/debugger"
import * as goboutils from "@/lib/goboutils"
import {localsignal} from "@/lib/localsignal"
import {Console, FS} from "@/state"
import {monaco} from "@/state/editor"
import {batch} from "@preact/signals-react"
import {Scaffolding} from "@turbowarp/scaffolding"
import * as goboscript from "goboscript"
import {MarkerSeverity} from "monaco-editor"

export const scaffolding = new Scaffolding()
scaffolding.width = 480
scaffolding.height = 360
scaffolding.resizeMode = "preserve-ratio"
scaffolding.shouldConnectPeripherals = true
scaffolding.editableLists = false
scaffolding.usePackagedRuntime = false
scaffolding.setup()
attachDebugger(scaffolding.vm)

const artifact = await localsignal<goboscript.Artifact & {file: ArrayBuffer}>(
    "artifact"
)

export function getArtifact(): goboscript.Artifact | undefined {
    return artifact.value
}

export function getProject() {
    return artifact.value?.file
}

export async function buildProject() {
    const fs = FS.getFiles()
    goboutils.updateParser(fs)
    const files: Record<string, {inner: string}> = {}
    for (let [path, file] of fs) {
        if (path.endsWith(".gs") && typeof file === "string") file += "\n"
        const inner = base64.encode(typeof file == "string" ? new Blob([file]) : file)
        files[`project/${path}`] = {inner: await inner}
    }
    if (!("project/stage.gs" in files)) return
    const build = await goboutils.build({files} as unknown as goboscript.MemFS)
    monaco.value.editor.removeAllMarkers("goboscript")
    const {project, sprites_diagnostics, stage_diagnostics} = build.artifact
    const markers = stage_diagnostics.diagnostics.map((diagnostic) =>
        goboutils.diagnosticToMarker(
            stage_diagnostics.translation_unit,
            project.stage,
            diagnostic
        )
    )
    for (const [name, diagnostics] of sprites_diagnostics.entries()) {
        const sprite = project.sprites.get(name)!
        for (const diagnostic of diagnostics.diagnostics) {
            const marker = goboutils.diagnosticToMarker(
                diagnostics.translation_unit,
                sprite,
                diagnostic
            )
            markers.push(marker)
        }
    }
    const grouped = Object.groupBy(markers, (marker) => marker.uri.path)
    for (const markers of Object.values(grouped)) {
        if (!markers) continue
        const model = monaco.value.editor.getModel(markers[0].uri)
        if (!model) continue
        monaco.value.editor.setModelMarkers(model, "goboscript", markers)
    }
    const file = await base64.decode(build.file as unknown as string).arrayBuffer()
    batch(() => {
        artifact.value = {...build.artifact, file}
        markers.sort((a, b) => a.uri.path.localeCompare(b.uri.path))
        const messages = markers.map(
            (marker) =>
                ({
                    severity:
                        marker.severity == MarkerSeverity.Error ? "error"
                        : marker.severity == MarkerSeverity.Warning ? "warn"
                        : "log",
                    message: marker.message,
                    path: marker.uri.path,
                    lineNumber: marker.startLineNumber
                }) as const
        )
        Console.setMessages(messages)
    })
}
