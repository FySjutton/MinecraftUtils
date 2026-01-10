import { JSONContent } from '@tiptap/core'
import { MinecraftText } from "@/lib/MinecraftText"

type TextFlags = Pick<
    MinecraftText,
    'bold' | 'italic' | 'underline' | 'strike' | 'obfuscated'
>

const MARK_TO_FLAG: Record<string, keyof TextFlags> = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strike: 'strike',
    obfuscated: 'obfuscated',
}

function rgbToHex(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return ''
    const [, r, g, b] = match.map(Number)
    return (
        '#' +
        [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    )
}

function defaultState(): Omit<MinecraftText, 'char'> {
    return {
        color: null,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        obfuscated: false,
    }
}

export function tiptapToMinecraftText(
    content: JSONContent,
    maxLines = 4,
    defaultColor?: string
): MinecraftText[][] {
    const lines: MinecraftText[][] = [[]]
    let lineIndex = 0

    function walk(node: JSONContent, parentState: Omit<MinecraftText, 'char'> = defaultState()) {
        if (node.type === 'hardBreak') {
            if (lines.length < maxLines) {
                lines.push([])
                lineIndex++
            }
            return
        }

        if ('text' in node && typeof node.text === 'string') {
            const localState = { ...parentState }

            for (const mark of node.marks ?? []) {
                if (mark.type === 'textStyle' && mark.attrs?.color) {
                    localState.color = mark.attrs.color.startsWith('rgb')
                        ? rgbToHex(mark.attrs.color)
                        : mark.attrs.color
                }

                const flag = MARK_TO_FLAG[mark.type]
                if (flag) {
                    localState[flag] = true
                }
            }

            const line = lines[lineIndex]
            const lastSegment = line[line.length - 1]

            if (
                lastSegment &&
                lastSegment.color === (localState.color ?? defaultColor ?? null) &&
                lastSegment.bold === localState.bold &&
                lastSegment.italic === localState.italic &&
                lastSegment.underline === localState.underline &&
                lastSegment.strike === localState.strike &&
                lastSegment.obfuscated === localState.obfuscated
            ) {
                lastSegment.char += node.text
            } else {
                line.push({
                    char: node.text,
                    ...localState,
                    color: localState.color ?? defaultColor ?? null,
                })
            }
            return
        }

        if (Array.isArray(node.content)) {
            for (const child of node.content) {
                walk(child, parentState)
            }

            if (node.type === 'paragraph') {
                if (lines.length < maxLines) {
                    lines.push([])
                    lineIndex++
                }
            }
        }
    }

    walk(content)

    return lines.filter(line => line.length > 0).slice(0, maxLines)
}
