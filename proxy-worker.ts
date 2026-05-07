export default {
    async fetch(request: Request): Promise<Response> {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                },
            })
        }
        const url = "https://71b76bbc-8ae0-4eba-a60b-e5402723634e.search.ai.cloudflare.com/chat/completions"
        const upstream = await fetch(url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        })
        const response = new Response(upstream.body, upstream)
        response.headers.set("Access-Control-Allow-Origin", "*")
        return response
    },
}