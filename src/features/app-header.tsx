import {Button} from "@/components/ui/button"
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Spinner} from "@/components/ui/spinner"
import {AppMenubar} from "@/features/app-menubar"
import {panelOpen, playerFullscreen, Project} from "@/state"
import {
    CornerDownLeftIcon,
    FlagIcon,
    Maximize2Icon,
    OctagonXIcon,
    PanelRightIcon
} from "lucide-react"

type _AppHeaderProps = {
    loading: boolean
    onRun: () => void
    projectPanelShortcut: string
    runShortcut: string
}

export function AppHeader(props: _AppHeaderProps) {
    return (
        <div className="flex gap-2 p-2">
            <SidebarTrigger />
            <AppMenubar
                onRun={props.onRun}
                projectPanelShortcut={props.projectPanelShortcut}
                runShortcut={props.runShortcut}
            />
            <div className="flex w-[480px] gap-2">
                <Button
                    className="h-7 px-2.5 has-[>svg]:px-2.5"
                    onClick={() => {
                        props.onRun()
                    }}
                    disabled={props.loading}
                >
                    <span>Run</span>
                    {props.loading ?
                        <Spinner
                            size="small"
                            className="text-primary-foreground size-4"
                        />
                    :   <CornerDownLeftIcon />}
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
