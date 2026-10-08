import {Spinner} from "@/components/ui/spinner"
import {cn} from "@/lib/utils"
import {useSignal} from "@preact/signals-react"

export function AppLearnPane({hidden}: {hidden: boolean}) {
    const docsLoading = useSignal(true)
    return (
        <div
            hidden={hidden}
            aria-busy={docsLoading.value}
            className="bg-muted relative min-h-0 flex-1 overflow-hidden rounded-md"
        >
            {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
                src="https://aspiz.uk/goboscript/docs/language/syntax.html"
                title="goboscript documentation"
                className={cn(
                    "absolute top-0 left-0 h-[125%] w-[125%] origin-top-left scale-[0.8] scheme-dark transition-opacity duration-150 motion-reduce:transition-none",
                    docsLoading.value ? "opacity-0" : "opacity-100"
                )}
                loading="lazy"
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
        </div>
    )
}
