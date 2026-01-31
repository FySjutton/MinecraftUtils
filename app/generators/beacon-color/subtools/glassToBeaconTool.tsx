"use client"

import React, { useMemo } from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, beaconColor, deltaE_lab_rgb, RGB } from "@/app/generators/beacon-color/helpers/colorCalculator"
import { ComboBox } from "@/components/ComboBox"
import Beacon3d, { SegmentTuple } from "@/app/generators/beacon-color/preview/Beacon3d"
import Image from "next/image"
import {BeaconPreview} from "@/app/generators/beacon-color/preview/BeaconBeam";
import {ColorPicker} from "@/components/ColorPicker";
import {Trash2} from "lucide-react";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";
import {useQueryState} from "nuqs";
import {enumArrayParser} from "@/lib/share/urlParsers";

const COLOR_NAMES = Object.keys(GLASS_COLORS)

function rgbToHex(rgb: RGB) {
    return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

export function toDisplayName(internal?: string) {
    if (!internal) return "White Stained Glass"
    return internal.replaceAll("_", " ")
        .split(" ")
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(" ")
}

export function toInternalName(display?: string) {
    if (!display) return "white_stained_glass"
    return display.replaceAll(" ", "_").toLowerCase()
}

const stackParser = enumArrayParser(COLOR_NAMES).withDefault([])

export default function GlassToBeaconColorEditor() {
    const initialValue = '#3263B7'

    const [stack, setStack] = useQueryState("layers", stackParser);
    const [targetHex, setTargetHex] = useQueryState("target", {defaultValue: initialValue});

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
        <div className="flex flex-col gap-3">
            <Card>
                <CardHeader>
                    <CardTitle>Glass Tester & Accuracy Calculator</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col">
                    <p className="font-medium">Target Color</p>
                    <p className="text-xs text-gray-400 mb-3">Enter the color that you want to compare your glass selection towards.</p>

                    <div className="flex w-full items-center">
                        <div className="mt-2">
                            <ColorPicker hex={targetHex} setHex={setTargetHex} initialValue={initialValue}/>
                            <div className="mt-2 h-16 w-full rounded-lg border" style={{ backgroundColor: targetHex }}/>
                        </div>

                        <BeaconPreview color={targetHex} className="ml-4"/>
                    </div>
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
                                    className="w-[260px] max-[420px]:w-[230px] max-[390px]:w-[170px]"
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

                                <Button variant="outline" size="sm" onClick={() => removeColor(idx)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={addColor}>Add Color</Button>
                            <Button onClick={() => setStack([])} variant="destructive" size="sm">Clear</Button>
                        </div>
                    </div>

                    <Separator className="mt-3"/>

                    {stack.length > 0 ? (<Beacon3d
                        key={previewSegments.map(([hex]) => hex).join('-')}
                        segments={previewSegments}
                        width={230}
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
                            <div className="text-xs text-muted-foreground">
                                {finalDist !== null && similarityPercent !== null
                                    ? `ΔE: ${finalDist.toFixed(2)}, Similarity: ${similarityPercent.toFixed(0)}%`
                                    : "No input"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <CopyShareLinkInput />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>How to Use</CardTitle>
                    <CardDescription className="mt-2 text-sm text-gray-300">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Select a target color using the color picker.</li>
                            <li>
                                Use the editor to design your own glass pillar, or enter a stack from another tool.
                            </li>
                            <li>
                                The tool will show the resulting beacon color and provide a similarity score compared to your target. You can see both the numeric Delta E (ΔE2000) and a percentage based on ΔE.
                            </li>
                        </ol>
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Accuracy</CardTitle>
                    <CardDescription className="mt-2 text-sm text-gray-300 space-y-2">
                        <p>
                            This tool uses <a href="https://en.wikipedia.org/wiki/Color_difference#CIEDE2000" target="_blank" className="underline">Delta E 2000 (ΔE2000)</a> to measure how close the beacon color is to your target. Lower ΔE values mean a closer match.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>ΔE = 0 indicates a perfect match.</li>
                            <li>The percentage shown is based on ΔE, giving a quick sense of similarity.</li>
                        </ul>
                        <p className="mt-2">
                            Unlike other tools, this one lets you experiment with colors and glass stacks directly. You can also paste stacks from other tools to see how they compare using our accuracy measures.
                        </p>
                        <p className="mt-2">
                            Overall, this tool provides a unique way to check and test beacon color combinations, giving a clear and precise measure of how close a stack is to your target.
                        </p>
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
