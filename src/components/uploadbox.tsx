import {cn} from "@/lib/utils"
import type {Signal} from "@preact/signals-react"
import {FolderOpenIcon, X} from "lucide-react"
import {useId} from "react"
import type {ChangeEvent, ComponentPropsWithoutRef, DragEvent, MouseEvent} from "react"

export function UploadBox({
    file,
    accept,
    className,
    ...props
}: {
    file: Signal<File | undefined>
    accept?: string
} & ComponentPropsWithoutRef<"div">) {
    const inputId = useId()
    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        event.stopPropagation()
        const droppedFile = event.dataTransfer.files?.[0]
        if (droppedFile) {
            file.value = droppedFile
        }
    }
    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        event.stopPropagation()
    }
    function handleClear(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault()
        event.stopPropagation()
        file.value = undefined
    }
    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        file.value = event.target.files?.[0]
    }
    return (
        <div
            className={cn(
                "border-input flex h-9 w-full min-w-0 items-center rounded-md border border-dashed bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
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
                id={inputId}
                className="hidden"
                accept={accept}
                onChange={handleInputChange}
            />
            <label
                htmlFor={inputId}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
            >
                <FolderOpenIcon className="text-muted-foreground size-4 shrink-0" />
                <span
                    className={cn("truncate", !file.value && "text-muted-foreground")}
                >
                    {file.value?.name ?? "Select file"}
                </span>
            </label>
            {file.value && (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground ml-2 flex size-6 shrink-0 items-center justify-center rounded-sm"
                    onClick={handleClear}
                    aria-label="Clear file"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    )
}
