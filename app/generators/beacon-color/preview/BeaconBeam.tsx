'use client'

import React, { useEffect, useRef } from 'react'

interface BeaconPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: string
    width?: number
    height?: number
    src?: string
}

export function BeaconPreview({color = '#ffffff', width = 64, height = 64, src = '/assets/tool/beacon/beacon_beam.png', className, ...props
}: BeaconPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            const imgData = ctx.getImageData(0, 0, img.width, img.height)
            const data = imgData.data

            const r = parseInt(color.slice(1, 3), 16) / 255
            const g = parseInt(color.slice(3, 5), 16) / 255
            const b = parseInt(color.slice(5, 7), 16) / 255

            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * r
                data[i + 1] = data[i + 1] * g
                data[i + 2] = data[i + 2] * b
            }

            ctx.putImageData(imgData, 0, 0)
        }
    }, [color, src])

    return (
        <div
            className={`inline-block ${className ?? ''}`}
            style={{ width, height, backgroundColor: color }}
            {...props}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    )
}
