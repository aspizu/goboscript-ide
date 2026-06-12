import {AppCodeEditor} from "@/features/editors/app-code-editor"
import {AppImageEditor} from "@/features/editors/app-image-editor"

export function AppEditor() {
    return (
        <div className="flex flex-col overflow-hidden px-2 pb-2">
            <div className="flex grow flex-col overflow-hidden rounded-md bg-[#1e1e1e] p-1">
                <AppCodeEditor />
                <AppImageEditor />
            </div>
        </div>
    )
}
