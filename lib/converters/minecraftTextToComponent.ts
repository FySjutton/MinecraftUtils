import {MinecraftText} from "@/lib/MinecraftText";

type TextComponent = {
    text: string
    color?: string
    bold?: boolean
    italic?: boolean
    underlined?: boolean
    strikethrough?: boolean
    obfuscated?: boolean
}

function lineToComponents(line: MinecraftText[]): TextComponent[] {
    const components: TextComponent[] = []

    let current: TextComponent | null = null

    for (const ch of line) {
        const sameStyle =
            current &&
            current.color === ch.color &&
            !!current.bold === ch.bold &&
            !!current.italic === ch.italic &&
            !!current.underlined === ch.underline &&
            !!current.strikethrough === ch.strike &&
            !!current.obfuscated === ch.obfuscated

        if (!sameStyle) {
            current = {
                text: ch.char,
            }

            if (ch.color) current.color = ch.color
            if (ch.bold) current.bold = true
            if (ch.italic) current.italic = true
            if (ch.underline) current.underlined = true
            if (ch.strike) current.strikethrough = true
            if (ch.obfuscated) current.obfuscated = true

            components.push(current)
        } else {
            if (current != null) {
                current.text += ch.char
            }
        }
    }

    return components
}

export function minecraftTextToComponent(lines: MinecraftText[][]): string {
    const extra: TextComponent[] = []

    lines.forEach((line, lineIndex) => {
        const comps = lineToComponents(line)

        if (comps.length === 0) {
            extra.push({ text: "" })
        } else {
            extra.push(...comps)
        }

        if (lineIndex < lines.length - 1) {
            extra.push({ text: "\n" })
        }
    })

    const root = {
        text: "",
        extra,
    }

    return JSON.stringify(root)
}