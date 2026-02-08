'use client'

import { useEffect, useRef } from 'react'
import { getImageAsset } from '@/lib/images/getImageAsset'

type CraftingInputSource = string | HTMLImageElement | HTMLCanvasElement | Promise<string>
type CraftingInputs = (CraftingInputSource | null)[]

interface CraftingCanvasProps {
    inputs: CraftingInputs
    output?: CraftingInputSource | null
}

const CANVAS_WIDTH = 176
const CANVAS_HEIGHT = 77

const SLOT_SIZE = 16
const SLOT_GAP = 2

const INPUT_START_X = 30
const INPUT_START_Y = 17

const OUTPUT_X = 124
const OUTPUT_Y = 35

export function CraftingCanvas({ inputs, output }: CraftingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // determine largest image to pick scale
        let maxDim = 16
        const allSrcs: CraftingInputSource[] = [
            ...inputs.filter(Boolean),
            output,
        ].filter(Boolean) as CraftingInputSource[]

        const checkSize = (src: CraftingInputSource, callback: () => void) => {
            if (src instanceof Promise) {
                src.then(dataUrl => {
                    const img = new Image()
                    img.src = dataUrl
                    img.onload = () => {
                        maxDim = Math.max(maxDim, img.width, img.height)
                        callback()
                    }
                })
            } else if (typeof src === 'string') {
                const img = new Image()
                img.src = src
                img.onload = () => {
                    maxDim = Math.max(maxDim, img.width, img.height)
                    callback()
                }
            } else {
                maxDim = Math.max(maxDim, src.width, src.height)
                callback()
            }
        }

        let loadedCount = 0
        const totalCount = allSrcs.length
        if (totalCount === 0) drawCanvas()
        else {
            allSrcs.forEach((src) => checkSize(src, () => {
                loadedCount++
                if (loadedCount === totalCount) drawCanvas()
            }))
        }

        function drawCanvas() {
            if (!ctx || !canvas) return

            // choose scale
            let SCALE = 1
            if (maxDim > 64) SCALE = 4
            else if (maxDim > 16) SCALE = 2

            canvas.width = CANVAS_WIDTH * SCALE
            canvas.height = CANVAS_HEIGHT * SCALE

            ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

            const drawInput = (
                src: CraftingInputSource,
                x: number,
                y: number,
                size: number
            ) => {
                const draw = (img: HTMLImageElement | HTMLCanvasElement) => {
                    if (img.width === 16 && img.height === 16) {
                        ctx.imageSmoothingEnabled = false
                        ctx.drawImage(img, x, y, size, size)
                    } else {
                        ctx.imageSmoothingEnabled = true
                        const aspect = img.width / img.height
                        let w = size
                        let h = size

                        if (aspect > 1) h = w / aspect
                        else w = h * aspect

                        ctx.drawImage(
                            img,
                            x + (size - w) / 2,
                            y + (size - h) / 2,
                            w,
                            h
                        )
                    }
                }

                if (src instanceof Promise) {
                    src.then(dataUrl => {
                        const img = new Image()
                        img.src = dataUrl
                        img.onload = () => draw(img)
                    })
                } else if (typeof src === 'string') {
                    const img = new Image()
                    img.src = src
                    img.onload = () => draw(img)
                } else {
                    draw(src)
                }
            }

            // draw background pixel-perfect
            const bg = new Image()
            bg.src = getImageAsset('shared_crafting_table')
            bg.onload = () => {
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

                // draw inputs
                for (let i = 0; i < 9; i++) {
                    const src = inputs[i]
                    if (!src) continue
                    const row = Math.floor(i / 3)
                    const col = i % 3
                    const x = INPUT_START_X + col * (SLOT_SIZE + SLOT_GAP)
                    const y = INPUT_START_Y + row * (SLOT_SIZE + SLOT_GAP)
                    drawInput(src, x, y, SLOT_SIZE)
                }

                // draw output
                if (output) drawInput(output, OUTPUT_X, OUTPUT_Y, SLOT_SIZE)
            }
        }
    }, [inputs, output])

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-auto"
            style={{
                aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                imageRendering: 'pixelated', // ensures 16x16 assets are crisp
            }}
        />
    )
}
