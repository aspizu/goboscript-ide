import {SidebarProvider} from "@/components/ui/sidebar"
import {Toaster} from "@/components/ui/sonner"
import {AppEditor} from "@/features/app-editor"
import {AppHeader} from "@/features/app-header"
import {AppPanel} from "@/features/app-panel"
import {AppSidebar} from "@/features/app-sidebar"
import {cn} from "@/lib/utils"
import {panelOpen, Project} from "@/state"
import {useSignal} from "@preact/signals-react"
import {useCallback, useEffect} from "react"

const minimumRunLoadingMs = 300

function isMacosOrIosAgent() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}

function useKeyPress(key: string, callback: (event: KeyboardEvent) => void) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key.toLowerCase() !== key || event.repeat) return
            callback(event)
        }
        window.addEventListener("keydown", handleKeyDown, true)
        return () => window.removeEventListener("keydown", handleKeyDown, true)
    }, [callback, key])
}

export function App() {
    const loading = useSignal(false)
    const macosOrIosAgent = isMacosOrIosAgent()
    const runShortcut = macosOrIosAgent ? "⌘↩" : "Ctrl↩"
    const projectPanelShortcut = macosOrIosAgent ? "⇧⌘B" : "Ctrl⇧B"
    const runProject = useCallback(() => {
        if (loading.value) return
        const startedAt = performance.now()
        loading.value = true
        void Project.buildProject()
            .then(() =>
                Project.scaffolding
                    .loadProject(Project.getProject()!)
                    .then(() => Project.scaffolding.greenFlag())
                    .catch(() => {})
            )
            .finally(() => {
                const remainingLoadingMs =
                    minimumRunLoadingMs - (performance.now() - startedAt)
                if (remainingLoadingMs <= 0) {
                    loading.value = false
                    return
                }
                window.setTimeout(() => {
                    loading.value = false
                }, remainingLoadingMs)
            })
    }, [loading])
    const runProjectWithKeyboard = useCallback(
        (event: KeyboardEvent) => {
            if (macosOrIosAgent && !event.metaKey) return
            if (!macosOrIosAgent && !event.ctrlKey) return
            event.preventDefault()
            event.stopPropagation()
            runProject()
        },
        [macosOrIosAgent, runProject]
    )
    useKeyPress("Enter", runProjectWithKeyboard)
    const toggleProjectPanelWithKeyboard = useCallback(
        (event: KeyboardEvent) => {
            if (macosOrIosAgent && !event.metaKey) return
            if (!macosOrIosAgent && !event.ctrlKey) return
            if (!event.shiftKey) return
            event.preventDefault()
            event.stopPropagation()
            panelOpen.value = !panelOpen.value
        },
        [macosOrIosAgent]
    )
    useKeyPress("b", toggleProjectPanelWithKeyboard)
    return (
        <SidebarProvider className="h-dvh">
            <Toaster />
            <AppSidebar />
            <div className="flex grow flex-col">
                <AppHeader
                    loading={loading.value}
                    onRun={runProject}
                    projectPanelShortcut={projectPanelShortcut}
                    runShortcut={runShortcut}
                />
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
