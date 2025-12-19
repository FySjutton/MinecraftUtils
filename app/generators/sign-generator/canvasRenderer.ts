import { MinecraftText } from '@/lib/MinecraftText'
import {DyeColors} from "@/lib/Colors";

const PADDING = 8

export function drawMinecraftSignToCanvas(
    lines: MinecraftText[][],
    fontSize: number,
    lineHeightMult: number,
    glowing = false,
    fallbackColor: string = 'black'
): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    if (!ctx) throw new Error('2D context not available')

    const linesCount = Math.max(1, lines.length)
    const lineHeight = Math.round(fontSize * lineHeightMult)

    ctx.textBaseline = 'middle'
    ctx.imageSmoothingEnabled = false

    // measure widest line
    let maxLineWidth = 0
    for (const line of lines) {
        let lineWidth = 0
        for (const ch of line) {
            const fontWeight = ch.bold ? 'bold' : 'normal'
            const fontStyle = ch.italic ? 'italic' : 'normal'
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Minecraft`
            lineWidth += ctx.measureText(ch.char).width
        }
        maxLineWidth = Math.max(maxLineWidth, lineWidth)
    }

    const canvasWidth = Math.max(1, Math.ceil(maxLineWidth + PADDING * 2))
    const canvasHeight = Math.max(1, Math.ceil(linesCount * lineHeight + PADDING * 2))
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const startY = 4 + PADDING + lineHeight / 2

    for (let lineIndex = 0; lineIndex < linesCount; lineIndex++) {
        const line = lines[lineIndex] ?? []

        let totalLineWidth = 0
        for (const ch of line) {
            const fontWeight = ch.bold ? 'bold' : 'normal'
            const fontStyle = ch.italic ? 'italic' : 'normal'
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Minecraft`
            totalLineWidth += ctx.measureText(ch.char).width
        }

        let x = (canvasWidth - totalLineWidth) / 2
        const y = startY + lineIndex * lineHeight

        for (const ch of line) {
            const fontWeight = ch.bold ? 'bold' : 'normal'
            const fontStyle = ch.italic ? 'italic' : 'normal'
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Minecraft`

            const color: string = ch.color ?? fallbackColor
            const fillColor = color.startsWith("#") ? color : DyeColors[color]
            const fillInt = parseInt(fillColor.replace('#', ''), 16)
            const outlineColor = getOutlineColor(fillInt)

            if (glowing && outlineColor) {
                const offset = 4

                ctx.fillStyle = outlineColor

                ctx.fillText(ch.char, x - offset, y)
                ctx.fillText(ch.char, x + offset, y)
                ctx.fillText(ch.char, x, y - offset)
                ctx.fillText(ch.char, x, y + offset)

                ctx.fillText(ch.char, x - offset, y - offset)
                ctx.fillText(ch.char, x + offset, y - offset)
                ctx.fillText(ch.char, x - offset, y + offset)
                ctx.fillText(ch.char, x + offset, y + offset)

                ctx.fillStyle = fillColor
                ctx.fillText(ch.char, x, y)
            } else {
                ctx.fillStyle = fillColor
                ctx.fillText(ch.char, x, y)
            }

            const charWidth = ctx.measureText(ch.char).width
            if (ch.underline) ctx.fillRect(x, y + fontSize * 0.35, charWidth, Math.max(1, Math.round(fontSize * 0.06)))
            if (ch.strike) ctx.fillRect(x, y, charWidth, Math.max(1, Math.round(fontSize * 0.06)))

            x += charWidth
        }
    }

    return canvas
}

function getOutlineColor(fillInt: number): string {
    if (fillInt === 1908001 || fillInt == 0) return '#F0F0CC'
    return intToRgbString(scaleRgbInt(fillInt, 0.4))
}

function scaleRgbInt(colorInt: number, factor: number) {
    const r = Math.floor(((colorInt >> 16) & 0xFF) * factor)
    const g = Math.floor(((colorInt >> 8) & 0xFF) * factor)
    const b = Math.floor((colorInt & 0xFF) * factor)
    return (r << 16) | (g << 8) | b
}

function intToRgbString(colorInt: number) {
    const r = (colorInt >> 16) & 0xFF
    const g = (colorInt >> 8) & 0xFF
    const b = colorInt & 0xFF
    return `rgb(${r},${g},${b})`
}
