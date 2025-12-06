import { JSONContent } from '@tiptap/core'
import { Colors, MinecraftFormatting } from '@/lib/Colors'

const MARK_TO_CODE: Record<string, string> = {
    bold: MinecraftFormatting.BOLD,
    italic: MinecraftFormatting.ITALIC,
    underline: MinecraftFormatting.UNDERLINE,
    strike: MinecraftFormatting.STRIKETHROUGH,
    obfuscated: MinecraftFormatting.OBFUSCATED,
}

export function jsonToMinecraftText(
    content: JSONContent,
    prefix: string = '§',
): string {
    if (!content) return ''

    if (content.type === 'hardBreak') {
        return '\n'
    }

    if ('text' in content) {
        const text = content.text || ''
        const marks = content.marks || []
        let code = ''

        const colorMark = marks.find(
            (m) => m.type === 'textStyle' && m.attrs?.color,
        )
        if (colorMark) {
            code += getMinecraftColorCode(colorMark.attrs.color, prefix)
        }

        marks.forEach((m) => {
            if (MARK_TO_CODE[m.type]) {
                code += `${prefix}${MARK_TO_CODE[m.type]}`
            }
        })

        return code + text
    }

    if ('content' in content && Array.isArray(content.content)) {
        const parts = content.content.map((child) =>
            jsonToMinecraftText(child, prefix),
        )

        if (content.type === 'paragraph') {
            return parts.join('') + '\\n'
        }

        return parts.join('')
    }

    return ''
}

function rgbToHex(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return ''
    const [, r, g, b] = match.map(Number)
    return (
        '#' +
        [r, g, b]
            .map((x) => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    )
}

function getMinecraftColorCode(
    color: string,
    prefix: string,
): string {
    if (color.startsWith('#')) {
        color = color.toUpperCase()
    } else if (color.startsWith('rgb')) {
        color = rgbToHex(color)
    }

    const entry = Object.entries(MinecraftFormatting).find(
        ([key]) => Colors[key as keyof typeof Colors] === color,
    )

    return entry ? `${prefix}${entry[1]}` : ''
}
