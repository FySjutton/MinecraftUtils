import { ColorMeta, Colors, MinecraftFormatting } from '@/lib/Colors'
import { MinecraftText } from '@/lib/MinecraftText'

const FORMAT_CODE_TO_COLOR: Record<string, string> = {}

for (const meta of ColorMeta) {
    FORMAT_CODE_TO_COLOR[meta.formatting.replace('§', '').toLowerCase()] =
        Colors[meta.key]
}

export function stringToMinecraftText(
    input: string,
    maxLines = 4,
): MinecraftText[][] {
    const lines: MinecraftText[][] = [[]]
    let lineIndex = 0

    let state: MinecraftText = {
        char: '',
        color: Colors.GRAY,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        obfuscated: false,
    }

    const reset = () => ({
        ...state,
        color: Colors.GRAY,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        obfuscated: false,
    })

    for (let i = 0; i < input.length; i++) {
        const ch = input[i]

        if (ch === '\n') {
            if (lines.length < maxLines) {
                lines.push([])
                lineIndex++
            }
            continue
        }

        if (ch === '§' && i + 1 < input.length) {
            const code = input[++i].toLowerCase()

            if (FORMAT_CODE_TO_COLOR[code]) {
                state = { ...reset(), color: FORMAT_CODE_TO_COLOR[code] }
                continue
            }

            switch (code) {
                case MinecraftFormatting.BOLD:
                    state.bold = true
                    break
                case MinecraftFormatting.ITALIC:
                    state.italic = true
                    break
                case MinecraftFormatting.UNDERLINE:
                    state.underline = true
                    break
                case MinecraftFormatting.STRIKETHROUGH:
                    state.strike = true
                    break
                case MinecraftFormatting.OBFUSCATED:
                    state.obfuscated = true
                    break
                case MinecraftFormatting.RESET:
                    state = reset()
                    break
            }

            continue
        }

        lines[lineIndex].push({ ...state, char: ch })
    }

    return lines.slice(0, maxLines)
}
