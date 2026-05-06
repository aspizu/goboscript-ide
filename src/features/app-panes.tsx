import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"
import {Console} from "@/state"
import {ListXIcon} from "lucide-react"
import {useState, type ReactNode} from "react"
import {AppChatPane} from "./panes/app-chat-pane"
import {AppConsolePane} from "./panes/app-console-pane"

const tabs = ["console", "chat"] as const
type Tab = (typeof tabs)[number]

function TabButton(props: {
    value: Tab
    tab: Tab
    setTab: (tab: Tab) => void
    children: ReactNode
}) {
    const isActive = props.tab == props.value
    return (
        <Button
            onClick={() => props.setTab(props.value)}
            size="sm"
            className={cn(!isActive && "text-primary/75 bg-transparent", "h-7 px-2")}
            variant="secondary"
        >
            {props.children}
        </Button>
    )
}

export function AppPanes() {
    const consoleLength = Console.getMessages().filter(
        (msg) => msg.severity === "error" || msg.severity === "warn"
    ).length
    const [tab, setTab] = useState<Tab>("console")
    return (
        <div className="flex flex-col gap-2 overflow-hidden">
            <div className="flex gap-1">
                <TabButton tab={tab} value="console" setTab={setTab}>
                    Console
                    {consoleLength > 0 && (
                        <span className="text-primary rounded-full bg-red-500/75 px-1 text-xs font-medium">
                            {consoleLength}
                        </span>
                    )}
                </TabButton>
                <TabButton tab={tab} value="chat" setTab={setTab}>
                    Chat
                </TabButton>
                <div className="grow" />
                {tab == "console" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={Console.removeAllMessages}
                        className="ml-auto size-6"
                    >
                        <ListXIcon />
                    </Button>
                )}
            </div>
            {tab == "console" && <AppConsolePane />}
            {tab == "chat" && <AppChatPane />}
        </div>
    )
}
