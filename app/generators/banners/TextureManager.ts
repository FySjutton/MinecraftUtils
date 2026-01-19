import {Mode} from "@/app/generators/banners/editor/BannerGenerator";
import {PatternType} from "@/app/generators/banners/patterns";

export type Pattern = {
    pattern: PatternType
    color: string
}

const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
    if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!)
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            imageCache.set(src, img)
            resolve(img)
        }
        img.onerror = reject
        img.src = src
    })
}

function tintMasked(ctx: CanvasRenderingContext2D, img: HTMLImageElement, color: string, sx = 0, sy = 0, sw = img.width, sh = img.height) {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    ctx.fillStyle = color
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillRect(0, 0, sw, sh)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    ctx.globalCompositeOperation = 'source-over'
}

type CreateLayerPreviewOptions = {
    baseColor?: string
    useBase?: boolean
}

// TODO: new layer preview destroyed previous 3d; check buildTextureCanvas. displaying as black

export async function createLayerPreview(
    canvas: HTMLCanvasElement,
    patterns: Pattern | Pattern[],
    mode: Mode,
    options: CreateLayerPreviewOptions = {}
) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { baseColor = undefined, useBase = false } = options
    const patternArray = Array.isArray(patterns) ? patterns : [patterns]

    const baseImg = await loadImage(`/assets/tool/banner/textures/${mode}/base.png`)

    let usableW = 20
    let usableH = 40
    let offsetX = 1
    let offsetY = 1
    if (mode === 'shield') {
        usableW = 12
        usableH = 22
        offsetX = 1
        offsetY = 1
    }

    canvas.width = usableW
    canvas.height = usableH
    ctx.clearRect(0, 0, usableW, usableH)

    if (useBase) {
        ctx.drawImage(baseImg, offsetX, offsetY, usableW, usableH, 0, 0, usableW, usableH)

        if (baseColor) {
            tintMasked(ctx, baseImg, baseColor, offsetX, offsetY, usableW, usableH)
        }
    } else if (baseColor) {
        ctx.fillStyle = baseColor
        ctx.fillRect(0, 0, usableW, usableH)
    }

    for (const p of patternArray) {
        const img = await loadImage(`/assets/tool/banner/textures/${mode}/${p.pattern}.png`)
        const tmp = document.createElement('canvas')
        tmp.width = usableW
        tmp.height = usableH
        const tctx = tmp.getContext('2d')!
        tintMasked(tctx, img, p.color, offsetX, offsetY, usableW, usableH)
        ctx.drawImage(tmp, 0, 0)
    }
}

export async function buildTextureCanvas(
    baseColor: string,
    patterns: Pattern[],
    mode: Mode
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (mode === "banner") {
        const baseImg = await loadImage("/assets/tool/banner/textures/banner/base.png")
        canvas.width = baseImg.width
        canvas.height = baseImg.height
        tintMasked(ctx, baseImg, baseColor, 0, 0, baseImg.width, baseImg.height)
        await createLayerPreview(canvas, patterns, mode)
    } else if (mode === "shield") {
        const shieldBase = await loadImage('/assets/tool/banner/shield_base.png')
        const baseImg = await loadImage('/assets/tool/banner/textures/shield/base.png')
        canvas.width = shieldBase.width
        canvas.height = shieldBase.height
        ctx.drawImage(shieldBase, 0, 0, shieldBase.width, shieldBase.height)
        const tmp = document.createElement('canvas')
        tmp.width = 12
        tmp.height = 22
        const tctx = tmp.getContext('2d')!
        tintMasked(tctx, baseImg, baseColor, 0, 0, baseImg.width, baseImg.height)
        ctx.drawImage(tmp, 0, 0, 12, 22, 0, 0, 12, 22)
        await createLayerPreview(canvas, patterns, mode)
    }

    return canvas
}
