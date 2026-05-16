import type {Signal} from "@preact/signals-react"
import {signal} from "@preact/signals-react"
import localforage from "localforage"

export async function localsignal<T>(key: string, initial: T): Promise<Signal<T>>
export async function localsignal<T>(key: string): Promise<Signal<T | undefined>>
export async function localsignal<U>(
    key: string,
    initial?: U
): Promise<Signal<U | undefined>> {
    const stored: {value: U} | null | undefined = await localforage.getItem(key)
    if (stored) initial = stored.value
    const state = signal(initial)
    state.subscribe((value) => {
        void localforage.setItem(key, {value})
    })
    return state
}
