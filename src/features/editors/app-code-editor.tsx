import {cn} from "@/lib/utils"
import {Spinner} from "@/components/ui/spinner"
import {Editor, FS, livecodingMode} from "@/state"
import {Editor as MonacoEditor, type EditorProps} from "@monaco-editor/react"
import * as $monaco from "monaco-editor"

const options: $monaco.editor.IStandaloneEditorConstructionOptions = {
    fontFamily: "Comic Mono",
    fontSize: 12,
    fontLigatures: true,
    minimap: {enabled: false},
    cursorBlinking: "smooth",
    renderFinalNewline: "off"
}

export function AppCodeEditor(props: EditorProps) {
    const path = Editor.getOpenFile()
    const file = FS.getDefaultFile(path)
    const isEditable = typeof file == "string"
    return (
        <div
            className={cn(
                "grow overflow-hidden rounded-md p-1",
                livecodingMode.value ? "livecoding-editor" : "bg-[#1e1e1e]",
                !isEditable && "hidden"
            )}
        >
            <MonacoEditor
                {...props}
                className="overflow-hidden"
                loading={<Spinner />}
                theme={livecodingMode.value ? "livecoding" : "goboscript-dark"}
                options={options}
                path={isEditable ? `urn:${path}` : undefined}
                defaultValue={isEditable ? file : undefined}
                beforeMount={Editor.onBeforeMount}
                onMount={Editor.onMount}
            />
        </div>
    )
}
