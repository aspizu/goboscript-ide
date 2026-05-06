import {cn} from "@/lib/utils"
import {Console, Editor, FS} from "@/state"
import {editor} from "@/state/editor"
import {InfoIcon, TriangleAlertIcon, XCircleIcon} from "lucide-react"
import {useLayoutEffect, useRef} from "react"

function Message({severity, message, path, lineNumber}: Console.Message) {
    function activate() {
        if (FS.exists(path)) {
            Editor.setOpenFile(path)
            setTimeout(() => {
                editor.value.focus()
                editor.value.setPosition({lineNumber, column: 1})
            }, 0)
        }
    }
    const Icon = {
        error: XCircleIcon,
        warn: TriangleAlertIcon,
        log: InfoIcon
    }[severity]
    return (
        <div
            className={cn(
                "flex items-start gap-1 rounded-md px-2 py-1 font-mono transition-colors",
                severity == "error" &&
                    "bg-destructive/20 hover:bg-destructive/25 text-destructive",
                severity == "warn" &&
                    "bg-amber-300/20 text-amber-300 hover:bg-amber-300/25",
                severity == "log" && "text-muted-foreground hover:bg-muted/50"
            )}
        >
            <Icon className="size-5 shrink-0 pr-1" />
            <pre className={cn("mr-auto block self-center text-xs text-wrap")}>
                {message}
            </pre>
            <button
                className={cn(
                    "cursor-pointer text-[0.6rem] underline underline-offset-2"
                )}
                onClick={activate}
            >
                {path}:{lineNumber}
            </button>
        </div>
    )
}

export function AppConsolePane() {
    const ref = useRef<HTMLDivElement>(null)
    const messages = Console.getMessages()
    useLayoutEffect(() => {
        if (!ref.current) return
        ref.current.scrollTo({top: ref.current.scrollHeight, behavior: "smooth"})
    }, [messages])
    return (
        <div className="flex flex-col gap-1 overflow-y-scroll" ref={ref}>
            <div className="flex flex-col gap-1">
                {messages.map((message, i) => (
                    <Message key={i} {...message} />
                ))}
            </div>
        </div>
    )
}
