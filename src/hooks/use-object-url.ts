import {useEffect, useState} from "react"

export function useObjectURL(blob: Blob | null) {
    const [objectURL, setObjectURL] = useState<string | null>(null)
    useEffect(() => {
        if (blob === null) {
            setObjectURL(null)
            return undefined
        }
        const objectURL = URL.createObjectURL(blob)
        setObjectURL(objectURL)
        return () => {
            URL.revokeObjectURL(objectURL)
        }
    }, [blob])
    return objectURL
}
