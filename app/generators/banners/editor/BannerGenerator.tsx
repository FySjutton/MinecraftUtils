'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Banner3D from '@/app/generators/banners/editor/preview/Banner3d'
import Shield3D from '@/app/generators/banners/editor/preview/Shield3d'

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

import { createLayerPreview } from '@/app/generators/banners/utils/TextureManager'

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
import {Eye, EyeOff, GripVertical, X} from "lucide-react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {InputField} from "@/components/InputField";
import {generateCommand, Mode, Pattern, patternList} from "@/app/generators/banners/utils/Utils";

type EditTarget =
    | { type: 'base' }
    | { type: 'pattern'; index: number }
    | { type: 'add' }
    | null

interface PatternWithVisible extends Pattern {
    visible: boolean
}

export const ColorPicker = ({selected, onSelectAction, onHoverAction, onLeaveAction}: { selected: string, onSelectAction: (hex: string) => void, onHoverAction?: (hex: string) => void, onLeaveAction?: () => void }) => (
    <div className="flex flex-wrap gap-2">
        {Object.keys(DyeColors).map((colorKey) => {
            const hex = DyeColors[colorKey]
            return (
                <button
                    key={hex}
                    className={`w-16 rounded-md border p-2 hover:ring-2 ${hex === selected ? 'ring-2 ring-offset-1' : ''}`}
                    style={{ backgroundColor: hex }}
                    onMouseEnter={() => onHoverAction?.(hex)}
                    onMouseLeave={() => onLeaveAction?.()}
                    onClick={() => onSelectAction(hex)}
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

const CanvasPreview = ({pattern, mode, color, width = 20, height = 40 }: { pattern: string, mode: Mode, color: string, width?: number, height?: number }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current) return
        createLayerPreview(canvasRef.current, { pattern, color }, mode, { baseColor: color == DyeColors.black ? "#a6a6a6" : "#1e1e1e" }).catch(() => {})
    }, [pattern, color, mode])

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

const PatternEditorPopup = ({pattern, mode, color, onPatternSelect, onPatternHover, onLeave}: {
    pattern: string
    mode: Mode
    color: string
    onPatternSelect: (pat: string) => void
    onPatternHover: (pat: string) => void
    onLeave: () => void
}) => {
    return (
        <>
            <p className="mb-1 text-sm font-medium">Pattern</p>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-scroll p-2">
                {Object.keys(patternList).map((pat) => (
                    <button
                        key={pat}
                        className={`rounded hover:ring-2 ${pat === pattern ? 'ring-4 ring-gray-400' : ''}`}
                        onMouseEnter={() => onPatternHover(pat)}
                        onMouseLeave={onLeave}
                        onClick={() => onPatternSelect(pat)}
                    >
                        <CanvasPreview pattern={pat} color={color} mode={mode}/>
                    </button>
                ))}
            </div>
        </>
    )
}

export default function BannerGenerator() {
    const [mode, setMode] = useState<Mode>("banner")

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
            const pat = Object.keys(patternList)[Math.floor(Math.random() * Object.keys(patternList).length)]
            const color = Object.values(DyeColors)[Math.floor(Math.random() * Object.values(DyeColors).length)]
            return { pattern: pat, color, visible: true }
        })
        setPatterns(newPatterns)
    }

    const clearAll = () => {
        setPatterns([]);
        setBaseColor(DyeColors.white)
        setPreview(null);
    }

    const bannerColor = Object.keys(DyeColors).find((k) => DyeColors[k] === baseColor) ?? 'white'

    const command = generateCommand(mode, patterns.filter(item => item.visible), bannerColor)

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
        patterns.forEach((pattern, index) => {
            const canvas = document.getElementById(`layer-preview-${index}`) as HTMLCanvasElement | null
            if (!canvas) return
            createLayerPreview(canvas, pattern, mode, { baseColor: pattern.color == DyeColors.black ? "#7e7e7e" : "#1e1e1e" }).catch(() => {})
        })
        const canvas = document.getElementById(`layer-preview-base`) as HTMLCanvasElement | null
        if (!canvas) return
        createLayerPreview(canvas, { pattern: "base", color: bannerColor }, mode, { baseColor: "#1e1e1e" }).catch(() => {})

    }, [bannerColor, mode, patterns])

    return (
        <div>
            {/* Toolbar */}
            <Card>
                <CardContent className="flex flex-wrap gap-2">
                    <Tabs value={mode} onValueChange={v => setMode(v == 'banner' ? v : 'shield')} className="mr-auto">
                        <TabsList>
                            <TabsTrigger value="banner">Banner</TabsTrigger>
                            <TabsTrigger value="shield">Shield</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={randomizeBanner}>Randomize</Button>
                    <Button variant="destructive" onClick={clearAll}>Clear All</Button>
                </CardContent>
            </Card>

            <div className="flex gap-4 mt-4 max-[1100]:flex-wrap">
                <Card className="w-1/2 max-w-150 max-[1100]:w-full max-[1100]:max-w-none max-[1100]:min-h-150">
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="w-full h-full">
                        <div style={{ width: '100%', height: '100%' }}>
                            {mode == "banner" ? (
                                <Banner3D
                                    baseColor={hoveredBaseColor ?? baseColor}
                                    patterns={effectivePatterns}
                                />
                            ) : (
                                <Shield3D
                                    baseColor={hoveredBaseColor ?? baseColor}
                                    patterns={effectivePatterns}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>Layers</CardTitle>
                        <Button size="sm" data-add-button variant="outline" onClick={startAdd}>Add Layer</Button>
                    </CardHeader>

                    <CardContent className="relative px-0 mx-6">
                        <div className="max-h-170 min-h-100 overflow-y-auto space-y-3 overflow-x-hidden pr-2">
                            {/* Add popup */}
                            {editing?.type === 'add' && (
                                <div data-popup-container className="absolute mt-1 w-full z-1">
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium mt-2">Color</p>
                                            <ColorPicker selected={addColor} onSelectAction={setAddColor} onLeaveAction={() => setPreview(null)} />
                                            <div className="my-4"></div>
                                            <PatternEditorPopup
                                                pattern=""
                                                mode={mode}
                                                color={addColor}
                                                onPatternSelect={commitAdd}
                                                onPatternHover={(pat) => setPreview({index: patterns.length, pattern: {pattern: pat, color: addColor, visible: true}})}
                                                onLeave={() => setPreview(null)}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Base layer */}
                            <Card className="relative cursor-pointer p-0 overflow-hidden" onClick={() => setEditing({type: 'base'})}>
                                <CardContent className="flex gap-3 p-0 flex-wrap items-stretch">
                                    <div style={{ backgroundColor: baseColor}} className="w-2 rounded"></div>
                                    <canvas
                                        id={`layer-preview-base`}
                                        className="w-20 aspect-1/2 mr-2"
                                        style={{imageRendering: 'pixelated'}}
                                    />
                                    <Badge variant="secondary" className="my-auto">Banner</Badge>
                                </CardContent>
                            </Card>

                            {editing?.type === 'base' && (
                                <div data-popup-container className="absolute mt-1 w-full z-1">
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium">Color</p>
                                            <ColorPicker
                                                selected={baseColor}
                                                onSelectAction={setBaseColor}
                                                onHoverAction={(hex) => setHoveredBaseColor(hex)}
                                                onLeaveAction={() => setHoveredBaseColor(null)}
                                            />
                                            <div className="w-full text-right mt-2">
                                                <Button size="sm" onClick={() => setEditing(null)}>Close</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Pattern layers */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragStart={() => {
                                setEditing(null)
                                setPreview(null)
                            }}>
                                <SortableContext items={patterns.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
                                    {patterns.map((pattern, index) => (
                                        <React.Fragment key={index}>
                                            <SortableLayer
                                                index={index}
                                                pattern={pattern}
                                                setPatterns={setPatterns}
                                                setEditing={setEditing}
                                            />
                                            {editing?.type === 'pattern' && editing.index === index && (
                                                <div data-popup-container className="absolute mt-1 w-full z-70">
                                                    <Card>
                                                        <CardContent>
                                                            <PatternEditorPopup
                                                                pattern={pattern.pattern}
                                                                mode={mode}
                                                                color={pattern.color}
                                                                onPatternSelect={(pat) => setPatterns(p => p.map((item, idx) => idx === index ? {...item, pattern: pat} : item))}
                                                                onPatternHover={(pat) => setPreview({index, pattern: {...pattern, pattern: pat}})}
                                                                onLeave={() => setPreview(null)}
                                                            />
                                                            <p className="mb-1 text-sm font-medium mt-2">Color</p>
                                                            <ColorPicker
                                                                selected={pattern.color}
                                                                onSelectAction={(hex) => setPatterns(p => p.map((item, idx) => idx === index ? {...item, color: hex} : item))}
                                                                onLeaveAction={() => setPreview(null)}
                                                            />
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}
                                        </React.Fragment>
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
                    <InputField
                        showCopy
                        value={command}
                        readOnly
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function SortableLayer({index, pattern, setPatterns, setEditing}: {
    index: number
    pattern: PatternWithVisible
    setPatterns: React.Dispatch<React.SetStateAction<PatternWithVisible[]>>
    setEditing: React.Dispatch<React.SetStateAction<EditTarget | null>>
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: index.toString() })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transform ? 'transform 150ms ease-out' : undefined,
        zIndex: isDragging ? 50 : 'auto',
    }

    return (
        <Card ref={setNodeRef} data-layer style={style} {...attributes} onClick={() => setEditing({type: 'pattern', index})} className={`relative cursor-pointer p-0 overflow-hidden ${index > 5 ? "border-2 border-red-400 border-l-0" : ""}`}>
            <CardContent className="flex gap-3 p-0 items-stretch">
                <div style={{ backgroundColor: pattern.color}} className="w-2 rounded"></div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation()
                        setPatterns((p) => p.map((item, idx) => idx === index ? {...item, visible: !item.visible} : item))
                    }}
                    className="my-auto w-2"
                >
                    {pattern.visible ? (<Eye />) : (<EyeOff />)}
                </Button>
                <div className="flex w-full flex-wrap justify-center max-[430]:flex-col max-[430]:content-center">
                    <canvas
                        id={`layer-preview-${index}`}
                        className="w-20 aspect-1/2 mr-2"
                        style={{imageRendering: 'pixelated'}}
                    />
                    <div className="flex flex-1 content-center max-[430]:flex-col max-[430]:mt-2">
                        <Badge variant="secondary" className="my-auto">{patternList[pattern.pattern]}</Badge>

                        <div className="flex gap-2 items-center ml-auto mr-6 max-[430]:mx-auto">
                            <div {...listeners} className="cursor-grab text-lg select-none px-2 flex items-center my-auto py-3"><GripVertical /></div>

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
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
