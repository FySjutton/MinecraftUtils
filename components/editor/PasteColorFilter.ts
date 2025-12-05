import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'
import {Colors} from "@/lib/Colors";

type Options = {
    initialColor: string
}

export const PasteColorFilter = Extension.create<Options>({
    name: 'pasteColorFilter',

    addOptions() {
        return {
            initialColor: Colors.WHITE,
        }
    },

    addProseMirrorPlugins() {
        const allowed = new Set(
            Object.values(Colors).map(c => c.toLowerCase())
        )
        const initial = this.options.initialColor.toLowerCase()

        const resolveToHex = (input: string | null): string | null => {
            if (!input) return null
            const color = input.trim()
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
                if (color.length === 4) {
                    return (
                        '#' +
                        color[1] + color[1] +
                        color[2] + color[2] +
                        color[3] + color[3]
                    ).toLowerCase()
                }
                return color.toLowerCase()
            }

            const el = document.createElement('span')
            el.style.color = color
            document.body.appendChild(el)
            const rgb = getComputedStyle(el).color
            document.body.removeChild(el)

            const m = rgb.match(/\d+/g)
            if (!m) return null
            const [r, g, b] = m.map(Number)
            return (
                '#' +
                r.toString(16).padStart(2, '0') +
                g.toString(16).padStart(2, '0') +
                b.toString(16).padStart(2, '0')
            )
        }

        const sanitize = (html: string) => {
            const doc = new DOMParser().parseFromString(html, 'text/html')

            doc.body.querySelectorAll('*').forEach(el => {
                if (!(el instanceof HTMLElement)) return

                let hasAllowed = false

                // style.color
                const raw = el.style.color
                if (raw) {
                    const hex = resolveToHex(raw)
                    if (hex && allowed.has(hex)) {
                        el.style.color = hex
                        hasAllowed = true
                    } else {
                        el.style.removeProperty('color')
                    }
                }

                // <font color="...">
                const fontColor = el.getAttribute('color')
                if (fontColor) {
                    const hex = resolveToHex(fontColor)
                    el.removeAttribute('color')
                    if (hex && allowed.has(hex)) {
                        el.style.color = hex
                        hasAllowed = true
                    }
                }

                // if no allowed color → apply initialColor
                if (!hasAllowed) {
                    el.style.color = initial
                }
            })

            return doc.body.innerHTML
        }

        const editor = this.editor

        return [
            new Plugin({
                props: {
                    handlePaste(view, event) {
                        const data = event.clipboardData
                        if (!data) return false

                        const html = data.getData('text/html')
                        const text = data.getData('text/plain')

                        if (html) {
                            event.preventDefault()
                            const clean = sanitize(html)
                            editor.commands.insertContent(clean)
                            return true
                        }

                        if (text) {
                            event.preventDefault()
                            // wrap plain text in a span with initial color
                            editor.commands.insertContent(
                                `<span style="color: ${initial}">${text}</span>`
                            )
                            return true
                        }

                        return false
                    },
                },
            }),
        ]
    },
})
