import { MinecraftText } from '@/lib/MinecraftText'
import { Colors, MinecraftFormatting } from '@/lib/Colors'

const COLOR_TO_CODE = Object.fromEntries(
    Object.entries(Colors).map(
        ([k, v]) => [v, MinecraftFormatting[k as keyof typeof MinecraftFormatting]]
    )
)

export function minecraftTextToString(
    lines: MinecraftText[][],
    prefix = '§',
): string {
    let out = ''

    for (const line of lines) {
        for (const segment of line) {
            out += `${prefix}r`

            if (segment.color != null) {
                out += `${prefix}${COLOR_TO_CODE[segment.color]}`
            }

            ;(['bold', 'italic', 'underline', 'strike', 'obfuscated'] as const).forEach(
                (key) => {
                    if (segment[key]) {
                        out += `${prefix}${MinecraftFormatting[key.toUpperCase() as keyof typeof MinecraftFormatting]}`
                    }
                },
            )

            out += segment.char
        }
        out += '\n'
    }

    return out.replace(/\n$/, '')
}
