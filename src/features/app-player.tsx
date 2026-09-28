import {useFullscreen} from "@/hooks/use-fullscreen"
import {cn} from "@/lib/utils"
import {playerFullscreen, Project} from "@/state"
import {useEffect, useMemo, useRef} from "react"

export function AppPlayer({className}: {className?: string}) {
    const ref = useRef<HTMLDivElement>(null)
    const observer = useMemo(
        () => new ResizeObserver(() => Project.scaffolding.relayout()),
        []
    )
    useFullscreen(playerFullscreen, ref)
    useEffect(() => {
        if (!ref.current) return
        Project.scaffolding.appendTo(ref.current)
        observer.observe(ref.current)
    }, [observer])
    useEffect(() => () => observer.disconnect(), [observer])
    return (
        <div
            className={cn(
                "h-[360px] w-[480px] shrink-0 overflow-hidden rounded-md",
                className
            )}
            ref={ref}
        />
    )
}
