import {localsignal} from "@/lib/localsignal"
import {signal} from "@preact/signals-react"

export * as Console from "./console"
export * as Editor from "./editor"
export * as FS from "./fs"
export * as Project from "./project"

export const panelOpen = await localsignal("panelOpen", true)
export const playerFullscreen = signal(false)
