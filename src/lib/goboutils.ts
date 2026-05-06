import type {FS} from "@/state"
import Worker from "@/workers/goboscript?worker"
import * as goboscript from "goboscript"
import * as monaco from "monaco-editor"
import {MarkerSeverity, Uri} from "monaco-editor"

goboscript.initialize()

let parser: Record<string, string[]> = {}

export function updateParser(files: [string, FS.Entry][]) {
    parser = {}
    for (const [path, file] of files) {
        if (typeof file != "string" || !path.endsWith(".gs")) continue
        parser[path] = file.split("\n")
        parser[path].push("")
    }
}

export function translatePosition(
    unit: goboscript.TranslationUnit,
    position: number
): [number, goboscript.Include] {
    for (const inc of unit.includes) {
        if (inc.unit_range.start > position) continue
        if (inc.unit_range.end <= position) continue
        return [inc.source_range.start + (position - inc.unit_range.start), inc]
    }
    throw new Error(`invalid position ${position} in ${unit.path}`)
}

export function convertPosition(include: goboscript.Include, position: number) {
    const text = parser[include.path.slice("project/".length)]
    let i = 0
    let lineNumber = 0
    for (const line of text) {
        if (i + line.length >= position) return [lineNumber + 1, position - i + 1]
        i += line.length + 1
        lineNumber++
    }
    return [0, 0] as const
}

export function diagnosticToMarker(
    unit: goboscript.TranslationUnit,
    sprite: goboscript.Sprite,
    diagnostic: goboscript.Diagnostic
): monaco.editor.IMarkerData & {uri: Uri} {
    const message = goboscript.diagnostic_to_string(diagnostic, sprite)
    const [start, incStart] = translatePosition(unit, diagnostic.span.start)
    const [end, incEnd] = translatePosition(unit, diagnostic.span.end)
    const [startLineNumber, startColumn] = convertPosition(incStart, start)
    const [endLineNumber, endColumn] = convertPosition(incEnd, end)
    return {
        uri: Uri.parse(`urn:${incStart.path.slice("project/".length)}`),
        /* TODO: get severity from goboscript */
        severity: MarkerSeverity.Error,
        message,
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
    }
}

const worker = new Worker({name: "goboscript"})

export function build(fs: goboscript.MemFS): Promise<goboscript.Build> {
    return new Promise((resolve) => {
        worker.onmessage = (event) => resolve(event.data as goboscript.Build)
        worker.postMessage(fs)
    })
}

export function getSourceLocation(
    {project, sprites_diagnostics, stage_diagnostics}: goboscript.Artifact,
    targetName: string,
    blockID: string
) {
    let sprite: goboscript.Sprite | undefined = project.stage
    if (targetName != "Stage") sprite = project.sprites.get(targetName)
    if (!sprite) return
    let diagnostics: goboscript.SpriteDiagnostics | undefined = stage_diagnostics
    if (targetName != "Stage") diagnostics = sprites_diagnostics.get(targetName)
    if (!diagnostics) return
    const {translation_unit, debug_info} = diagnostics
    const span = debug_info.blocks.get(`"${blockID}"`)
    if (!span) return
    const [start, incStart] = translatePosition(translation_unit, span.start)
    return [convertPosition(incStart, start), incStart] as const
}
