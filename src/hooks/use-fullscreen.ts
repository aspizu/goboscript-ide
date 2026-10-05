import {Signal, useSignalEffect} from "@preact/signals-react"
import {useEffect, useEffectEvent} from "react"

export function useFullscreen(
    state: Signal<boolean>,
    getElement: () => HTMLElement | null
) {
    useSignalEffect(() => {
        const element = getElement()
        if (state.value) {
            if (element && document.fullscreenElement !== element) {
                element.requestFullscreen().catch(() => {
                    state.value = false
                })
            }
        } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
        }
    })
    const listener = useEffectEvent(() => {
        const element = getElement()
        state.value = !!element && document.fullscreenElement === element
    })
    useEffect(() => {
        document.addEventListener("fullscreenchange", listener)
        return () => {
            document.removeEventListener("fullscreenchange", listener)
        }
    }, [])
}
