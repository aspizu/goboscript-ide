import {cn} from "@/lib/utils"
import {Editor, FS} from "@/state"
import {Editor as MonacoEditor, type EditorProps} from "@monaco-editor/react"
import * as $monaco from "monaco-editor"
import * as pathlib from "path"

const options: $monaco.editor.IStandaloneEditorConstructionOptions = {
    fontFamily: "Cascadia Code",
    fontSize: 12,
    fontLigatures: true,
    minimap: {enabled: false},
    cursorBlinking: "smooth",
    renderFinalNewline: "off"
}

export function AppCodeEditor(props: EditorProps) {
    const path = Editor.getOpenFile()
    const file = FS.getDefaultFile(path)
    const isEditable =
        typeof file == "string" && (!path || pathlib.extname(path) !== ".level")
    return (
        <div className={cn("grow overflow-hidden", !isEditable && "hidden")}>
            <MonacoEditor
                {...props}
                className="overflow-hidden"
                theme="vs"
                options={options}
                path={isEditable ? `urn:${path}` : undefined}
                defaultValue={isEditable ? file : undefined}
                onMount={Editor.onMount}
            />
        </div>
    )
}
