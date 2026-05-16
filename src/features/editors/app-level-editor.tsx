import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {useObjectURL} from "@/hooks/use-object-url"
import {cn} from "@/lib/utils"
import {Editor, FS} from "@/state"
import {
    Eraser,
    Grid2X2,
    Images,
    MousePointer2,
    Paintbrush,
    ZoomIn,
    ZoomOut
} from "lucide-react"
import * as pathlib from "path"
import {useRef, useState} from "react"

type Tile = {
    char: string
    label: string
    className: string
}

type Costume = {
    path: string
    file: FS.Entry
}

const MIN_COLUMNS = 8
const MIN_ROWS = 6
const MAX_COLUMNS = 64
const MAX_ROWS = 48
const EMPTY_TILE = "."
const MIN_ZOOM = 16
const MAX_ZOOM = 64
const ZOOM_STEP = 4
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".bmp", ".svg"]
const TILES: Tile[] = [
    {
        char: ".",
        label: "Empty",
        className: "bg-sky-50 dark:bg-zinc-950"
    },
    {
        char: "#",
        label: "Solid",
        className: "bg-zinc-300 dark:bg-zinc-200"
    },
    {
        char: "~",
        label: "Water",
        className: "bg-cyan-500"
    },
    {
        char: "^",
        label: "Spike",
        className: "bg-rose-500"
    },
    {
        char: "@",
        label: "Spawn",
        className: "bg-emerald-400"
    },
    {
        char: "*",
        label: "Goal",
        className: "bg-amber-300"
    }
]

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function getTile(char: string) {
    return TILES.find((tile) => tile.char === char) ?? TILES[0]
}

function getCostumeSource(file: FS.Entry, path: string) {
    if (file instanceof Blob) return null
    if (pathlib.extname(path) !== ".svg") return null
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file)}`
}

function getCostumes() {
    return FS.getFiles()
        .filter(([path]) => IMAGE_EXTENSIONS.includes(pathlib.extname(path)))
        .map(([path, file]) => ({path, file}))
}

function getTileChars(grid: string[][]) {
    return [...new Set([...TILES.map((tile) => tile.char), ...grid.flat()])]
}

function parseLevel(file: string) {
    const lines = file.split(/\r?\n/).filter((line, index, array) => {
        return index < array.length - 1 || line.length > 0
    })
    const rowCount = clamp(lines.length || MIN_ROWS, MIN_ROWS, MAX_ROWS)
    const columnCount = clamp(
        Math.max(MIN_COLUMNS, ...lines.map((line) => line.length)),
        MIN_COLUMNS,
        MAX_COLUMNS
    )
    return Array.from({length: rowCount}, (_, row) => {
        const line = lines[row] ?? ""
        return Array.from({length: columnCount}, (_, column) => {
            return line[column] ?? EMPTY_TILE
        })
    })
}

function serializeLevel(grid: string[][]) {
    return grid.map((row) => row.join("")).join("\n")
}

function replaceTile(grid: string[][], row: number, column: number, tile: string) {
    return grid.map((cells, rowIndex) => {
        if (rowIndex !== row) return cells
        return cells.map((cell, columnIndex) => {
            if (columnIndex !== column) return cell
            return tile
        })
    })
}

function resizeGrid(grid: string[][], rows: number, columns: number) {
    const rowCount = clamp(rows, MIN_ROWS, MAX_ROWS)
    const columnCount = clamp(columns, MIN_COLUMNS, MAX_COLUMNS)
    return Array.from({length: rowCount}, (_, row) => {
        const cells = grid[row] ?? []
        return Array.from({length: columnCount}, (_, column) => {
            return cells[column] ?? EMPTY_TILE
        })
    })
}

function CostumeImage({
    costume,
    className
}: {
    costume: Costume
    className?: string
}) {
    const objectURL = useObjectURL(costume.file instanceof Blob ? costume.file : null)
    const source = objectURL ?? getCostumeSource(costume.file, costume.path)
    if (!source) return null
    return (
        <img
            src={source}
            alt=""
            draggable={false}
            className={cn("size-full object-contain", className)}
        />
    )
}

function TilePreview({
    tile,
    costume,
    className
}: {
    tile: Tile
    costume?: Costume
    className?: string
}) {
    return (
        <span
            className={cn(
                "grid size-full place-items-center overflow-hidden font-mono text-[10px] text-black/70",
                tile.className,
                className
            )}
        >
            {costume ? (
                <CostumeImage costume={costume} />
            ) : tile.char !== EMPTY_TILE ? (
                tile.char
            ) : (
                ""
            )}
        </span>
    )
}

export function AppLevelEditor() {
    const path = Editor.getOpenFile()
    const file = FS.getDefaultFile(path)
    const isEditable =
        path && typeof file === "string" && pathlib.extname(path) === ".level"
    const grid = parseLevel(isEditable ? file : "")
    const [selectedTile, setSelectedTile] = useState(TILES[1].char)
    const [isPainting, setIsPainting] = useState(false)
    const [isPanning, setIsPanning] = useState(false)
    const [zoom, setZoom] = useState(24)
    const [offset, setOffset] = useState({x: 24, y: 24})
    const [costumeMappings, setCostumeMappings] = useState<Record<string, string>>({})
    const viewportRef = useRef<HTMLDivElement>(null)
    const panRef = useRef({
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0
    })
    const costumes = getCostumes()
    const tileChars = getTileChars(grid)

    function writeGrid(nextGrid: string[][]) {
        if (!path) return
        void FS.replaceFile(path, serializeLevel(nextGrid))
    }

    function paintTile(row: number, column: number) {
        writeGrid(replaceTile(grid, row, column, selectedTile))
    }

    function setRows(value: string) {
        writeGrid(resizeGrid(grid, Number(value), grid[0]?.length ?? MIN_COLUMNS))
    }

    function setColumns(value: string) {
        writeGrid(resizeGrid(grid, grid.length, Number(value)))
    }

    function setCostumeMapping(char: string, costumePath: string) {
        setCostumeMappings((currentMappings) => {
            const nextMappings = {...currentMappings}
            if (costumePath) nextMappings[char] = costumePath
            else delete nextMappings[char]
            return nextMappings
        })
    }

    function zoomAt(clientX: number, clientY: number, nextZoom: number) {
        const viewport = viewportRef.current
        if (!viewport) {
            setZoom(nextZoom)
            return
        }
        const rect = viewport.getBoundingClientRect()
        const viewportX = clientX - rect.left
        const viewportY = clientY - rect.top
        const levelX = (viewportX - offset.x) / zoom
        const levelY = (viewportY - offset.y) / zoom
        setZoom(nextZoom)
        setOffset({
            x: viewportX - levelX * nextZoom,
            y: viewportY - levelY * nextZoom
        })
    }

    function zoomOut() {
        const viewport = viewportRef.current
        const nextZoom = clamp(zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
        if (!viewport) {
            setZoom(nextZoom)
            return
        }
        const rect = viewport.getBoundingClientRect()
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextZoom)
    }

    function zoomIn() {
        const viewport = viewportRef.current
        const nextZoom = clamp(zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM)
        if (!viewport) {
            setZoom(nextZoom)
            return
        }
        const rect = viewport.getBoundingClientRect()
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextZoom)
    }

    function startPanning(event: React.PointerEvent<HTMLDivElement>) {
        const target = event.target
        const isTile = target instanceof Element && target.closest("[data-level-tile]")
        if (event.button === 0 && isTile) return
        if (event.button !== 0 && event.button !== 1 && event.button !== 2) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        panRef.current = {
            x: event.clientX,
            y: event.clientY,
            offsetX: offset.x,
            offsetY: offset.y
        }
        setIsPanning(true)
    }

    function panViewport(event: React.PointerEvent<HTMLDivElement>) {
        if (!isPanning) return
        event.preventDefault()
        setOffset({
            x: panRef.current.offsetX + event.clientX - panRef.current.x,
            y: panRef.current.offsetY + event.clientY - panRef.current.y
        })
    }

    function stopPanning() {
        setIsPanning(false)
    }

    function scrollViewport(event: React.WheelEvent<HTMLDivElement>) {
        event.preventDefault()
        const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
        zoomAt(
            event.clientX,
            event.clientY,
            clamp(zoom + direction, MIN_ZOOM, MAX_ZOOM)
        )
    }

    return (
        <div
            className={cn(
                "flex grow overflow-hidden bg-background text-foreground dark:bg-zinc-950 dark:text-zinc-100",
                !isEditable && "hidden"
            )}
        >
            <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-border bg-sidebar p-3 dark:border-zinc-800 dark:bg-zinc-900/90">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Grid2X2 className="size-4" />
                    Level Grid
                </div>
                <Tabs defaultValue="tiles" className="min-h-0 grow">
                    <TabsList className="grid w-full grid-cols-2 bg-muted dark:bg-zinc-950">
                        <TabsTrigger value="tiles">
                            <Paintbrush className="size-3.5" />
                            Tiles
                        </TabsTrigger>
                        <TabsTrigger value="costumes">
                            <Images className="size-3.5" />
                            Costumes
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tiles" className="flex min-h-0 flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            <label className="space-y-1 text-xs text-muted-foreground dark:text-zinc-400">
                                Rows
                                <Input
                                    type="number"
                                    min={MIN_ROWS}
                                    max={MAX_ROWS}
                                    value={grid.length}
                                    onChange={(event) => {
                                        setRows(event.target.value)
                                    }}
                                />
                            </label>
                            <label className="space-y-1 text-xs text-muted-foreground dark:text-zinc-400">
                                Columns
                                <Input
                                    type="number"
                                    min={MIN_COLUMNS}
                                    max={MAX_COLUMNS}
                                    value={grid[0]?.length ?? MIN_COLUMNS}
                                    onChange={(event) => {
                                        setColumns(event.target.value)
                                    }}
                                />
                            </label>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-4 gap-1.5">
                            {TILES.map((tile) => {
                                const costume = costumes.find((entry) => {
                                    return entry.path === costumeMappings[tile.char]
                                })
                                return (
                                    <button
                                        key={tile.char}
                                        type="button"
                                        title={`${tile.label} (${tile.char})`}
                                        aria-label={`${tile.label} (${tile.char})`}
                                        className={cn(
                                            "grid aspect-square place-items-center rounded-md border bg-card p-1 outline-none transition hover:border-primary/50 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring dark:bg-zinc-950 dark:hover:border-zinc-400 dark:hover:bg-zinc-800 dark:focus-visible:ring-white",
                                            selectedTile === tile.char
                                                ? "border-primary shadow-[0_0_0_1px_var(--primary)] dark:border-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.6)]"
                                                : "border-border dark:border-zinc-700"
                                        )}
                                        onClick={() => {
                                            setSelectedTile(tile.char)
                                        }}
                                    >
                                        <TilePreview
                                            tile={tile}
                                            costume={costume}
                                            className="rounded-sm border border-white/15"
                                        />
                                    </button>
                                )
                            })}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-auto h-8 justify-center border-border bg-card px-2 hover:bg-accent dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            onClick={() => {
                                setSelectedTile(EMPTY_TILE)
                            }}
                            aria-label="Erase"
                            title="Erase"
                        >
                            <Eraser className="size-4" />
                        </Button>
                    </TabsContent>
                    <TabsContent
                        value="costumes"
                        className="min-h-0 space-y-2 overflow-auto"
                    >
                        {tileChars.map((char) => {
                            const costume = costumes.find((entry) => {
                                return entry.path === costumeMappings[char]
                            })
                            return (
                                <label
                                    key={char}
                                    className="grid gap-1 rounded-md border border-border bg-card p-2 text-xs text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="grid size-7 place-items-center rounded border border-border bg-muted font-mono text-foreground dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                                            {char}
                                        </span>
                                        Costume
                                        {costume && (
                                            <span className="ml-auto size-7 overflow-hidden rounded border border-border bg-muted p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                                                <CostumeImage costume={costume} />
                                            </span>
                                        )}
                                    </span>
                                    <select
                                        value={costumeMappings[char] ?? ""}
                                        className="border-input bg-background h-9 min-w-0 rounded-md border px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-zinc-100"
                                        onChange={(event) => {
                                            setCostumeMapping(char, event.target.value)
                                        }}
                                    >
                                        <option value="">No costume</option>
                                        {costumes.map((entry) => (
                                            <option key={entry.path} value={entry.path}>
                                                {entry.path}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )
                        })}
                    </TabsContent>
                </Tabs>
            </aside>
            <main className="flex min-h-0 min-w-0 grow flex-col">
                <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-xs text-muted-foreground dark:border-zinc-800 dark:bg-transparent dark:text-zinc-400">
                    <MousePointer2 className="size-3.5" />
                    Paint by clicking or dragging across cells.
                    <span className="ml-auto font-mono">
                        {grid[0]?.length ?? 0}x{grid.length}
                    </span>
                    <div className="flex items-center overflow-hidden rounded-md border border-border bg-background dark:border-zinc-800 dark:bg-zinc-900">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-none text-muted-foreground hover:bg-accent hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            onClick={zoomOut}
                            disabled={zoom <= MIN_ZOOM}
                            aria-label="Zoom out"
                            title="Zoom out"
                        >
                            <ZoomOut className="size-3.5" />
                        </Button>
                        <span className="w-10 border-x border-border text-center font-mono dark:border-zinc-800">
                            {zoom}px
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-none text-muted-foreground hover:bg-accent hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            onClick={zoomIn}
                            disabled={zoom >= MAX_ZOOM}
                            aria-label="Zoom in"
                            title="Zoom in"
                        >
                            <ZoomIn className="size-3.5" />
                        </Button>
                    </div>
                </div>
                <div
                    ref={viewportRef}
                    className={cn(
                        "relative min-h-0 min-w-0 grow overflow-hidden overscroll-contain bg-sky-50 dark:bg-zinc-950",
                        isPanning ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onPointerDown={startPanning}
                    onPointerMove={panViewport}
                    onContextMenu={(event) => {
                        event.preventDefault()
                    }}
                    onPointerLeave={() => {
                        setIsPainting(false)
                        stopPanning()
                    }}
                    onPointerUp={() => {
                        setIsPainting(false)
                        stopPanning()
                    }}
                    onWheel={scrollViewport}
                >
                    <div
                        className="absolute rounded-md border border-border bg-white shadow-2xl shadow-sky-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
                        style={{
                            left: offset.x,
                            top: offset.y,
                            width: (grid[0]?.length ?? MIN_COLUMNS) * zoom,
                            height: grid.length * zoom
                        }}
                    >
                        {grid.map((row, rowIndex) =>
                            row.map((cell, columnIndex) => {
                                const tile = getTile(cell)
                                const costume = costumes.find((entry) => {
                                    return entry.path === costumeMappings[cell]
                                })
                                return (
                                    <button
                                        key={`${rowIndex}:${columnIndex}`}
                                        type="button"
                                        title={`${tile.label} (${tile.char})`}
                                        data-level-tile
                                        className={cn(
                                            "absolute grid place-items-center border-r border-b border-sky-100 font-mono text-[10px] text-black/70 outline-none transition-transform hover:scale-110 hover:ring-2 hover:ring-primary/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-800 dark:hover:ring-white/70 dark:focus-visible:ring-white",
                                            tile.className
                                        )}
                                        style={{
                                            left: columnIndex * zoom,
                                            top: rowIndex * zoom,
                                            width: zoom,
                                            height: zoom
                                        }}
                                        onPointerDown={(event) => {
                                            if (event.button !== 0) return
                                            setIsPainting(true)
                                            paintTile(rowIndex, columnIndex)
                                        }}
                                        onPointerEnter={() => {
                                            if (isPainting) {
                                                paintTile(rowIndex, columnIndex)
                                            }
                                        }}
                                    >
                                        <TilePreview tile={tile} costume={costume} />
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
