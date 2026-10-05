declare class Scaffolding {
    width: number
    height: number
    resizeMode: "preserve-ratio" | "dynamic-resize" | "stretch"
    editableLists: boolean
    shouldConnectPeripherals: boolean
    usePackagedRuntime: boolean
    setup(): void
    appendTo(element: HTMLElement): void
    relayout(): void
    loadProject(project: ArrayBuffer | Uint8Array): Promise<void>
    greenFlag(): void
    stopAll(): void
    vm: VM
}

declare module "@turbowarp/scaffolding" {
    export {Scaffolding}
}

declare module "@turbowarp/scaffolding/with-music" {
    export {Scaffolding}
}
