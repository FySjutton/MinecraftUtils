"use client"

import React, { useEffect, useMemo } from "react"
import { createLayerPreview, Pattern } from "@/app/generators/banners/TextureManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorPicker } from "@/app/generators/banners/editor/BannerGenerator"
import { Button } from "@/components/ui/button"
import { DyeColors } from "@/lib/Colors"
import {ArrowBigRight} from "lucide-react";

type StringRecord = Record<string, string>

export type Banner = {
    patterns: Pattern[]
    baseColor: string
}

export type UtilInput<T extends StringRecord, K extends keyof T> = {
    key: K
    label: string
    kind: "text" | "color"
    defaultValue: string
}

export type UtilBaseProps<T extends StringRecord> = {
    title: string
    inputs: UtilInput<T, keyof T>[]
    getResultsAction: (values: Record<keyof T, string>) => Record<string, Banner>
    livePreview: boolean
}

export default function UtilBase<T extends StringRecord>({title, inputs, getResultsAction, livePreview}: UtilBaseProps<T>) {
    const [values, setValues] = React.useState<Record<keyof T, string>>(() => {
        const initial = {} as Record<keyof T, string>
        for (const input of inputs) {
            initial[input.key] = input.defaultValue
        }
        return initial
    })

    const [manualResult, setManualResult] = React.useState<Record<string, Banner>>({})
    const [selected, setSelected] = React.useState<string>()
    
    const result = useMemo(() => {
        return livePreview ? getResultsAction(values) : manualResult
    }, [livePreview, values, manualResult, getResultsAction])

    function setValue(key: keyof T, value: string) {
        setValues(prev => ({
            ...prev,
            [key]: value,
        }))
    }

    useEffect(() => {
        for (const name of Object.keys(result)) {
            const banner = result[name]

            const mainCanvas = document.getElementById(`layer-preview-${name}`) as HTMLCanvasElement | null
            if (mainCanvas) createLayerPreview(mainCanvas, banner.patterns, "banner", { useBase: true, baseColor: banner.baseColor }).catch(() => {})
        }

        if (selected) {
            const banner = result[selected]

            const mainCanvas = document.getElementById(`layer-preview-final-${selected}`) as HTMLCanvasElement | null
            if (mainCanvas) createLayerPreview(mainCanvas, banner.patterns, "banner", { useBase: true, baseColor: banner.baseColor }).catch(() => {})

            const baseCanvas = document.getElementById(`layer-preview-${selected}-base`) as HTMLCanvasElement | null
            if (baseCanvas) createLayerPreview(baseCanvas, { pattern: "base", color: banner.baseColor }, "banner").catch(() => {})

            for (let i = 0; i < banner.patterns.length; i++) {
                const pattern = banner.patterns[i]
                const canvas = document.getElementById(`layer-preview-${selected}-${i}`) as HTMLCanvasElement | null
                if (canvas) createLayerPreview(canvas, pattern, "banner", { baseColor: pattern.color == DyeColors.black ? "#737373" : "#1e1e1e" }).catch(() => {})
            }
        }
    }, [result, selected])

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Configure the inputs below and press &#34;Generate&#34; to generate the banners.</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                        {inputs.map(input => (
                            <InputField
                                key={String(input.key)}
                                input={input}
                                value={values[input.key]}
                                setValue={setValue}
                            />
                        ))}
                    </div>

                    {!livePreview && (
                        <Button className="min-w-1/2 mx-auto" variant="outline" onClick={() => setManualResult(getResultsAction(values))}>
                            Generate
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Select a result</CardTitle>
                    <CardDescription>Select a result to get its crafting recipe and command output.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-2 max-h-100 overflow-y-auto">
                    {Object.keys(result).map((name, index) => (
                        <canvas
                            key={index}
                            id={`layer-preview-${name}`}
                            className="w-20 aspect-1/2 mr-2 border"
                            style={{imageRendering: 'pixelated'}}
                            onClick={() => setSelected(name)}
                        />
                    ))}
                </CardContent>
            </Card>

            {selected != undefined && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <StepCanvas
                                id={`layer-preview-${selected}-base`}
                                label="Step 1"
                            />

                            {result[selected].patterns.map((_, ind) => (
                                <StepCanvas
                                    key={ind}
                                    id={`layer-preview-${selected}-${ind}`}
                                    label={`Step ${ind + 2}`}
                                />
                            ))}

                            <ArrowBigRight className="min-w-8 mx-4" />

                            <StepCanvas
                                id={`layer-preview-final-${selected}`}
                                label="Finished"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function StepCanvas({ id, label }: { id: string; label: string }) {
    return (
        <div className="flex flex-col justify-center">
            <canvas
                id={id}
                className="w-20 aspect-1/2 border"
                style={{ imageRendering: "pixelated" }}
            />
            <div className="w-full mt-2 text-center rounded bg-amber-500">
                {label}
            </div>
        </div>
    )
}

function InputField<T extends StringRecord, K extends keyof T>({input, value, setValue}: {
    input: UtilInput<T, K>
    value: string
    setValue: (key: keyof T, value: string) => void
}) {
    return (
        <div className="flex flex-wrap justify-center">
            <label className="w-full text-center mb-2 font-bold">{input.label}</label>

            {input.kind === "text" && (
                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(input.key, e.target.value)}
                />
            )}

            {input.kind === "color" && (
                <ColorPicker selected={value} onSelectAction={value => {setValue(input.key, value)}}/>
            )}
        </div>
    )
}
