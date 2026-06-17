// @ts-ignore
export const SUPPORTS_TRUE_SAVE_AS = !!window.showSaveFilePicker

export async function trueSaveAs(
    file: Blob,
    opts: {
        suggestedName: string
        types: {description: string; accept: Record<string, string[]>}[]
    }
): Promise<void> {
    try {
        // @ts-ignore
        const handle: FileSystemFileHandle = await showSaveFilePicker(opts)
        const writable = await handle.createWritable()
        await writable.write(file)
        await writable.close()
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        // @ts-ignore
        console.error(error.stack)
    }
}
