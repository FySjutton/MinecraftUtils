import {ColorMeta, Colors, MinecraftFormatting} from "@/lib/Colors";
import {MinecraftText} from "@/lib/MinecraftText";

const FORMAT_CODE_TO_COLOR: Record<string, string> = {}

for (const meta of ColorMeta) {
    const code = meta.formatting.replace('§', '').toLowerCase()
    FORMAT_CODE_TO_COLOR[code] = Colors[meta.key]
}


export function parseStringToCharLines(
    input: string,
    maxLines = 4
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

    const resetState = () => ({
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

        if (ch === '\\' && input[i + 1] === 'n') {
            if (lines.length < maxLines) {
                lines.push([])
                lineIndex++
            }
            i++ // skip the 'n'
            continue
        }


        // Formatting code
        if (ch === '§' && i + 1 < input.length) {
            const code = input[++i].toLowerCase()

            // Color
            if (FORMAT_CODE_TO_COLOR[code]) {
                state = {
                    ...resetState(),
                    color: FORMAT_CODE_TO_COLOR[code],
                }
                continue
            }

            // Formatting toggles
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
                    state = resetState()
                    break
            }

            continue
        }

        // Normal character
        lines[lineIndex].push({
            ...state,
            char: ch,
        })
    }

    return lines.slice(0, maxLines)
}
