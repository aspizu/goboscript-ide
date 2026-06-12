import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"
import type {Signal} from "@preact/signals-react"
import {FolderOpenIcon, X} from "lucide-react"
import type {ComponentPropsWithoutRef} from "react"

export function UploadBox({
    file,
    accept,
    className,
    ...props
}: {
    file: Signal<File | undefined>
    accept?: string
} & ComponentPropsWithoutRef<"div">) {
    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        e.stopPropagation()
        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            file.value = droppedFile
        }
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        e.stopPropagation()
    }

    function handleClear() {
        file.value = undefined
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        file.value = e.target.files?.[0]
    }

    function triggerFileInput() {
        document.getElementById("file-upload")?.click()
    }

    return (
        <div
            className={cn(
                "flex aspect-video items-center justify-center rounded-lg border border-dashed text-center transition-colors",
                file.value ?
                    "border-primary bg-primary/10"
                :   "border-muted-foreground/50 hover:border-muted-foreground/80",
                className
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            {...props}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={accept}
                onChange={handleInputChange}
            />

            {file.value ?
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{file.value.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleClear}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="secondary" onClick={triggerFileInput}>
                        Replace File
                    </Button>
                </div>
            :   <div className="flex flex-col items-center gap-4">
                    <FolderOpenIcon className="text-muted-foreground size-7" />
                    <div className="space-y-1">
                        <p className="font-medium">Drag and drop your file here</p>
                        <p className="text-muted-foreground text-sm">
                            or click to browse files
                        </p>
                    </div>
                    <Button variant="secondary" onClick={triggerFileInput}>
                        Select File
                    </Button>
                </div>
            }
        </div>
    )
}
