import {Mode, Pattern} from "@/app/generators/banners/utils/Utils";
import {findImageAsset, getImageAsset} from "@/lib/images/getImageAsset";

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
    fullsize?: boolean
}

export async function createLayerPreview(
    canvas: HTMLCanvasElement,
    patterns: Pattern | Pattern[],
    mode: Mode,
    options: CreateLayerPreviewOptions = {}
) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { baseColor = undefined, useBase = false, fullsize = false } = options
    const patternArray = Array.isArray(patterns) ? patterns : [patterns]

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseImg = await loadImage(findImageAsset(mode + "_base"))

    let usableW = fullsize ? baseImg.width : 20
    let usableH = fullsize ? baseImg.height : 40
    let offsetX = fullsize ? 0 : 1
    let offsetY = fullsize ? 0 : 1
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
        const img = await loadImage(findImageAsset(mode + "_" + p.pattern))
        const tmp = document.createElement('canvas')
        tmp.width = usableW
        tmp.height = usableH
        const tctx = tmp.getContext('2d')!
        tintMasked(tctx, img, p.color, offsetX, offsetY, usableW, usableH)
        ctx.drawImage(tmp, 0, 0)
    }
}

export async function buildTextureCanvas(baseColor: string, patterns: Pattern[], mode: Mode): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = 64
    canvas.height = 64

    if (mode === 'shield') {
        const shieldBase = await loadImage(getImageAsset("shield_base"));

        ctx.drawImage(shieldBase, 0, 0, shieldBase.width, shieldBase.height);
    }

    const tmp = document.createElement("canvas");
    if (mode === 'shield') {
        tmp.width = 12;
        tmp.height = 22;
    } else {
        tmp.width = 64;
        tmp.height = 64;
    }

    await createLayerPreview(tmp, patterns, mode, { fullsize: true, useBase: true, baseColor: baseColor });

    if (mode === 'shield') {
        ctx.drawImage(tmp, 0, 0, 12, 22, 1, 1, 12, 22);
    } else {
        ctx.drawImage(tmp, 0, 0, 64, 64, 0, 0, 64, 64);
    }

    return canvas;
}