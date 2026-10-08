import {Button} from "@/components/ui/button"
import {Console} from "@/state"
import {useSignal, type Signal} from "@preact/signals-react"
import {ListXIcon} from "lucide-react"
import {type ReactNode} from "react"
import {AppConsolePane} from "./panes/app-console-pane"
import {AppLearnPane} from "./panes/app-learn-pane"

function PaneButton({
    activePane,
    value,
    children
}: {
    activePane: Signal<string>
    value: string
    children: ReactNode
}) {
    return (
        <Button
            size="sm"
            variant={activePane.value === value ? "secondary" : "ghost"}
            className="h-7 px-2"
            aria-pressed={activePane.value === value}
            onClick={() => (activePane.value = value)}
        >
            {children}
        </Button>
    )
}

export function AppPanes() {
    const activePane = useSignal("console")
    const consoleLength = Console.getMessages().filter(
        (msg) => msg.severity === "error" || msg.severity === "warn"
    ).length
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex gap-1">
                <PaneButton activePane={activePane} value="console">
                    Console
                    {consoleLength > 0 && (
                        <span className="text-primary rounded-full bg-red-500/75 px-1 text-xs font-medium">
                            {consoleLength}
                        </span>
                    )}
                </PaneButton>
                <PaneButton activePane={activePane} value="learn">
                    Learn
                </PaneButton>
                <div className="grow" />
                {activePane.value === "console" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={Console.removeAllMessages}
                        className="size-6"
                    >
                        <ListXIcon />
                    </Button>
                )}
            </div>
            <AppConsolePane hidden={activePane.value !== "console"} />
            <AppLearnPane hidden={activePane.value !== "learn"} />
        </div>
    )
}
