import { useState, useCallback } from "react"

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false)

    const copyToClipboard = useCallback((text: string) => {
        if (!navigator.clipboard) return
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 1500) // reset after 1.5s
        })
    }, [])

    return { copyToClipboard, isCopied }
}
