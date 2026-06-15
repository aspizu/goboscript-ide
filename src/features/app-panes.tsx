import {Button} from "@/components/ui/button"
import {Console} from "@/state"
import {ListXIcon} from "lucide-react"
import {AppConsolePane} from "./panes/app-console-pane"

export function AppPanes() {
    const consoleLength = Console.getMessages().filter(
        (msg) => msg.severity === "error" || msg.severity === "warn"
    ).length
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex gap-1">
                <Button size="sm" className="h-7 px-2" variant="secondary">
                    Console
                    {consoleLength > 0 && (
                        <span className="text-primary rounded-full bg-red-500/75 px-1 text-xs font-medium">
                            {consoleLength}
                        </span>
                    )}
                </Button>
                <div className="grow" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={Console.removeAllMessages}
                    className="size-6"
                >
                    <ListXIcon />
                </Button>
            </div>
            <AppConsolePane />
        </div>
    )
}
