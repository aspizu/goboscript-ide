import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger
} from "@/components/ui/menubar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSidebar } from "@/components/ui/sidebar"
import { UploadBox } from "@/components/uploadbox"
import * as sb2gsutils from "@/lib/sb2gsutils"
import { SUPPORTS_TRUE_SAVE_AS, trueSaveAs } from "@/lib/trueSaveAs"
import { filepicker } from "@/lib/utils"
import { Editor, FS, panelOpen, playerFullscreen, Project } from "@/state"
import { useSignal, type Signal } from "@preact/signals-react"
import { saveAs } from "file-saver"
import { ExternalLinkIcon } from "lucide-react"
import * as pathlib from "path"
import { toast } from "sonner"

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

function guessMime(ext: string): string {
    const map: Record<string, string | undefined> = {
        ".gs": "text/plain",
        ".toml": "application/toml",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".txt": "text/plain"
    }
    return map[ext] ?? "application/octet-stream"
}

async function onSave(as: boolean) {
    const path = Editor.getOpenFile()
    let entry = FS.getFile(path)
    if (path && entry) {
        if (typeof entry === "string") {
            const ext = pathlib.extname(path)
            entry = new Blob([entry], {type: guessMime(ext)})
        }
        if (as && SUPPORTS_TRUE_SAVE_AS) {
            await trueSaveAs(entry, {
                suggestedName: pathlib.basename(path),
                types: [
                    {
                        description: "All Files",
                        accept: {"*/*": [pathlib.extname(path)]}
                    }
                ]
            })
        } else {
            saveAs(entry, pathlib.basename(path))
        }
    }
}

async function onSaveProject(as: boolean) {
    const blob = await FS.getDirectoryAsZip("")
    if (as && SUPPORTS_TRUE_SAVE_AS) {
        await trueSaveAs(blob, {
            suggestedName: "Project.zip",
            types: [{description: "Zip Files", accept: {"application/zip": [".zip"]}}]
        })
    } else {
        saveAs(blob, "Project.zip")
    }
}

async function onExportProject(as: boolean) {
    const blob = new Blob([Project.getProject() ?? new ArrayBuffer()], {
        type: "application/x.scratch.sb3"
    })
    if (as && SUPPORTS_TRUE_SAVE_AS) {
        await trueSaveAs(blob, {
            suggestedName: "Project.sb3",
            types: [
                {
                    description: "Scratch Projects",
                    accept: {"application/x.scratch.sb3": [".sb3"]}
                }
            ]
        })
    } else {
        saveAs(blob, "Project.sb3")
    }
}

type Shortcut = {
    code: string
    key: string
    keyCode: number
    altKey?: boolean
    shiftKey?: boolean
}

type OpenProjectSource = "computer" | "scratch"

function dispatchEditorShortcut(shortcut: Shortcut) {
    const editor = Editor.editor.value
    if (!editor) return
    editor.focus()
    const event = new KeyboardEvent("keydown", {
        altKey: shortcut.altKey,
        bubbles: true,
        cancelable: true,
        code: shortcut.code,
        key: shortcut.key,
        metaKey: true,
        shiftKey: shortcut.shiftKey
    })
    Object.defineProperties(event, {
        keyCode: {value: shortcut.keyCode},
        which: {value: shortcut.keyCode}
    })
    const target = editor.getDomNode()?.querySelector("textarea") ?? editor.getDomNode()
    target?.dispatchEvent(event)
}

function dispatchEditorPaste() {
    const editor = Editor.editor.value
    if (!editor) return
    editor.focus()
    void navigator.clipboard.readText().then((text) => {
        const clipboardData = new DataTransfer()
        clipboardData.setData("text/plain", text)
        const event = new ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            clipboardData
        })
        const target =
            editor.getDomNode()?.querySelector("textarea") ?? editor.getDomNode()
        target?.dispatchEvent(event)
    })
}

function ReplaceProjectDialog({open}: {open: Signal<boolean>}) {
    const file = useSignal<File>()
    const scratchUrl = useSignal("")
    const source = useSignal<OpenProjectSource>("computer")
    async function onReplace() {
        if (!file.value) return
        if (source.value == "scratch" || pathlib.extname(file.value.name) == ".sb3") {
            const input = new Uint8Array(await file.value.arrayBuffer())
            const files = sb2gsutils.decompile(input)
            if (files.isErr()) {
                toast.error("Failed to decompile Scratch project", {
                    description: files.error
                })
                return
            }
            await FS.replaceFiles(files.value)
        } else {
            await FS.replaceFromZip(file.value)
        }
        open.value = false
    }
    return (
        <Dialog open={open.value} onOpenChange={(value) => (open.value = value)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Open project</DialogTitle>
                    <DialogDescription>
                        This will replace your current project with the opened project.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <RadioGroup
                        className="flex"
                        value={source.value}
                        onValueChange={(value) => {
                            source.value = value as OpenProjectSource
                            file.value = undefined
                            scratchUrl.value = ""
                        }}
                    >
                        <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="computer" />
                            From computer
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="scratch" />
                            From Scratch
                        </label>
                    </RadioGroup>
                </div>
                {source.value == "scratch" ?
                    <Input
                        type="url"
                        placeholder="https://scratch.mit.edu/projects/314159265/"
                        value={scratchUrl.value}
                        onChange={(event) => (scratchUrl.value = event.target.value)}
                    />
                :   <UploadBox
                        file={file}
                        accept="application/zip,application/x.scratch.sb3,.zip,.sb3"
                    />
                }
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

export function AppMenubar({
    onRun,
    projectPanelShortcut,
    runShortcut
}: {
    onRun: () => void
    projectPanelShortcut: string
    runShortcut: string
}) {
    const replaceProjectDialogOpen = useSignal(false)
    const hasOpenFile = !!Editor.getOpenFile()
    const {state: sidebarState, toggleSidebar} = useSidebar()
    const builtProject = Project.getProject()
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
                        New File
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() => {
                            void onOpenFile()
                        }}
                    >
                        Open...
                    </MenubarItem>
                    <MenubarItem disabled>Open Recent</MenubarItem>
                    <MenubarItem
                        disabled
                        onSelect={() => {
                            void onOpenFromLibrary()
                        }}
                    >
                        Open from Library...
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() => Editor.close()}
                        disabled={!hasOpenFile}
                    >
                        Close File
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() => void onSave(false)}
                        disabled={!hasOpenFile}
                    >
                        Save
                    </MenubarItem>
                    {SUPPORTS_TRUE_SAVE_AS && (
                        <MenubarItem
                            onSelect={() => void onSave(true)}
                            disabled={!hasOpenFile}
                        >
                            Save As...
                        </MenubarItem>
                    )}
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() => (replaceProjectDialogOpen.value = true)}
                    >
                        Open Project...
                    </MenubarItem>
                    <MenubarItem onSelect={() => void onSaveProject(false)}>
                        Save Project
                    </MenubarItem>
                    {SUPPORTS_TRUE_SAVE_AS && (
                        <MenubarItem onSelect={() => void onSaveProject(true)}>
                            Save Project As...
                        </MenubarItem>
                    )}
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() => void onExportProject(false)}
                        disabled={!builtProject}
                    >
                        Export Project
                    </MenubarItem>
                    {SUPPORTS_TRUE_SAVE_AS && (
                        <MenubarItem
                            onSelect={() => void onExportProject(true)}
                            disabled={!builtProject}
                        >
                            Export Project As...
                        </MenubarItem>
                    )}
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyZ",
                                key: "z",
                                keyCode: 90
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Undo
                        <MenubarShortcut>⌘Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyZ",
                                key: "Z",
                                keyCode: 90,
                                shiftKey: true
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Redo
                        <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyX",
                                key: "x",
                                keyCode: 88
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Cut
                        <MenubarShortcut>⌘X</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyC",
                                key: "c",
                                keyCode: 67
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Copy
                        <MenubarShortcut>⌘C</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onSelect={dispatchEditorPaste} disabled={!hasOpenFile}>
                        Paste
                        <MenubarShortcut>⌘V</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyA",
                                key: "a",
                                keyCode: 65
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Select All
                        <MenubarShortcut>⌘A</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                code: "KeyF",
                                key: "f",
                                keyCode: 70
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Find...
                        <MenubarShortcut>⌘F</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() =>
                            dispatchEditorShortcut({
                                altKey: true,
                                code: "KeyF",
                                key: "f",
                                keyCode: 70
                            })
                        }
                        disabled={!hasOpenFile}
                    >
                        Find and Replace...
                        <MenubarShortcut>⌥⌘F</MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onSelect={toggleSidebar}>
                        {sidebarState == "expanded" ? "Hide Sidebar" : "Show Sidebar"}
                        <MenubarShortcut>⌘B</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onSelect={() => (panelOpen.value = !panelOpen.value)}>
                        {panelOpen.value ? "Hide Project Panel" : "Show Project Panel"}
                        <MenubarShortcut>{projectPanelShortcut}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem
                        onSelect={() =>
                            (playerFullscreen.value = !playerFullscreen.value)
                        }
                    >
                        {playerFullscreen.value ?
                            "Exit Player Full Screen"
                        :   "Enter Player Full Screen"}
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Project</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem
                        onSelect={() => {
                            void Project.buildProject()
                        }}
                    >
                        Build Project
                    </MenubarItem>
                    <MenubarItem onSelect={onRun}>
                        Run Project
                        <MenubarShortcut>{runShortcut}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onSelect={() => Project.scaffolding.greenFlag()}>
                        Start Project
                    </MenubarItem>
                    <MenubarItem onSelect={() => Project.scaffolding.stopAll()}>
                        Stop All
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
                            goboscript Documentation
                            <ExternalLinkIcon className="ml-auto" />
                        </a>
                    </MenubarItem>
                    <MenubarItem asChild>
                        <a
                            href="https://github.com/aspizu/goboscript"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            goboscript on GitHub
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
