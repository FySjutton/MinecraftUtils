"use client"
import React, {useEffect} from "react"
import {createLayerPreview, Pattern} from "@/app/generators/banners/TextureManager";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ColorPicker} from "@/app/generators/banners/editor/BannerGenerator";
import {Button} from "@/components/ui/button";
import {DyeColors} from "@/lib/Colors";

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
}

export default function UtilBase<T extends StringRecord>({title, inputs, getResultsAction}: UtilBaseProps<T>) {
    const [values, setValues] = React.useState<Record<keyof T, string>>(() => {
        const initial = {} as Record<keyof T, string>
        for (const input of inputs) {
            initial[input.key] = input.defaultValue
        }
        return initial
    })

    const [result, setResult] = React.useState<Record<string, Banner>>({})

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

            const baseCanvas = document.getElementById(`layer-preview-${name}-base`) as HTMLCanvasElement | null
            if (baseCanvas) createLayerPreview(baseCanvas, { pattern: "base", color: banner.baseColor }, "banner").catch(() => {})

            banner.patterns.forEach((pattern, i) => {
                const canvas = document.getElementById(`layer-preview-${name}-${i}`) as HTMLCanvasElement | null
                if (canvas) createLayerPreview(canvas, pattern, "banner", { baseColor: pattern.color == DyeColors.black ? "#737373" : "#1e1e1e" }).catch(() => {})
            })
        }
    }, [result])

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
                    <Button className="min-w-1/2 mx-auto" variant="outline" onClick={() => setResult(getResultsAction(values))}>
                        Generate
                    </Button>
                </CardContent>
            </Card>

            {Object.keys(result).map((name, index) => (
                <Card key={index} className="mt-4">
                    <CardContent className="flex gap-2">
                        <canvas
                            id={`layer-preview-${name}`}
                            className="w-20 aspect-1/2 mr-2 border"
                            style={{imageRendering: 'pixelated'}}
                        />
                        <canvas
                            id={`layer-preview-${name}-base`}
                            className="w-20 aspect-1/2 mr-2 border"
                            style={{imageRendering: 'pixelated'}}
                        />
                        {result[name].patterns.map((_pattern, ind) => (
                            <div key={ind}>
                                <canvas
                                    id={`layer-preview-${name}-${ind}`}
                                    className="w-20 aspect-1/2 mr-2 border"
                                    style={{imageRendering: 'pixelated'}}
                                />
                            </div>
                        ))}

                    </CardContent>
                </Card>
            ))}
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
