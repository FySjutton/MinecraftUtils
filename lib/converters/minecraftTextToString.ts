import { MinecraftText } from '@/lib/MinecraftText'
import { Colors, MinecraftFormatting } from '@/lib/Colors'

const COLOR_TO_CODE = Object.fromEntries(
    Object.entries(Colors).map(([k, v]) => [v, MinecraftFormatting[k as keyof typeof MinecraftFormatting]])
)

export function minecraftTextToString(
    lines: MinecraftText[][],
    prefix = '§',
): string {
    let out = ''
    let prev: Partial<MinecraftText> = {}

    for (const line of lines) {
        for (const ch of line) {
            if (ch.color !== prev.color && ch.color != null) {
                out += `${prefix}${COLOR_TO_CODE[ch.color]}`
            }

            ;(['bold', 'italic', 'underline', 'strike', 'obfuscated'] as const).forEach(
                (key) => {
                    if (ch[key] && !prev[key]) {
                        out += `${prefix}${MinecraftFormatting[key.toUpperCase() as keyof typeof MinecraftFormatting]}`
                    }
                },
            )

            out += ch.char
            prev = ch
        }

        out += '\n'
        prev = {}
    }

    return out.replace(/\n$/, '')
}
