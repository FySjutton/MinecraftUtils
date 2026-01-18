export type Pattern = {
    pattern: string
    color: string
}

const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!)
    }

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

export async function createLayerPreview(canvas: HTMLCanvasElement, pattern: Pattern, backgroundColor?: string) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = await loadImage(`/assets/tool/banner/textures/${pattern.pattern}.png`)

    const frontX = 1
    const frontY = 1
    const frontW = 20
    const frontH = 40

    canvas.width = frontW
    canvas.height = frontH

    ctx.clearRect(0, 0, frontW, frontH)

    tintMasked(ctx, img, pattern.color, frontX, frontY, frontW, frontH)

    if (backgroundColor) {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, frontW, frontH)
        ctx.globalCompositeOperation = 'source-over'
    }
}

export async function buildBannerCanvas(baseColor: string, patterns: Pattern[]): Promise<HTMLCanvasElement> {
    const baseImg = await loadImage('/assets/tool/banner/textures/base.png')

    const canvas = document.createElement('canvas')
    canvas.width = baseImg.width
    canvas.height = baseImg.height

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    tintMasked(ctx, baseImg, baseColor)

    for (const p of patterns) {
        const img = await loadImage(
            `/assets/tool/banner/textures/${p.pattern}.png`
        )

        const tmp = document.createElement('canvas')
        tmp.width = img.width
        tmp.height = img.height

        const tctx = tmp.getContext('2d')!
        tintMasked(tctx, img, p.color)

        ctx.drawImage(tmp, 0, 0)
    }

    return canvas
}
