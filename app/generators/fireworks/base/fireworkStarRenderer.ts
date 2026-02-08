import {getImageAsset} from "@/lib/images/getImageAsset";

export async function getFireworkStarImage(colors: string[]): Promise<string> {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')!

    if (colors.length === 0) {
        colors = ['#8A8A8A']
    }

    let r = 0, g = 0, b = 0
    for (const hex of colors) {
        const rgb = parseInt(hex.slice(1), 16)
        r += (rgb >> 16) & 0xFF
        g += (rgb >> 8) & 0xFF
        b += rgb & 0xFF
    }

    const avgR = Math.floor(r / colors.length)
    const avgG = Math.floor(g / colors.length)
    const avgB = Math.floor(b / colors.length)

    const baseImage = new Image()
    const overlayImage = new Image()

    return new Promise((resolve) => {
        let loaded = 0
        const onLoad = () => {
            loaded++
            if (loaded === 2) {
                ctx.drawImage(baseImage, 0, 0, 16, 16)

                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = 16
                tempCanvas.height = 16
                const tempCtx = tempCanvas.getContext('2d')!
                tempCtx.drawImage(overlayImage, 0, 0, 16, 16)

                const imageData = tempCtx.getImageData(0, 0, 16, 16)
                const data = imageData.data

                for (let i = 0; i < data.length; i += 4) {
                    data[i] = (data[i] * avgR) / 255
                    data[i + 1] = (data[i + 1] * avgG) / 255
                    data[i + 2] = (data[i + 2] * avgB) / 255
                }

                tempCtx.putImageData(imageData, 0, 0)
                ctx.drawImage(tempCanvas, 0, 0, 16, 16)

                resolve(canvas.toDataURL())
            }
        }

        baseImage.onload = onLoad
        overlayImage.onload = onLoad
        baseImage.src = getImageAsset("firework_star")
        overlayImage.src = getImageAsset("firework_star_overlay")
    })
}