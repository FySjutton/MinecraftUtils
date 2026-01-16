'use client'

import React, { useEffect, useState } from 'react'
import Banner3D, { Pattern } from './Banner3d'
import { colorHexes, patternList } from './bannerUtils'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ImageObj from "next/image";

type EditTarget =
    | { type: 'base' }
    | { type: 'pattern'; index: number }
    | null

export default function BannerPage() {
    const [baseColor, setBaseColor] = useState(colorHexes.white)
    const [patterns, setPatterns] = useState<Pattern[]>([])
    const [editing, setEditing] = useState<EditTarget>(null)
    const [openPopup, setOpenPopup] = useState<number | null>(null)

    const addPattern = () => {
        setPatterns((p) => [...p, { pattern: 'border', color: colorHexes.white }])
        setTimeout(() => setOpenPopup(patterns.length), 0)
    }

    const updatePattern = (index: number, update: Partial<Pattern>) => {
        setPatterns((p) => p.map((item, i) => (i === index ? { ...item, ...update } : item)))
    }

    const movePattern = (from: number, to: number) => {
        if (to < 0 || to >= patterns.length) return
        setPatterns((prev) => {
            const next = prev.slice()
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
    }

    const removePattern = (index: number) => {
        setPatterns((p) => p.filter((_, i) => i !== index))
        setOpenPopup(null)
    }

    // close popup on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as HTMLElement
            if (t.closest('[data-popup]') || t.closest('[data-layer]')) return
            setOpenPopup(null)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // render small previews
    useEffect(() => {
        const loadImage = (src: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image()
                img.onload = () => resolve(img)
                img.onerror = reject
                img.src = src
            })

        ;(async () => {
            for (let i = 0; i < patterns.length; i++) {
                const p = patterns[i]
                const canvas = document.getElementById(`layer-preview-${i}`) as HTMLCanvasElement | null
                if (!canvas) continue
                const ctx = canvas.getContext('2d')
                if (!ctx) continue

                try {
                    // load the full texture
                    const img = await loadImage(`/banner/patterns/textures/${p.pattern}.png`)
                    const frontX = 1
                    const frontY = 1
                    const frontW = 20
                    const frontH = 40

                    canvas.width = frontW
                    canvas.height = frontH
                    ctx.clearRect(0, 0, canvas.width, canvas.height)

                    ctx.drawImage(img, frontX, frontY, frontW, frontH, 0, 0, frontW, frontH)

                    ctx.fillStyle = p.color
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.fillRect(0, 0, frontW, frontH)

                    ctx.globalCompositeOperation = 'destination-in'
                    ctx.drawImage(img, frontX, frontY, frontW, frontH, 0, 0, frontW, frontH)

                    ctx.globalCompositeOperation = 'source-over'
                } catch {}
            }
        })()
    }, [patterns])

    const bannerColor =
        Object.keys(colorHexes).find((k) => colorHexes[k] === baseColor) ?? 'white'

    const command = `/give @p minecraft:${bannerColor}_banner[banner_patterns=[${patterns
        .map((p) => {
            const colorKey =
                Object.keys(colorHexes).find((k) => colorHexes[k] === p.color) ?? 'white'
            return `{pattern:${p.pattern},color:${colorKey}}`
        })
        .join(',')}]]`

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Banner Generator</h1>

            <div className="grid grid-cols-[1fr_360px] gap-6">
                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Banner3D baseColor={baseColor} patterns={patterns} width={600} height={400} />
                    </CardContent>
                </Card>

                {/* Layers */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>Layers</CardTitle>
                        <Button size="sm" onClick={addPattern}>Add</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Base layer */}
                        <div className="flex items-center gap-3 border rounded-md p-2">
                            <div className="w-10 h-14 rounded" style={{ backgroundColor: baseColor }} />
                            <Badge variant="secondary">Base</Badge>
                            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setEditing({ type: 'base' })}>
                                Edit
                            </Button>
                        </div>

                        {/* Pattern layers */}
                        {patterns.map((p, i) => (
                            <div key={i} className="relative">
                                <div
                                    data-layer
                                    className="flex items-center gap-3 border rounded-md p-2"
                                >
                                    <canvas
                                        id={`layer-preview-${i}`}
                                        className="w-10 h-14 border rounded"
                                        style={{ imageRendering: 'pixelated' }}
                                    />

                                    <Badge variant="secondary" className="capitalize">
                                        {p.pattern}
                                    </Badge>

                                    <div className="flex gap-1 ml-auto">
                                        <Button size="sm" variant="outline" onClick={() => movePattern(i, i - 1)}>↑</Button>
                                        <Button size="sm" variant="outline" onClick={() => movePattern(i, i + 1)}>↓</Button>
                                        <Button size="sm" variant="destructive" onClick={() => removePattern(i)}>✕</Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setOpenPopup(openPopup === i ? null : i)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </div>

                                {/* Popup editor */}
                                <Card
                                    data-popup
                                    className={`absolute z-50 mt-2 left-0 w-80 transition-all ${
                                        openPopup === i
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-0 scale-95 pointer-events-none'
                                    }`}
                                >
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="mb-1 text-sm font-medium">Pattern</p>
                                            <div className="flex flex-wrap gap-2 max-h-[200] overflow-y-scroll p-2">
                                                {patternList.map((pat) => (
                                                    <button
                                                        key={pat}
                                                        className={`border rounded p-1 ${pat === p.pattern ? 'ring-1 ring-offset-1' : ''}`}
                                                        onClick={() => updatePattern(i, { pattern: pat })}
                                                    >
                                                        <ImageObj
                                                            src={`/banner/patterns/previews/${pat}.png`}
                                                            alt={pat}
                                                            width={20}
                                                            height={40}
                                                            style={{ imageRendering: 'pixelated' }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-sm font-medium">Color</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(colorHexes).map(([name, hex]) => (
                                                    <button
                                                        key={name}
                                                        className={`w-7 h-7 rounded border ${hex === p.color ? 'ring-2 ring-offset-1' : ''}`}
                                                        style={{ backgroundColor: hex as string }}
                                                        onClick={() => updatePattern(i, { color: hex as string })}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Command */}
            <Card>
                <CardHeader>
                    <CardTitle>Minecraft Command</CardTitle>
                </CardHeader>
                <CardContent>
          <textarea
              readOnly
              value={command}
              className="w-full h-32 font-mono text-sm border rounded-md p-2"
              onClick={(e) => navigator.clipboard.writeText((e.target as HTMLTextAreaElement).value)}
          />
                </CardContent>
            </Card>

            {/* Base color dialog */}
            {editing?.type === 'base' && (
                <Card className="fixed inset-x-0 bottom-0 mx-auto max-w-md z-50">
                    <CardHeader>
                        <CardTitle>Edit Base Color</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {Object.values(colorHexes).map((hex) => (
                            <button
                                key={hex}
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: hex }}
                                onClick={() => setBaseColor(hex)}
                            />
                        ))}
                        <div className="w-full text-right">
                            <Button size="sm" onClick={() => setEditing(null)}>Close</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
