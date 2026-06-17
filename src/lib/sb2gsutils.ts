import type {FS} from "@/state"
import {err, ok, type Result} from "neverthrow"
import initSb2gs, {decompileAssetFiles, decompileCodeFiles} from "sb2gs-wasm"

await initSb2gs()

type JsResult<T> = {
    value?: T
    error?: string
}

function fromJsResult<T>(result: JsResult<T>): Result<T, string> {
    if (result.error) return err(result.error)
    if (result.value === undefined) return err("sb2gs returned no value")
    return ok(result.value)
}

export function decompile(
    input: Uint8Array
): Result<{path: string; file: FS.Entry}[], string> {
    const codeFiles = fromJsResult(
        decompileCodeFiles(input) as JsResult<Record<string, string>>
    )
    const assetFiles = fromJsResult(
        decompileAssetFiles(input) as JsResult<Record<string, Uint8Array>>
    )
    if (codeFiles.isErr()) return err(codeFiles.error)
    if (assetFiles.isErr()) return err(assetFiles.error)
    const codeEntries = Object.entries(codeFiles.value).map(([path, file]) => ({
        path,
        file
    }))
    const assetEntries = Object.entries(assetFiles.value).map(([path, file]) => ({
        path,
        file: new Blob([
            file.buffer.slice(
                file.byteOffset,
                file.byteOffset + file.byteLength
            ) as ArrayBuffer
        ])
    }))
    return ok([...codeEntries, ...assetEntries])
}
