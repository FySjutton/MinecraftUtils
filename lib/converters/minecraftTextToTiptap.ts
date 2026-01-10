import { JSONContent } from '@tiptap/core'

export interface MinecraftTextChar {
    char: string
    color?: string | null
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    obfuscated?: boolean
}

export function parseMinecraftString(input: string): MinecraftTextChar[][] {
    const lines: MinecraftTextChar[][] = [[]]

    let color: string | null = null
    let bold = false
    let italic = false
    let underline = false
    let strike = false
    let obfuscated = false

    for (let i = 0; i < input.length; i++) {
        const char = input[i]

        if (char === '\n') {
            lines.push([])
            continue
        }

        if (char === '\u00a7' && i + 1 < input.length) {
            const code = input[i + 1].toLowerCase()
            i++

            if (/[0-9a-f]/.test(code)) {
                color = colorCodeToHex(code)
                bold = italic = underline = strike = obfuscated = false
                continue
            }

            switch (code) {
                case 'l': bold = true; break
                case 'o': italic = true; break
                case 'n': underline = true; break
                case 'm': strike = true; break
                case 'k': obfuscated = true; break
                case 'r': // reset
                    color = null
                    bold = italic = underline = strike = obfuscated = false
                    break
                default:
                    break
            }
            continue
        }

        lines[lines.length - 1].push({
            char,
            color,
            bold,
            italic,
            underline,
            strike,
            obfuscated,
        })
    }

    return lines
}

function colorCodeToHex(code: string): string {
    const colors: Record<string, string> = {
        '0': '#000000',
        '1': '#0000AA',
        '2': '#00AA00',
        '3': '#00AAAA',
        '4': '#AA0000',
        '5': '#AA00AA',
        '6': '#FFAA00',
        '7': '#AAAAAA',
        '8': '#555555',
        '9': '#5555FF',
        'a': '#55FF55',
        'b': '#55FFFF',
        'c': '#FF5555',
        'd': '#FF55FF',
        'e': '#FFFF55',
        'f': '#FFFFFF',
    }
    return colors[code] ?? '#FFFFFF'
}

export function minecraftTextToTiptap(input: string): JSONContent {
    const lines = parseMinecraftString(input)

    const doc: JSONContent = {
        type: 'doc',
        content: [],
    }

    const FLAG_TO_MARK: Record<string, string> = {
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        strike: 'strike',
        obfuscated: 'obfuscated',
    }

    for (const line of lines) {
        const paragraph: JSONContent = { type: 'paragraph', content: [] }

        for (const charData of line) {
            const marks = []

            if (charData.color) {
                marks.push({ type: 'textStyle', attrs: { color: charData.color } })
            }

            for (const flag of ['bold', 'italic', 'underline', 'strike', 'obfuscated'] as const) {
                if (charData[flag]) {
                    marks.push({ type: FLAG_TO_MARK[flag] })
                }
            }

            paragraph.content!.push({
                type: 'text',
                text: charData.char,
                marks: marks.length > 0 ? marks : undefined,
            })
        }

        doc.content!.push(paragraph)
    }

    return doc
}
