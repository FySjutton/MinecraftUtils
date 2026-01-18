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

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import {restrictToParentElement, restrictToVerticalAxis} from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {Eye, EyeOff, X} from "lucide-react";

type EditTarget =
    | { type: 'base' }
    | { type: 'pattern'; index: number }
    | { type: 'add' }
    | null

interface PatternWithVisible extends Pattern {
    visible: boolean
}

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
    const [patterns, setPatterns] = useState<PatternWithVisible[]>([])
    const [editing, setEditing] = useState<EditTarget>(null)

    const [addColor, setAddColor] = useState(baseColor == DyeColors.white ? DyeColors.light_gray : DyeColors.white)

    const [preview, setPreview] = useState<{
        index: number
        pattern: PatternWithVisible
    } | null>(null)
    const [hoveredBaseColor, setHoveredBaseColor] = useState<string | null>(null)

    const effectivePatterns = useMemo(() => {
        if (!preview) return patterns.filter(p => p.visible)
        if (preview.index === patterns.length) {
            return [...patterns, preview.pattern].filter(p => p.visible)
        }
        return patterns.map((p, i) => (i === preview.index ? preview.pattern : p)).filter(p => p.visible)
    }, [patterns, preview])

    const startAdd = () => {
        setAddColor(baseColor == DyeColors.white ? DyeColors.light_gray : DyeColors.white)
        setEditing({type: 'add'})
    }

    const commitAdd = (pattern: string) => {
        setPatterns((p) => [...p, {pattern, color: addColor, visible: true}])
        setTimeout(() => setEditing(null), 0)
        setPreview(null)
    }

    const sensors = useSensors(useSensor(PointerSensor))
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = patterns.findIndex((_, i) => i.toString() === active.id)
            const newIndex = patterns.findIndex((_, i) => i.toString() === over.id)
            setPatterns((items) => arrayMove(items, oldIndex, newIndex))
        }
    }

    const randomizeBanner = () => {
        const num = Math.floor(Math.random() * 3) + 3 // 3-5 layers
        const newPatterns: PatternWithVisible[] = Array.from({ length: num }, () => {
            const pat = patternList[Math.floor(Math.random() * patternList.length)]
            const color = Object.values(DyeColors)[Math.floor(Math.random() * Object.values(DyeColors).length)]
            return { pattern: pat, color, visible: true }
        })
        setPatterns(newPatterns)
    }

    const clearAll = () => setPatterns([])

    const bannerColor = Object.keys(DyeColors).find((k) => DyeColors[k] === baseColor) ?? 'white'

    const command = `/give @p minecraft:${bannerColor}_banner[banner_patterns=[${patterns
        .filter(p => p.visible)
        .map((p) => {
            const colorKey =
                Object.keys(DyeColors).find((k) => DyeColors[k] === p.color) ?? 'white'
            return `{pattern:${p.pattern},color:${colorKey}}`
        }).join(',')}]]`

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

    return (
        <div>
            {/* Toolbar */}
            <div className="flex gap-2 mb-4">
                <Button onClick={randomizeBanner}>Randomize</Button>
                <Button variant="destructive" onClick={clearAll}>Clear All</Button>
            </div>

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

                    <CardContent className="relative px-0 mx-6">
                        <div className="max-h-170 min-h-100 overflow-y-auto space-y-3 overflow-x-hidden">
                            {/* Add popup */}
                            {editing?.type === 'add' && (
                                <div data-popup-container className="absolute mt-1 w-full">
                                    <PatternEditorPopup
                                        pattern=""
                                        color={addColor}
                                        onPatternSelect={commitAdd}
                                        onColorSelect={setAddColor}
                                        onPatternHover={(pat) => setPreview({index: patterns.length, pattern: {pattern: pat, color: addColor, visible: true}})}
                                        onLeave={() => setPreview(null)}
                                    />
                                </div>
                            )}

                            {/* Base layer */}
                            <div className="flex items-center gap-3 border rounded-md p-2" onClick={() => setEditing({type: 'base'})}>
                                <div className="w-10 aspect-1/2" style={{backgroundColor: baseColor}}/>
                                <Badge variant="secondary">Base</Badge>
                            </div>

                            {editing?.type === 'base' && (
                                <div data-popup-container className="absolute mt-1 w-full">
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
                                </div>
                            )}

                            {/* Pattern layers */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}     modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            >
                                <SortableContext items={patterns.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
                                    {patterns.map((p, i) => (
                                        <SortableLayer
                                            key={i}
                                            index={i}
                                            pattern={p}
                                            setPatterns={setPatterns}
                                            setEditing={setEditing}
                                            setPreview={setPreview}
                                            editing={editing}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
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

function SortableLayer({index, pattern, setPatterns, setEditing, setPreview, editing}: {
    index: number
    pattern: PatternWithVisible
    setPatterns: React.Dispatch<React.SetStateAction<PatternWithVisible[]>>
    setEditing: React.Dispatch<React.SetStateAction<EditTarget | null>>
    setPreview: React.Dispatch<React.SetStateAction<{ index: number; pattern: PatternWithVisible } | null>>
    editing: EditTarget | null
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: index.toString() })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transform ? 'transform 150ms ease-out' : undefined,
        zIndex: isDragging ? 50 : 'auto',
    }

    return (
        <div>
        <Card ref={setNodeRef} data-layer style={style} {...attributes} onClick={() => setEditing({type: 'pattern', index})} className="relative cursor-pointer p-0">
            <CardContent className="flex items-center gap-3 p-0">
                <div {...listeners} className="cursor-grab text-lg select-none px-2 py-2 bg-green-800">⋮⋮</div>
                <canvas
                    id={`layer-preview-${index}`}
                    className="w-15 aspect-1/2 border"
                    style={{imageRendering: 'pixelated'}}
                />
                <Badge variant="secondary" className="capitalize">{pattern.pattern}</Badge>

                <div className="flex gap-2 ml-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation()
                            setPatterns((p) => p.map((item, idx) => idx === index ? {...item, visible: !item.visible} : item))
                        }}
                    >
                        {pattern.visible ? (<Eye />) : (<EyeOff />)}
                    </Button>

                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            setPatterns((p) => p.filter((_, i) => i !== index))
                            setEditing(null)
                        }}
                    >
                        <X />
                    </Button>
                </div>

            </CardContent>
        </Card>
            {editing?.type === 'pattern' && editing.index === index && (
                <div data-popup-container className="absolute mt-1 w-full">
                    <PatternEditorPopup
                        pattern={pattern.pattern}
                        color={pattern.color}
                        onPatternSelect={(pat) => setPatterns(p => p.map((item, idx) => idx === index ? {...item, pattern: pat} : item))}
                        onColorSelect={(hex) => setPatterns(p => p.map((item, idx) => idx === index ? {...item, color: hex} : item))}
                        onPatternHover={(pat) => setPreview({index, pattern: {...pattern, pattern: pat}})}
                        onColorHover={(hex) => setPreview({index, pattern: {...pattern, color: hex}})}
                        onLeave={() => setPreview(null)}
                    />
                </div>
            )}
        </div>
    )
}
