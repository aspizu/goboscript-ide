import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger
} from "@/components/ui/menubar"
import {UploadBox} from "@/components/uploadbox"
import {filepicker} from "@/lib/utils"
import {Editor, FS, Project} from "@/state"
import {useSignal, type Signal} from "@preact/signals-react"
import {saveAs} from "file-saver"
import JSZip from "jszip"
import {ExternalLinkIcon} from "lucide-react"
import * as pathlib from "path"

async function onNewFile() {
    const entry = {path: "Untitled.gs", file: ""}
    let i = 2
    while (FS.exists(entry.path)) {
        entry.path = `Untitled ${i}.gs`
        i++
    }
    await FS.addFile(entry)
    Editor.setOpenFile(entry.path)
}

async function onOpenFile() {
    const files = await filepicker("*", "multiple")
    if (!files) return
    const entries: {path: string; file: File}[] = []
    for (const file of files) {
        const extension = pathlib.extname(file.name)
        const basename = file.name.slice(0, -extension.length)
        const entry = {path: file.name, file: file}
        let i = 2
        while (FS.exists(entry.path)) {
            entry.path = `${basename} ${i}${extension}`
            i++
        }
        entries.push(entry)
    }
    await FS.addFile(...entries)
    if (entries.length == 1) Editor.setOpenFile(entries[0].path)
}

async function onOpenFromLibrary() {
    // TODO: Implement open from library functionality
}

function onSaveAs() {
    const path = Editor.getOpenFile()
    const entry = FS.getFile(path)
    if (path && entry) saveAs(entry, pathlib.basename(path))
}

async function onSaveProjectAs() {
    saveAs(await FS.getDirectoryAsZip(""), "Project.zip")
}

function onExportAs() {
    const project = Project.getProject()
    if (project) saveAs(new Blob([project]), "Project.sb3")
}

function ReplaceProjectDialog({open}: {open: Signal<boolean>}) {
    const file = useSignal<File>()
    async function onReplace() {
        if (!file.value) return
        const zip = await JSZip.loadAsync(file.value)
        const stagePath = Object.keys(zip.files).find(
            (name) => pathlib.basename(name) == "stage.gs"
        )
        const baseDir = stagePath && pathlib.dirname(stagePath)
        const entries: {path: string; file: FS.Entry}[] = []
        for (let file of Object.values(zip.files)) {
            if (baseDir && !file.name.startsWith(baseDir)) continue
            if (baseDir) file.name = file.name.slice(baseDir.length + 1)
            entries.push({path: file.name, file: await file.async("blob")})
        }
        await FS.replaceFiles(entries)
        open.value = false
    }
    return (
        <Dialog open={open.value} onOpenChange={(value) => (open.value = value)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Open Project</DialogTitle>
                    <DialogDescription>
                        This will replace your current project with the opened project.
                    </DialogDescription>
                </DialogHeader>
                <UploadBox file={file} accept="application/zip" />
                <DialogFooter>
                    <Button
                        variant="destructive"
                        disabled={!file.value}
                        onClick={() => {
                            void onReplace()
                        }}
                    >
                        Replace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AppMenubar() {
    const replaceProjectDialogOpen = useSignal(false)
    return (
        <Menubar className="grow">
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem
                        onSelect={() => {
                            void onNewFile()
                        }}
                    >
                        New
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() => {
                            void onOpenFile()
                        }}
                    >
                        Open...
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() => {
                            void onOpenFromLibrary()
                        }}
                    >
                        Open from Library...
                    </MenubarItem>
                    <MenubarItem onSelect={onSaveAs}>Save As...</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() => (replaceProjectDialogOpen.value = true)}
                    >
                        Open Project...
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() => {
                            void onSaveProjectAs()
                        }}
                    >
                        Save Project As...
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onSelect={onExportAs} disabled={!Project.getProject()}>
                        Export As...
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Help</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem asChild>
                        <a
                            href="https://aspiz.uk/goboscript/docs/getting-started/basic-examples.html"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Documentation
                            <ExternalLinkIcon className="ml-auto" />
                        </a>
                    </MenubarItem>
                    <MenubarItem asChild>
                        <a
                            href="https://github.com/aspizu/goboscript"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                            <ExternalLinkIcon className="ml-auto" />
                        </a>
                    </MenubarItem>
                    <MenubarItem asChild>
                        <a
                            href="https://discord.gg/mKQqsJ6UtK"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Discord
                            <ExternalLinkIcon className="ml-auto" />
                        </a>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <ReplaceProjectDialog open={replaceProjectDialogOpen} />
        </Menubar>
    )
}
