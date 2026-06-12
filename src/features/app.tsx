import {SidebarProvider} from "@/components/ui/sidebar"
import {AppEditor} from "@/features/app-editor"
import {AppHeader} from "@/features/app-header"
import {AppPanel} from "@/features/app-panel"
import {AppSidebar} from "@/features/app-sidebar"
import {cn} from "@/lib/utils"
import {panelOpen} from "@/state"

export function App() {
    return (
        <SidebarProvider className="h-dvh">
            <AppSidebar />
            <div className="flex grow flex-col">
                <AppHeader />
                <div
                    className={cn(
                        "grid grow overflow-hidden transition-all duration-200 ease-linear",
                        panelOpen.value ?
                            "grid-cols-[auto_calc(480px+var(--spacing)*2)]"
                        :   "grid-cols-[auto_0px]"
                    )}
                >
                    <AppEditor />
                    <AppPanel />
                </div>
            </div>
        </SidebarProvider>
    )
}
