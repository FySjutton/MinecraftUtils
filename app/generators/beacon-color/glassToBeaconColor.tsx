"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, beaconColor, deltaE_lab_rgb, RGB } from "@/app/generators/beacon-color/colorCalculator"
import { ComboBox } from "@/components/ComboBox"
import Beacon3d, { SegmentTuple } from "@/app/generators/beacon-color/preview/Beacon3d"
import Image from "next/image"
import {
    ColorPicker,
    ColorPickerArea,
    ColorPickerContent,
    ColorPickerEyeDropper, ColorPickerFormatSelect, ColorPickerHueSlider, ColorPickerInput,
    ColorPickerSwatch,
    ColorPickerTrigger
} from "@/components/ui/color-picker";
import {turnToHex} from "@/lib/ColorsToHex";

const COLOR_NAMES = Object.keys(GLASS_COLORS)

function rgbToHex(rgb: RGB) {
    return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

function toDisplayName(internal?: string) {
    if (!internal) return "White Stained Glass"
    return internal.replaceAll("_", " ")
        .split(" ")
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(" ")
}

function toInternalName(display?: string) {
    if (!display) return "white_stained_glass"
    return display.replaceAll(" ", "_").toLowerCase()
}

export default function GlassToBeaconColorEditor() {
    const [stack, setStack] = useState<string[]>([])
    const [targetHex, setTargetHex] = useState('#00eb76')

    const handleColorPickerChange = (val: string) => {
        const hex = turnToHex(val)
        if (hex) setTargetHex(hex)
    }

    const targetRgb: RGB = useMemo(() => {
        const h = targetHex.startsWith('#') ? targetHex.slice(1) : targetHex
        return [
            parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16)
        ] as RGB
    }, [targetHex])

    const addColor = () => setStack(prev => [...prev, "white_stained_glass"])
    const updateColor = (index: number, value: string) => {
        setStack(prev => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }
    const removeColor = (index: number) => {
        setStack(prev => {
            const next = [...prev]
            next.splice(index, 1)
            return next
        })
    }

    const { previewSegments, mergedStackNumeric } = useMemo(() => {
        const validGlassNames = stack.filter(name => !!name && !!GLASS_COLORS[name])
        if (validGlassNames.length === 0) return { previewSegments: [] as SegmentTuple[], mergedStackNumeric: [] as RGB[] }

        const mergedStack: RGB[] = []
        for (let i = 0; i < validGlassNames.length; i++) {
            const subStack = validGlassNames.slice(0, i + 1).map(n => GLASS_COLORS[n])
            mergedStack.push(beaconColor(subStack))
        }

        const segments = mergedStack.map((mergedRgb, i) => [rgbToHex(mergedRgb), validGlassNames[i]] as SegmentTuple)
        return { previewSegments: segments, mergedStackNumeric: mergedStack }
    }, [stack])

    const finalMerged = mergedStackNumeric.length > 0 ? mergedStackNumeric[mergedStackNumeric.length - 1] : null
    const finalDist = finalMerged ? deltaE_lab_rgb(targetRgb, finalMerged) : null
    const similarityPercent = finalDist !== null ? Math.max(0, 100 - finalDist) : null

    return (
        <Card>
            <CardHeader>
                <CardTitle>Glass → Beacon Color Editor</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col">
                <p className="font-medium">Target Color</p>
                <p className="text-xs text-gray-400 mb-3">Enter the color that you want to compare your glass selection towards.</p>

                <ColorPicker
                    className="w-full mr-5"
                    defaultFormat="hex"
                    value={targetHex}
                    onValueChange={handleColorPickerChange}
                >
                    <ColorPickerTrigger asChild className="w-full px-5">
                        <ColorPickerSwatch className="flex place-items-center">
                            <p className="text-stroke-black select-none">
                                {targetHex.toUpperCase()}
                            </p>
                        </ColorPickerSwatch>
                    </ColorPickerTrigger>
                    <ColorPickerContent>
                        <ColorPickerArea />
                        <div className="flex items-center gap-2">
                            <ColorPickerEyeDropper />
                            <div className="flex flex-1 flex-col gap-2">
                                <ColorPickerHueSlider />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ColorPickerFormatSelect />
                            <ColorPickerInput withoutAlpha />
                        </div>
                    </ColorPickerContent>
                </ColorPicker>

                <Separator className="my-5" />

                {/* Editor column */}
                <div className="flex flex-col gap-2">
                    <p className="font-medium">Stack (bottom → top)</p>
                    <p className="text-xs text-gray-400">Enter a glass combination below to see how similar it is to the target color above.</p>

                    {stack.map((name, idx) => (
                        <div key={idx} className="w-full flex items-center gap-2 box-sizing">
                            {name && GLASS_COLORS[name] ? (
                                <Image src={`/assets/tool/beacon/glass/${name}.png`} alt={name} width={20} height={20} className="w-6 h-6 border" />
                            ) : (
                                <div className="w-6 h-6 border bg-white/10" />
                            )}

                            <ComboBox
                                items={COLOR_NAMES.map(toDisplayName)}
                                value={toDisplayName(name)}
                                onChange={(v) => updateColor(idx, toInternalName(v))}
                                placeholder="Select glass..."
                                width="220px"
                                placeholderSearch="Select glass..."
                                renderIcon={item => (
                                    <Image
                                        src={`/assets/tool/beacon/glass/${toInternalName(item)}.png`}
                                        alt={item}
                                        width={20}
                                        height={20}
                                        className="w-6 h-6 border"
                                    />
                                )}
                            />

                            <Button variant="outline" size="sm" onClick={() => removeColor(idx)}>Remove</Button>
                        </div>
                    ))}

                    <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={addColor}>Add Color</Button>
                        <Button onClick={() => setStack([])} variant="ghost" size="sm">Clear</Button>
                    </div>
                </div>

                <Separator className="mt-3"/>

                {stack.length > 0 ? (<Beacon3d
                    key={previewSegments.map(([hex]) => hex).join('-')}
                    segments={previewSegments}
                    width={250}
                    height={300}
                />) : <></>}

                <Separator />

                <div className="flex mt-4 gap-2">
                    {/* Color swatch */}
                    <div
                        className="w-8 rounded border flex-shrink-0"
                        style={{
                            backgroundColor: finalMerged ? rgbToHex(finalMerged) : '#000',
                            height: '100%',
                            minHeight: '40px',
                        }}
                    />

                    {/* Text block */}
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">Glass Stack Result</div>
                        {finalDist !== null && similarityPercent !== null && (
                            <div className="text-xs text-muted-foreground">
                                ΔE: {finalDist.toFixed(2)}, Similarity: {similarityPercent.toFixed(0)}%
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
