"use client"
import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"

export function ObfuscationPlugin() {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        const updateOverlay = () => {
            // Remove old overlays
            document.querySelectorAll(".obfuscation-overlay").forEach((el) => el.remove())

            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return

            selection.getNodes().forEach((node) => {
                if ($isTextNode(node)) {
                    const dom = editor.getElementByKey(node.getKey())
                    if (dom && dom.classList.contains("obfuscate")) {
                        const rect = dom.getBoundingClientRect()
                        const overlay = document.createElement("div")
                        overlay.className = "obfuscation-overlay"
                        overlay.textContent = dom.textContent
                        overlay.style.position = "absolute"
                        overlay.style.left = `${rect.left + window.scrollX + 1}px`
                        overlay.style.top = `${rect.top + window.scrollY + 1}px`
                        overlay.style.width = `${rect.width}px`
                        overlay.style.height = `${rect.height}px`
                        overlay.style.pointerEvents = "none"
                        overlay.style.font = "inherit"
                        overlay.style.color = "inherit"
                        overlay.style.whiteSpace = "pre"
                        overlay.style.userSelect = "none"
                        overlay.style.zIndex = "10"
                        overlay.style.opacity = "0.7"
                        document.body.appendChild(overlay)
                    }
                }
            })
        }

        const interval = setInterval(updateOverlay, 100)
        return () => clearInterval(interval)
    }, [editor])

    return null
}
