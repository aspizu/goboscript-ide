import {AppPlayer} from "@/features/app-player"
import {AppCodeEditor} from "@/features/editors/app-code-editor"
import {AppImageEditor} from "@/features/editors/app-image-editor"
import {AppSoundEditor} from "@/features/editors/app-sound-editor"
import {livecodingMode} from "@/state"

export function AppEditor() {
    return (
        <div className="flex flex-col overflow-hidden px-2 pb-2">
            <div className="relative isolate flex grow flex-col">
                {livecodingMode.value && (
                    <AppPlayer className="absolute inset-0 -z-10 h-full w-full" />
                )}
                <AppCodeEditor />
                <AppImageEditor />
                <AppSoundEditor />
            </div>
        </div>
    )
}
