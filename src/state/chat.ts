import {streamChat, type ChatMessage} from "@/lib/chatbot"
import {localsignal} from "@/lib/localsignal"
import {signal} from "@preact/signals-react"

export const CHATBOT_URL = "https://goboscript-ide-proxy.aspizu.workers.dev"

export const messages = await localsignal<ChatMessage[]>("chat", [])
export const loading = signal(false)

export function getMessages() {
    return messages.value ?? []
}

export function addMessage(message: ChatMessage) {
    messages.value = [...getMessages(), message]
}

export function clearMessages() {
    messages.value = []
}

export async function sendMessage(content: string): Promise<undefined> {
    addMessage({role: "user", content})
    loading.value = true
    try {
        const conversation = getMessages()
        addMessage({role: "assistant", content: ""})
        for await (const chunk of streamChat(conversation)) {
            const msgs = getMessages()
            const last = msgs[msgs.length - 1]
            messages.value = [...msgs.slice(0, -1), {role: "assistant", content: last.content + chunk}]
        }
    } catch (e) {
        console.error("Chat error:", e)
        const msgs = getMessages()
        const last = msgs[msgs.length - 1]
        if (last?.role === "assistant" && last.content === "") {
            messages.value = [...msgs.slice(0, -1), {role: "assistant", content: "Error: failed to get response."}]
        } else {
            addMessage({role: "assistant", content: "Error: failed to get response."})
        }
    } finally {
        loading.value = false
    }
}