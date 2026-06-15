import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Opens a browser file picker. */
export function filepicker(
    accept?: string | null,
    multiple?: "multiple" | null
): Promise<FileList | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = accept || ""
        input.multiple = !!multiple
        input.style.display = "none"
        input.oninput = (event) => {
            resolve((event.target as HTMLInputElement).files)
        }
        input.oncancel = () => resolve(null)
        document.body.append(input)
        input.click()
    })
}
