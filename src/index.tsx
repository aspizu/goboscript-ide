import "@fontsource/comic-neue/400.css"
import "@fontsource/comic-neue/700.css"
import "@fontsource/comic-mono/400.css"
import "@fontsource/comic-mono/700.css"

import "@/styles/index.css"

import {App} from "@/features/app"
import {createRoot} from "react-dom/client"

const root = document.getElementById("root") as HTMLDivElement
createRoot(root).render(<App />)
