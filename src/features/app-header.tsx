import {Button} from "@/components/ui/button"
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Spinner} from "@/components/ui/spinner"
import {AppMenubar} from "@/features/app-menubar"
import {panelOpen, playerFullscreen, Project} from "@/state"
import {useSignal} from "@preact/signals-react"
import {
    FlagIcon,
    Maximize2Icon,
    OctagonXIcon,
    PanelRightIcon,
    PlayIcon
} from "lucide-react"

export function AppHeader() {
    const loading = useSignal(false)
    async function onFlag() {
        loading.value = true
        await Project.buildProject()
        await Project.scaffolding
            .loadProject(Project.getProject()!)
            .then(() => Project.scaffolding.greenFlag())
            .catch(() => {})
        loading.value = false
    }
    return (
        <div className="flex gap-2 p-2">
            <SidebarTrigger />
            <AppMenubar />
            <div className="flex w-[480px] gap-2">
                <Button
                    size="icon"
                    className="size-7"
                    onClick={() => { void onFlag() }}
                    disabled={loading.value}
                >
                    {loading.value ?
                        <Spinner size="small" />
                    :   <PlayIcon />}
                </Button>
                <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    onClick={() => Project.scaffolding.greenFlag()}
                >
                    <FlagIcon className="text-green-200" />
                </Button>
                <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    onClick={() => Project.scaffolding.stopAll()}
                >
                    <OctagonXIcon className="text-red-200" />
                </Button>
                <div className="grow" />
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => (panelOpen.value = !panelOpen.value)}
                >
                    <PanelRightIcon />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => (playerFullscreen.value = !playerFullscreen.value)}
                >
                    <Maximize2Icon />
                </Button>
            </div>
        </div>
    )
}
