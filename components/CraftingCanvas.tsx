'use client'

import { useEffect, useRef } from 'react'
import { getImageAsset } from '@/lib/images/getImageAsset'

type CraftingInputs = (string | null)[]

interface CraftingCanvasProps {
    inputs: CraftingInputs
    output?: string | null
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

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        const bg = new Image()
        bg.src = getImageAsset('shared_crafting_table')

        bg.onload = () => {
            ctx.drawImage(bg, 0, 0)

            // draw input grid (flat array -> 3x3)
            for (let i = 0; i < 9; i++) {
                const src = inputs[i] ?? null
                if (!src) continue

                const row = Math.floor(i / 3)
                const col = i % 3

                const x = INPUT_START_X + col * (SLOT_SIZE + SLOT_GAP)
                const y = INPUT_START_Y + row * (SLOT_SIZE + SLOT_GAP)

                const img = new Image()
                img.src = src

                img.onload = () => {
                    ctx.drawImage(img, x, y, SLOT_SIZE, SLOT_SIZE)
                }
            }

            // draw output
            if (output) {
                const outImg = new Image()
                outImg.src = output

                outImg.onload = () => {
                    ctx.drawImage(outImg, OUTPUT_X, OUTPUT_Y, SLOT_SIZE, SLOT_SIZE)
                }
            }
        }
    }, [inputs, output])

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block w-full h-auto image-pixelated"
            style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
        />
    )
}
