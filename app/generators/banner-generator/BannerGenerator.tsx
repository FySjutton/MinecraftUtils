'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
    | { type: 'add' }
    | null

const ColorPicker = ({selected, onSelect, onHover, onLeave}: { selected: string, onSelect: (hex: string) => void, onHover?: (hex: string) => void, onLeave?: () => void }) => (
    <div className="flex flex-wrap gap-2">
        {Object.keys(DyeColors).map((colorKey) => {
            const hex = DyeColors[colorKey]
            return (
                <button
                    key={hex}
                    className={`w-16 rounded-md border p-2 hover:ring-2 ${hex === selected ? 'ring-2 ring-offset-1' : ''}`}
                    style={{ backgroundColor: hex }}
                    onMouseEnter={() => onHover?.(hex)}
                    onMouseLeave={() => onLeave?.()}
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

const CanvasPreview = ({pattern, color, width = 20, height = 40,}: { pattern: string, color: string, width?: number, height?: number }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        createLayerPreview(canvasRef.current, { pattern, color }).catch(() => {})
    }, [pattern, color])

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-10 h-20 border"
            style={{ imageRendering: 'pixelated' }}
        />
    )
}

const PatternEditorPopup = ({pattern, color, onPatternSelect, onColorSelect, onPatternHover, onColorHover, onLeave}: {
    pattern: string
    color: string
    onPatternSelect: (pat: string) => void
    onColorSelect: (hex: string) => void
    onPatternHover: (pat: string) => void
    onColorHover?: (hex: string) => void
    onLeave: () => void
}) => {
    return (
        <Card>
            <CardContent>
                <p className="mb-1 text-sm font-medium">Pattern</p>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-scroll p-2">
                    {patternList.map((pat) => (
                        <button
                            key={pat}
                            className={`rounded hover:ring-2 ${pat === pattern ? 'ring-4 ring-gray-400' : ''}`}
                            onMouseEnter={() => onPatternHover(pat)}
                            onMouseLeave={onLeave}
                            onClick={() => onPatternSelect(pat)}
                        >
                            <CanvasPreview pattern={pat} color={color} />
                        </button>
                    ))}
                </div>

                <p className="mb-1 text-sm font-medium mt-2">Color</p>
                <ColorPicker
                    selected={color}
                    onSelect={onColorSelect}
                    onHover={onColorHover}
                    onLeave={onLeave}
                />
            </CardContent>
        </Card>
    )
}

export default function BannerGenerator() {
    const [baseColor, setBaseColor] = useState(DyeColors.white)
    const [patterns, setPatterns] = useState<Pattern[]>([])
    const [editing, setEditing] = useState<EditTarget>(null)

    const [addColor, setAddColor] = useState(baseColor == DyeColors.white ? DyeColors.light_gray : DyeColors.white)

    const [preview, setPreview] = useState<{
        index: number
        pattern: Pattern
    } | null>(null)
    const [hoveredBaseColor, setHoveredBaseColor] = useState<string | null>(null)

    const effectivePatterns = useMemo(() => {
        if (!preview) return patterns
        if (preview.index === patterns.length) {
            return [...patterns, preview.pattern]
        }
        return patterns.map((p, i) => (i === preview.index ? preview.pattern : p))
    }, [patterns, preview])

    const startAdd = () => {
        setAddColor(baseColor == DyeColors.white ? DyeColors.light_gray : DyeColors.white)
        setEditing({type: 'add'})
    }

    const commitAdd = (pattern: string) => {
        setPatterns((p) => [...p, {pattern, color: addColor}])
        setTimeout(() => setEditing(null), 0)
        setPreview(null)
    }

    const updatePattern = (index: number, update: Partial<Pattern>) => {
        setPatterns((p) =>
            p.map((item, i) => (i === index ? {...item, ...update} : item))
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

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as HTMLElement
            if (t.closest('[data-popup-container]') || t.closest('[data-layer]') || t.closest('[data-base-button]') || t.closest('[data-add-button]')) return
            setEditing(null)
            setPreview(null)
            setAddColor(DyeColors.white)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        patterns.forEach((p, i) => {
            const canvas = document.getElementById(`layer-preview-${i}`) as HTMLCanvasElement | null
            if (!canvas) return
            createLayerPreview(canvas, p).catch(() => {
            })
        })
    }, [patterns])

    const bannerColor = Object.keys(DyeColors).find((k) => DyeColors[k] === baseColor) ?? 'white'

    const command = `/give @p minecraft:${bannerColor}_banner[banner_patterns=[${patterns
        .map((p) => {
            const colorKey =
                Object.keys(DyeColors).find((k) => DyeColors[k] === p.color) ?? 'white'
            return `{pattern:${p.pattern},color:${colorKey}}`
        }).join(',')}]]`

    return (
        <div>
            <div className="flex gap-4">
                <Card className="w-1/2 max-w-150">
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="w-full h-full">
                        <div style={{ width: '100%', height: '100%' }}>
                            <Banner3D
                                baseColor={hoveredBaseColor ?? baseColor}
                                patterns={effectivePatterns}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>Layers</CardTitle>
                        <Button size="sm" data-add-button onClick={startAdd}>Add</Button>
                    </CardHeader>

                    <CardContent className="space-y-3 relative max-h-170 min-h-100 overflow-y-auto">
                        {/* Add popup */}
                        <div className="relative">
                            {editing?.type === 'add' && (
                                <div data-popup-container className={`mt-2`}>
                                    <PatternEditorPopup
                                        pattern=""
                                        color={addColor}
                                        onPatternSelect={commitAdd}
                                        onColorSelect={setAddColor}
                                        onPatternHover={(pat) => setPreview({index: patterns.length, pattern: {pattern: pat, color: addColor}})}
                                        onLeave={() => setPreview(null)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Base layer */}
                        <div className="relative">
                            <div className="flex items-center gap-3 border rounded-md p-2" onClick={() => setEditing({type: 'base'})}>
                                <div className="w-10 aspect-1/2" style={{backgroundColor: baseColor}}/>
                                <Badge variant="secondary">Base</Badge>
                            </div>

                            <div data-popup-container className={`absolute z-50 mt-2 w-full transition-all ${editing?.type === 'base' ? 'opacity-100' : 'opacity-0'}`}>
                                {editing?.type === 'base' && (
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium">Color</p>
                                            <ColorPicker
                                                selected={baseColor}
                                                onSelect={setBaseColor}
                                                onHover={(hex) => setHoveredBaseColor(hex)}
                                                onLeave={() => setHoveredBaseColor(null)}
                                            />
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
                                    className="flex items-center gap-3 border rounded-md p-2 w-full"
                                    onClick={() => setEditing({type: 'pattern', index: i})}
                                >
                                    <canvas
                                        id={`layer-preview-${i}`}
                                        className="w-10 aspect-1/2 border"
                                        style={{imageRendering: 'pixelated'}}
                                    />

                                    <Badge variant="secondary" className="capitalize">
                                        {p.pattern}
                                    </Badge>

                                    <div className="flex gap-2 ml-auto">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                movePattern(i, i - 1)
                                            }}
                                        >
                                            ↑
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                movePattern(i, i + 1)
                                            }}
                                        >
                                            ↓
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removePattern(i)
                                            }}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </div>

                                <div data-popup-container className={`absolute z-50 mt-2 w-full transition-all ${editing?.type === 'pattern' && editing.index === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    {editing?.type === 'pattern' && editing.index === i && (
                                        <PatternEditorPopup
                                            pattern={p.pattern}
                                            color={p.color}
                                            onPatternSelect={(pat) => updatePattern(i, {pattern: pat})}
                                            onColorSelect={(hex) => updatePattern(i, {color: hex})}
                                            onPatternHover={(pat) => setPreview({index: i, pattern: {...p, pattern: pat},})}
                                            onColorHover={(hex) => setPreview({index: i, pattern: {...p, color: hex},})}
                                            onLeave={() => setPreview(null)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Minecraft Command</CardTitle>
                </CardHeader>
                <CardContent>
                <textarea
                    readOnly
                    value={command}
                    className="w-full h-32 font-mono text-sm border rounded-md p-2"
                    onClick={(e) =>
                        navigator.clipboard.writeText(
                            (e.target as HTMLTextAreaElement).value
                        )
                    }
                />
                </CardContent>
            </Card>
        </div>
    )
}
