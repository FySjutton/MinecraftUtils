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
import { DyeColors } from '@/lib/Colors'

import { createLayerPreview } from '@/app/generators/banners/utils/TextureManager'

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent, TouchSensor
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import {restrictToParentElement, restrictToVerticalAxis} from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {Eye, EyeOff, GripVertical, X} from "lucide-react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {InputField} from "@/components/inputs/InputField";
import {generateCommand, Mode, Pattern, patternList} from "@/app/generators/banners/utils/Utils";
import {arrayObjectParser, enumParser, useUrlUpdateEmitter} from "@/lib/urlParsers";
import {useQueryState} from "nuqs";
import {CopyShareLinkInput} from "@/components/inputs/CopyShareLinkInput";
import DyePicker from "@/components/inputs/DyePicker";

type EditTarget =
    | { type: 'base'; anchor: HTMLElement }
    | { type: 'pattern'; index: number; anchor: HTMLElement }
    | { type: 'add' }
    | null

interface PatternWithVisible extends Pattern {
    visible: boolean
}

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

const modeParser = enumParser(["banner", "shield"]).withDefault("banner");
const colorParser = enumParser(Object.values(DyeColors)).withDefault(DyeColors.white);
const patternsParser = arrayObjectParser<PatternWithVisible>({
    pattern: Object.keys(patternList),
    color: Object.values(DyeColors),
    visible: {type: "bool", default: true}
}).withDefault([]);

export default function BannerGenerator() {
    useUrlUpdateEmitter()
    const [mode, setMode] = useQueryState("m", modeParser);
    const [baseColor, setBaseColor] = useQueryState("b", colorParser);
    const [patterns, setPatterns] = useQueryState("p", patternsParser);
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
        if (layersScrollRef.current != null) {
            layersScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const commitAdd = (pattern: string) => {
        setPatterns((p) => [...p, {pattern, color: addColor, visible: true}])
        setTimeout(() => setEditing(null), 0)
        setPreview(null)
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

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
        createLayerPreview(canvas, { pattern: "base", color: DyeColors[bannerColor] }, mode, { baseColor: "#1e1e1e" }).catch(() => {})
    }, [bannerColor, mode, patterns])

    const layersScrollRef = React.useRef<HTMLDivElement>(null)
    const popupRef = React.useRef<HTMLDivElement | null>(null)

    // auto scroll so the popup is visible
    useEffect(() => {
        if (!popupRef.current || !layersScrollRef.current || !editing || !('anchor' in editing)) return

        const bottom = popupRef.current.offsetTop + popupRef.current.offsetHeight
        let t = layersScrollRef.current.scrollTop

        if (popupRef.current.offsetHeight <= layersScrollRef.current.clientHeight) {
            if (bottom - editing.anchor.offsetTop <= layersScrollRef.current.clientHeight) {
                if (editing.anchor.offsetTop < t) t = editing.anchor.offsetTop
                else if (bottom > t + layersScrollRef.current.clientHeight) t = bottom - layersScrollRef.current.clientHeight
            } else {
                t = bottom - layersScrollRef.current.clientHeight
            }
        } else {
            t = popupRef.current.offsetTop
        }

        t = Math.max(0, Math.min(t, layersScrollRef.current.scrollHeight - layersScrollRef.current.clientHeight))

        if (t !== layersScrollRef.current.scrollTop) {
            layersScrollRef.current.scrollTo({ top: t, behavior: 'smooth' })
        }
    }, [editing])

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

                    <CardContent className="px-0 mx-6">
                        <div ref={layersScrollRef} className="relative max-h-170 min-h-100 overflow-y-auto space-y-3 overflow-x-hidden pr-2">
                            {/* Add popup */}
                            {editing?.type === 'add' && (
                                <div data-popup-container className="mt-1 w-full z-1">
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium mt-2">Color</p>
                                            <DyePicker selected={[addColor]} onSelectAction={setAddColor} onLeaveAction={() => setPreview(null)} />
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
                            <Card className="relative cursor-pointer p-0 overflow-hidden" data-base-button onClick={(e) => {setEditing({ type: 'base', anchor: e.currentTarget })}}>
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
                                <div ref={popupRef} data-popup-container className="mt-1 w-full z-1">
                                    <Card>
                                        <CardContent>
                                            <p className="mb-1 text-sm font-medium">Color</p>
                                            <DyePicker
                                                selected={[baseColor]}
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
                                                <div ref={popupRef} data-popup-container className="mt-1 w-full z-70">
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
                                                            <DyePicker
                                                                selected={[pattern.color]}
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
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Permanent Share Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <CopyShareLinkInput label=""/>
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
        <Card ref={setNodeRef} data-layer style={style} onClick={(e) => {
            setEditing({
                type: 'pattern',
                index,
                anchor: e.currentTarget,
            })
        }} className={`relative cursor-pointer p-0 overflow-hidden ${index > 5 ? "border-2 border-red-400 border-l-0" : ""}`}>
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
                            <div {...listeners} {...attributes} className="cursor-grab text-lg select-none px-2 flex items-center my-auto py-3" style={{ touchAction: 'none'}} onDragStart={(e) => e.preventDefault()}><GripVertical /></div>

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
