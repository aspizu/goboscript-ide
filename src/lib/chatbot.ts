export interface ChatMessage {
    role: "user" | "assistant"
    content: string
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const response = await fetch(
        `https://proxy.aspiz.uk/https://71b76bbc-8ae0-4eba-a60b-e5402723634e.search.ai.cloudflare.com/chat/completions?cors-origin=${
            window.location.origin
        }&cors-headers=Content-Type&cors-max-age=86400&cors-methods=POST,OPTIONS`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({messages, stream: true})
        }
    )

    if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
        const {done, value} = await reader.read()
        if (done) break
        buffer += decoder.decode(value, {stream: true})
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") return
            try {
                const parsed = JSON.parse(data) as {
                    choices?: {delta?: {content?: string}}[]
                }
                const content = parsed.choices?.[0]?.delta?.content
                if (content) yield content
            } catch {
                // ignore malformed chunks
            }
        }
    }
}
