import {AppCodeEditor} from "@/features/editors/app-code-editor"
import {AppImageEditor} from "@/features/editors/app-image-editor"
import {AppLevelEditor} from "@/features/editors/app-level-editor"

export function AppEditor() {
    return (
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden px-2 pb-2">
            <div className="flex min-h-0 min-w-0 grow flex-col overflow-hidden rounded-md bg-white p-1 dark:bg-[#1e1e1e]">
                <AppCodeEditor />
                <AppImageEditor />
                <AppLevelEditor />
            </div>
        </div>
    )
}
