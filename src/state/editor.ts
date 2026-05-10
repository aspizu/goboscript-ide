// oxlint-disable typescript/no-unsafe-argument
// oxlint-disable typescript/no-unsafe-assignment
// oxlint-disable typescript/no-unsafe-type-assertion

import {localsignal} from "@/lib/localsignal"
import * as syntax from "@/lib/syntax"
import type {useMonaco} from "@monaco-editor/react"
import type {Signal} from "@preact/signals-react"
import {signal} from "@preact/signals-react"
import * as $monaco from "monaco-editor"

export const editor = signal() as Signal<$monaco.editor.IStandaloneCodeEditor>
export const monaco = signal() as Signal<NonNullable<ReturnType<typeof useMonaco>>>
export const openFile = await localsignal<string | undefined>("openFile", "main.gs")

export function getOpenFile() {
    return openFile.value
}

export function setOpenFile(path: string) {
    openFile.value = path
    setTimeout(() => {
        editor.value.focus()
    }, 0)
}

export function close() {
    openFile.value = undefined
}

export function onMount($editor: any, $monaco: any) {
    editor.value = $editor
    monaco.value = $monaco
    syntax.register($monaco)
}
