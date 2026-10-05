declare namespace VM {
    interface BaseTarget {
        deleteVariable(id: string): void
        createVariable(
            id: string,
            name: string,
            type: Variable["type"],
            isCloud?: boolean
        ): void
    }

    interface Blocks {
        createBlock(block: import("@/lib/sb3-blocks").Block): void
        deleteAllBlocks(): void
    }

    interface ExtensionManager {
        isBuiltinExtension(extensionId: string): boolean
    }
}
