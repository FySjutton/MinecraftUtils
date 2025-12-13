import { MinecraftText } from '@/lib/MinecraftText'

export const DEFAULT_FONT_SIZE = 36
const PADDING = 8
const LINE_HEIGHT_MULT = 1.25

export function drawMinecraftSignToCanvas(lines: MinecraftText[][], fontSize = DEFAULT_FONT_SIZE): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    if (!ctx) throw new Error('2D context not available')

    const linesCount = Math.max(1, lines.length)
    const lineHeight = Math.round(fontSize * LINE_HEIGHT_MULT)

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

    const startY = PADDING + lineHeight / 2

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
            ctx.fillStyle = ch.color ?? '#000000'
            ctx.fillText(ch.char, x, y)

            const charWidth = ctx.measureText(ch.char).width
            if (ch.underline) ctx.fillRect(x, y + fontSize * 0.35, charWidth, Math.max(1, Math.round(fontSize * 0.06)))
            if (ch.strike) ctx.fillRect(x, y, charWidth, Math.max(1, Math.round(fontSize * 0.06)))

            x += charWidth
        }
    }

    return canvas
}
