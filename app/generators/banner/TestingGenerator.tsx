// TODO: THIS FILE IS ONLY FOR TESTING; DELETE ONCE NO LONGER NEEDED
//

'use client'

import React, { useEffect, useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { patternList } from './bannerUtils'

type ImgEntry = { name: string; url: string }

export default function BannerPreviewGenerator() {
    const [images, setImages] = useState<ImgEntry[]>([])
    const [loading, setLoading] = useState(true)

    const FRONT_X = 1
    const FRONT_Y = 1
    const FRONT_W = 20
    const FRONT_H = 40

    useEffect(() => {
        const darkBg = '#171717'
        const whiteFg = '#ffffff'

        const loadImage = (src: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = () => resolve(img)
                img.onerror = (e) => reject(e)
                img.src = src
            })

        ;(async () => {
            setLoading(true)
            const results: ImgEntry[] = []

            for (const pattern of patternList) {
                try {
                    const src = `/banner/patterns/textures/${pattern}.png`
                    const img = await loadImage(src)

                    const srcW = Math.min(FRONT_W, Math.max(0, img.width - FRONT_X))
                    const srcH = Math.min(FRONT_H, Math.max(0, img.height - FRONT_Y))

                    const canvas = document.createElement('canvas')
                    canvas.width = srcW
                    canvas.height = srcH
                    const ctx = canvas.getContext('2d')!
                    ctx.imageSmoothingEnabled = false

                    // Dark background
                    ctx.fillStyle = darkBg
                    ctx.fillRect(0, 0, canvas.width, canvas.height)

                    // Temporary canvas for white masking
                    const tmp = document.createElement('canvas')
                    tmp.width = srcW
                    tmp.height = srcH
                    const tctx = tmp.getContext('2d')!
                    tctx.imageSmoothingEnabled = false
                    tctx.clearRect(0, 0, tmp.width, tmp.height)

                    tctx.drawImage(img, FRONT_X, FRONT_Y, srcW, srcH, 0, 0, srcW, srcH)

                    // Apply white overlay using multiply
                    tctx.globalCompositeOperation = 'multiply'
                    tctx.fillStyle = whiteFg
                    tctx.fillRect(0, 0, tmp.width, tmp.height)

                    // Mask with original crop alpha
                    tctx.globalCompositeOperation = 'destination-in'
                    tctx.drawImage(img, FRONT_X, FRONT_Y, srcW, srcH, 0, 0, srcW, srcH)

                    tctx.globalCompositeOperation = 'source-over'

                    ctx.drawImage(tmp, 0, 0)

                    const url = canvas.toDataURL('image/png')
                    results.push({ name: pattern, url })
                } catch (err) {
                    console.error('Failed to load/process pattern:', pattern, err)
                }
            }

            setImages(results)
            setLoading(false)
        })()
    }, [])

    const downloadImage = (url: string, name: string) => {
        saveAs(url, `${name}.png`)
    }

    const downloadAll = async () => {
        const zip = new JSZip()
        for (const img of images) {
            const base64 = img.url.split(',')[1]
            zip.file(`${img.name}.png`, base64, { base64: true })
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        saveAs(blob, 'banner-previews.zip')
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Banner Pattern Previews (20×40 front)</h1>

            {loading && <p>Generating previews…</p>}

            <div className="grid grid-cols-6 gap-4">
                {images.map((img) => (
                    <div key={img.name} className="flex flex-col items-center gap-2">
                        <div
                            style={{
                                width: FRONT_W * 3,
                                height: FRONT_H * 3,
                                background: '#111',
                                display: 'inline-block',
                            }}
                        >
                            <img
                                src={img.url}
                                alt={img.name}
                                width={FRONT_W * 3}
                                height={FRONT_H * 3}
                                style={{ imageRendering: 'pixelated', display: 'block' }}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="px-2 py-1 border rounded text-sm"
                                onClick={() => downloadImage(img.url, img.name)}
                            >
                                Download
                            </button>
                        </div>

                        <div className="text-xs text-neutral-500">{img.name}</div>
                    </div>
                ))}
            </div>

            {images.length > 0 && (
                <div className="pt-4">
                    <button className="px-4 py-2 border rounded" onClick={downloadAll}>
                        Download All (ZIP)
                    </button>
                </div>
            )}
        </div>
    )
}
