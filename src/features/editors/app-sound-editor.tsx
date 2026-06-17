import {useObjectURL} from "@/hooks/use-object-url"
import {cn} from "@/lib/utils"
import {Editor, FS} from "@/state"
import * as pathlib from "path"

const EDITABLE: (string | undefined)[] = [".mp3", ".wav", ".ogg", ".m4a"]

export function AppSoundEditor() {
    const path = Editor.getOpenFile()
    const file = FS.getDefaultFile(path)
    const isEditable =
        path && typeof file != "string" && EDITABLE.includes(pathlib.extname(path))
    const objectURL = useObjectURL(file instanceof Blob ? file : null)
    return (
        <div
            className={cn(
                "grid grow place-items-center bg-[#1e1e1e] p-6",
                !isEditable && "hidden"
            )}
        >
            {objectURL && (
                <audio className="w-full max-w-xl" controls src={objectURL}>
                    <a href={objectURL}>Open sound</a>
                </audio>
            )}
        </div>
    )
}
