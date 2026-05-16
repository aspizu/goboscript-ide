import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea
} from "@/components/ui/input-group"
import {Chat} from "@/state"
import {CornerDownLeftIcon, LoaderCircleIcon} from "lucide-react"
import {useLayoutEffect, useRef, useState} from "react"
import {Streamdown} from "streamdown"

export function AppChatPane() {
    const messages = Chat.getMessages()
    const loading = Chat.loading.value
    const [input, setInput] = useState("")
    const bottomRef = useRef<HTMLDivElement>(null)

    const lastContent = messages[messages.length - 1]?.content
    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages.length, lastContent])

    function send() {
        const trimmed = input.trim()
        if (!trimmed || loading) return
        setInput("")
        void Chat.sendMessage(trimmed)
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    return (
        <div
            className="flex flex-col overflow-hidden"
            style={{flex: "1 1 0", minHeight: 0}}
        >
            <div
                className="space-y-1 overflow-x-hidden overflow-y-auto"
                style={{flex: "1 1 0", minHeight: 0}}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={
                            msg.role === "user"
                                ? "flex justify-end"
                                : "flex justify-start"
                        }
                    >
                        <div
                            className={
                                msg.role === "user"
                                    ? "bg-primary/15 max-w-[85%] rounded-md px-2 py-1 text-sm break-words"
                                    : "max-w-full min-w-0 overflow-hidden text-sm"
                            }
                        >
                            {msg.role === "user" ? (
                                msg.content
                            ) : (
                                <Streamdown animated>{msg.content}</Streamdown>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <InputGroup className="mt-2 shrink-0">
                <InputGroupTextarea
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setInput(e.target.value)
                    }
                    onKeyDown={onKeyDown}
                    placeholder="Message..."
                    rows={3}
                    disabled={loading}
                />
                <InputGroupAddon align="block-end" className="justify-end">
                    <InputGroupButton
                        variant="default"
                        onClick={send}
                        disabled={loading}
                    >
                        {loading ? (
                            <LoaderCircleIcon className="animate-spin" />
                        ) : (
                            <CornerDownLeftIcon />
                        )}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    )
}
