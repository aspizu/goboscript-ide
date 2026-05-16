import {useObjectURL} from "@/hooks/use-object-url"
import {cn} from "@/lib/utils"
import {Editor, FS} from "@/state"
import * as pathlib from "path"
import {useState} from "react"

const EDITABLE: (string | undefined)[] = [".png", ".jpg", ".jpeg", ".bmp", ".svg"]

export function AppImageEditor() {
    const path = Editor.getOpenFile()
    const file = FS.getDefaultFile(path)
    const isEditable =
        path && typeof file != "string" && EDITABLE.includes(pathlib.extname(path))
    const objectURL = useObjectURL(file instanceof Blob ? file : null)
    const [dimensions, setDimensions] = useState<{x: number; y: number} | null>(null)
    return (
        <div className={cn("relative grow overflow-hidden", !isEditable && "hidden")}>
            {objectURL && (
                <img
                    src={objectURL}
                    className="absolute top-[50%] left-[50%] h-full w-full -translate-x-[50%] -translate-y-[50%] object-contain"
                    onLoad={(event) => {
                        if (event.target instanceof HTMLImageElement) {
                            setDimensions({
                                x: event.target.naturalWidth,
                                y: event.target.naturalHeight
                            })
                        }
                    }}
                />
            )}
            {dimensions && (
                <div className="absolute right-0.25 bottom-0.25 rounded-md bg-white/90 px-1 text-sm font-medium text-foreground shadow-sm dark:bg-black dark:text-foreground">
                    {dimensions.x}x{dimensions.y}
                </div>
            )}
        </div>
    )
}
