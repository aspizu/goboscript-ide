import {AppPlayer} from "@/features/app-player"
import {AppPanes} from "./app-panes"

export function AppPanel() {
    return (
        <div className="relative">
            <div className="absolute inset-0 flex flex-col gap-2 pr-2 pb-2">
                <AppPlayer />
                <AppPanes />
            </div>
        </div>
    )
}
