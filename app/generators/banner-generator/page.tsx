'use client'

import React, { useEffect, useState } from 'react'
import Banner3D from './Banner3d'
import { patternList } from './patterns'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ImageObj from 'next/image'
import { DyeColors } from '@/lib/Colors'

import type { Pattern } from './BannerImageManager'
import { createLayerPreview } from './BannerImageManager'

type EditTarget =
    | { type: 'base' }
    | { type: 'pattern'; index: number }
    | null

const ColorPicker = ({selected, onSelect,}: { selected: string, onSelect: (hex: string) => void }) => (
    <div className="flex flex-wrap gap-2">
        {Object.keys(DyeColors).map((colorKey) => {
            const hex = DyeColors[colorKey]
            return (
                <button
                    key={hex}
                    className={`w-16 rounded-md border p-2 ${hex === selected ? 'ring-2 ring-offset-1' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => onSelect(hex)}
                >
                    <ImageObj
                        src={`/assets/dyes/${colorKey}.png`}
                        alt={colorKey}
                        width={16}
                        height={16}
                        className="w-full image-pixelated"
                    />
                </button>
            )
        })}
    </div>
)

export default function BannerPage() {
    const [baseColor, setBaseColor] = useState(DyeColors.white)
    const [patterns, setPatterns] = useState<Pattern[]>([])
    const [editing, setEditing] = useState<EditTarget>(null)

    const addPattern = () => {
        setPatterns((p) => [...p, { pattern: 'border', color: DyeColors.white }])
        setTimeout(() => setEditing({ type: 'pattern', index: patterns.length }), 0)
    }

    const updatePattern = (index: number, update: Partial<Pattern>) => {
        setPatterns((p) =>
            p.map((item, i) => (i === index ? { ...item, ...update } : item))
        )
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
        setEditing(null)
    }

    // Close popup on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as HTMLElement
            if (t.closest('[data-popup-container]') || t.closest('[data-layer]') || t.closest('[data-base-button]')) return
            setEditing(null)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Layer previews
    useEffect(() => {
        patterns.forEach((p, i) => {
            const canvas = document.getElementById(`layer-preview-${i}`) as HTMLCanvasElement | null
            if (!canvas) return
            createLayerPreview(canvas, p).catch(() => {})
        })
    }, [patterns])

    const bannerColor = Object.keys(DyeColors).find((k) => DyeColors[k] === baseColor) ?? 'white'

    const command = `/give @p minecraft:${bannerColor}_banner[banner_patterns=[${patterns
        .map((p) => {
            const colorKey = Object.keys(DyeColors).find((k) => DyeColors[k] === p.color) ?? 'white'
            return `{pattern:${p.pattern},color:${colorKey}}`
        })
        .join(',')}]]`

    return (
        <div>
            <div className="flex gap-4">
                <Card className="w-1/2">
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Banner3D
                            baseColor={baseColor}
                            patterns={patterns}
                            width={600}
                            height={400}
                        />
                    </CardContent>
                </Card>

                {/* Layers */}
                <Card className="w-1/2">
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>Layers</CardTitle>
                        <Button size="sm" onClick={addPattern}>Add</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Base layer */}
                        <div className="relative">
                            <div className="flex items-center gap-3 border rounded-md p-2">
                                <div className="w-10 aspect-1/2" style={{ backgroundColor: baseColor }} />
                                <Badge variant="secondary">Base</Badge>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto"
                                    data-base-button
                                    onClick={() => setEditing({ type: 'base' })}
                                >
                                    Edit
                                </Button>
                            </div>

                            <div data-popup-container className={`absolute z-50 mt-2 left-0 w-80 transition-all ${editing?.type === 'base' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                {editing?.type === 'base' && (
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium">Color</p>
                                            <ColorPicker selected={baseColor} onSelect={setBaseColor} />
                                            <div className="w-full text-right mt-2">
                                                <Button size="sm" onClick={() => setEditing(null)}>Close</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
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
                                        className="w-10 aspect-1/2 border"
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
                                            onClick={() => setEditing({ type: 'pattern', index: i })}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </div>

                                <div data-popup-container className={`absolute z-50 mt-2 w-full transition-all ${editing?.type === 'pattern' && editing.index === i ? 'opacity-100' : 'opacity-0'}`}>
                                    {editing?.type === 'pattern' && editing.index === i && (
                                        <Card>
                                            <CardContent>
                                                <p className="mb-1 text-sm font-medium">Pattern</p>
                                                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-scroll p-2">
                                                    {patternList.map((pat) => (
                                                        <button
                                                            key={pat}
                                                            className={`rounded ${pat === p.pattern ? 'ring-4 ring-gray-400' : ''}`}
                                                            onClick={() => updatePattern(i, { pattern: pat })}
                                                        >
                                                            <ImageObj
                                                                src={`/assets/tool/banner/previews/${pat}.png`}
                                                                alt={pat}
                                                                width={20}
                                                                height={40}
                                                                style={{ imageRendering: 'pixelated' }}
                                                                className="w-[40]"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mb-1 text-sm font-medium mt-2">Color</p>
                                                <ColorPicker selected={p.color} onSelect={(hex) => updatePattern(i, { color: hex })} />
                                                <div className="w-full text-right mt-2">
                                                    <Button size="sm" onClick={() => setEditing(null)}>Close</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Command */}
            <Card className="mt-4">
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
        </div>
    )
}
