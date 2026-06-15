import {AppPlayer} from "@/features/app-player"
import {AppPanes} from "@/features/app-panes"

export function AppPanel() {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col gap-2 pr-2 pb-2">
                <div className="flex h-full min-h-0 w-[480px] flex-col gap-2">
                    <AppPlayer />
                    <AppPanes />
                </div>
            </div>
        </div>
    )
}
