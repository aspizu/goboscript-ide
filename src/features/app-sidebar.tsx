import {Button} from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub
} from "@/components/ui/sidebar"
import {getCodeIcon} from "@/lib/codeicons"
import {cn, filepicker} from "@/lib/utils"
import {Editor, FS} from "@/state"
import {useSignal, type Signal} from "@preact/signals-react"
import {saveAs} from "file-saver"
import {
    BoxIcon,
    BracesIcon,
    CogIcon,
    FileIcon,
    FolderIcon,
    ImageIcon,
    PenToolIcon
} from "lucide-react"
import * as pathlib from "path"

function getFileIcon(path: string) {
    if (/^[^/]*\.gs$/.test(path)) return BoxIcon
    if (path == "goboscript.toml") return CogIcon
    if (path.endsWith(".gs")) return BracesIcon
    if (path.endsWith(".svg")) return PenToolIcon
    if (/\.(bmp|png|jpg|jpeg)$/.test(path)) return ImageIcon
    const codeIcon = getCodeIcon(pathlib.extname(path).slice(1))
    if (codeIcon) return codeIcon
    return FileIcon
}

function getFileColor(path: string) {
    if (path == "stage.gs") return cn("text-cyan-600 dark:text-cyan-200")
    if (/^[^/]*\.gs$/.test(path)) return cn("text-blue-600 dark:text-blue-200")
    if (path == "goboscript.toml") return cn("text-green-600 dark:text-green-200")
    if (path.endsWith(".gs")) return cn("text-red-600 dark:text-red-200")
    if (path.endsWith(".svg")) return cn("text-purple-600 dark:text-purple-200")
    if (/\.(bmp|png|jpg|jpeg)$/.test(path))
        return cn("text-emerald-600 dark:text-emerald-200")
    return cn("text-muted-foreground")
}

function RenameDialog({
    open,
    path,
    isDirectory
}: {
    open: Signal<boolean>
    path: string
    isDirectory?: boolean
}) {
    const newPath = useSignal(path)
    function onRename() {
        if (isDirectory) return FS.renameDirectory(path, newPath.value)
        FS.renameFile(path, newPath.value)
        if (Editor.getOpenFile() == path) Editor.setOpenFile(newPath.value)
    }
    return (
        <Dialog open={open.value} onOpenChange={(value) => (open.value = value)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename {pathlib.basename(path)}</DialogTitle>
                    <DialogDescription>Enter a full absolute path</DialogDescription>
                </DialogHeader>
                <Input
                    value={newPath.value}
                    onChange={(event) => (newPath.value = event.target.value)}
                />
                <DialogFooter>
                    <Button onClick={onRename}>Rename</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteDialog({
    open,
    path,
    isDirectory = false
}: {
    open: Signal<boolean>
    path: string
    isDirectory?: boolean
}) {
    function onDelete() {
        if (isDirectory) {
            FS.removeDirectory(path)
            if (Editor.getOpenFile()?.startsWith(path)) Editor.close()
        } else {
            FS.removeFile(path)
            if (Editor.getOpenFile() == path) Editor.close()
        }
    }
    return (
        <Dialog open={open.value} onOpenChange={(value) => (open.value = value)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete {pathlib.basename(path)}?</DialogTitle>
                    <DialogDescription>This action cannot be undone!</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="destructive" onClick={onDelete}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EntryContextMenu({
    path,
    isRenameDialogOpen,
    isDeleteDialogOpen,
    isDirectory,
    open,
    children
}: {
    path: string
    isRenameDialogOpen: Signal<boolean>
    isDeleteDialogOpen: Signal<boolean>
    isDirectory?: boolean
    open: Signal<boolean>
    children: React.ReactNode
}) {
    async function onSaveAs() {
        if (!isDirectory) return saveAs(FS.getFile(path)!, pathlib.basename(path))
        saveAs(await FS.getDirectoryAsZip(path), pathlib.basename(path) + ".zip")
    }
    function onDuplicate() {
        const entry = {path, file: FS.getFile(path)!}
        const extension = pathlib.extname(path)
        const filename = pathlib.basename(path)
        const basename = `${path.slice(0, -filename.length)}${filename.slice(0, -extension.length)}`
        entry.path = `${basename} copy${extension}`
        let i = 2
        while (FS.exists(entry.path)) {
            entry.path = `${basename} copy ${i}${extension}`
            i++
        }
        void FS.addFile(entry)
    }
    async function onReplace() {
        const files = await filepicker(pathlib.extname(path))
        if (!files) return
        await FS.replaceFile(path, files[0])
    }
    return (
        <ContextMenu onOpenChange={(value) => (open.value = value)}>
            <ContextMenuTrigger asChild>
                <div>{children}</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                {!isDirectory && (
                    <ContextMenuItem
                        onClick={() => {
                            onDuplicate()
                        }}
                    >
                        Duplicate
                    </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => (isRenameDialogOpen.value = true)}>
                    Rename...
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => {
                        void onSaveAs()
                    }}
                >
                    Save As...
                </ContextMenuItem>
                {!isDirectory && (
                    <ContextMenuItem
                        variant="destructive"
                        onClick={() => {
                            void onReplace()
                        }}
                    >
                        Replace...
                    </ContextMenuItem>
                )}
                <ContextMenuItem
                    variant="destructive"
                    onClick={() => (isDeleteDialogOpen.value = true)}
                >
                    Delete...
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function SubTree({path, children}: {path: string; children: [string, FS.Tree][]}) {
    const isRenameDialogOpen = useSignal(false)
    const isDeleteDialogOpen = useSignal(false)
    const contextOpen = useSignal(false)
    const entries = children.map(([path, children]) => (
        <Tree key={path} path={path}>
            {children}
        </Tree>
    ))
    return (
        <SidebarMenuItem>
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <div>
                        <EntryContextMenu
                            path={path}
                            isRenameDialogOpen={isRenameDialogOpen}
                            isDeleteDialogOpen={isDeleteDialogOpen}
                            open={contextOpen}
                            isDirectory
                        >
                            <SidebarMenuButton isActive={contextOpen.value}>
                                <FolderIcon className="text-muted-foreground" />
                                {pathlib.basename(path)}
                            </SidebarMenuButton>
                        </EntryContextMenu>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>{entries}</SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
            <RenameDialog open={isRenameDialogOpen} path={path} isDirectory />
            <DeleteDialog open={isDeleteDialogOpen} path={path} isDirectory />
        </SidebarMenuItem>
    )
}

function Tree({path, children}: {path: string; children: FS.Tree}) {
    const isRenameDialogOpen = useSignal(false)
    const isDeleteDialogOpen = useSignal(false)
    const contextOpen = useSignal(false)
    const entries = Object.entries(children)
    if (entries.length) return <SubTree path={path}>{entries}</SubTree>
    const Icon = getFileIcon(path)
    return (
        <SidebarMenuItem>
            <EntryContextMenu
                path={path}
                isRenameDialogOpen={isRenameDialogOpen}
                isDeleteDialogOpen={isDeleteDialogOpen}
                open={contextOpen}
            >
                <SidebarMenuButton
                    isActive={path == Editor.getOpenFile() || contextOpen.value}
                    onClick={() => Editor.setOpenFile(path)}
                >
                    <Icon className={getFileColor(path)} />
                    {pathlib.basename(path)}
                </SidebarMenuButton>
            </EntryContextMenu>
            <RenameDialog open={isRenameDialogOpen} path={path} />
            <DeleteDialog open={isDeleteDialogOpen} path={path} />
        </SidebarMenuItem>
    )
}

export function AppSidebar() {
    const tree = FS.getTree()
    const entries = Object.entries(tree).map(([path, children]) => (
        <Tree key={path} path={path}>
            {children}
        </Tree>
    ))
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Files</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>{entries}</SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
