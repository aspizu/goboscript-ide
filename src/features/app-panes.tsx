import {Button} from "@/components/ui/button"
import {Spinner} from "@/components/ui/spinner"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {cn} from "@/lib/utils"
import {Console} from "@/state"
import {useSignal} from "@preact/signals-react"
import {ListXIcon} from "lucide-react"
import {AppConsolePane} from "./panes/app-console-pane"

export function AppPanes() {
    const activeTab = useSignal("console")
    const docsLoading = useSignal(true)
    const consoleLength = Console.getMessages().filter(
        (msg) => msg.severity === "error" || msg.severity === "warn"
    ).length
    return (
        <Tabs
            value={activeTab.value}
            onValueChange={(value) => (activeTab.value = value)}
            className="min-h-0 flex-1 overflow-hidden"
        >
            <div className="flex gap-1">
                <TabsList className="gap-1 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-7">
                    <TabsTrigger
                        value="console"
                        className="data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary h-7 px-2 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent"
                    >
                        Console
                        {consoleLength > 0 && (
                            <span className="text-primary rounded-full bg-red-500/75 px-1 text-xs font-medium">
                                {consoleLength}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="learn"
                        className="data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary h-7 px-2 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent"
                    >
                        Learn
                    </TabsTrigger>
                </TabsList>
                <div className="grow" />
                {activeTab.value === "console" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={Console.removeAllMessages}
                        className="size-6"
                    >
                        <ListXIcon />
                    </Button>
                )}
            </div>
            <TabsContent
                value="console"
                className="flex min-h-0 flex-col overflow-hidden"
            >
                <AppConsolePane />
            </TabsContent>
            <TabsContent
                value="learn"
                forceMount
                hidden={activeTab.value !== "learn"}
                aria-busy={docsLoading.value}
                className="bg-muted relative min-h-0 overflow-hidden rounded-md"
            >
                <iframe
                    src="https://aspiz.uk/goboscript/docs/language/syntax.html"
                    title="goboscript documentation"
                    className={cn(
                        "absolute top-0 left-0 h-[125%] w-[125%] origin-top-left scale-[0.8] border-0 transition-opacity duration-150 motion-reduce:transition-none",
                        docsLoading.value ? "opacity-0" : "opacity-100"
                    )}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    onLoad={() => (docsLoading.value = false)}
                />
                <div
                    role="status"
                    aria-hidden={!docsLoading.value}
                    className={cn(
                        "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-150 motion-reduce:transition-none",
                        docsLoading.value ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Spinner size="small">
                        <span className="sr-only">Loading documentation</span>
                    </Spinner>
                </div>
            </TabsContent>
        </Tabs>
    )
}
