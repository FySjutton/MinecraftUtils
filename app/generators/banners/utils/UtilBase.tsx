"use client"

import React, {useEffect, useMemo, useState} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {DyeColors} from "@/lib/Colors"
import {ArrowBigRight} from "lucide-react";
import {Banner, generateCommand, Mode} from "@/app/generators/banners/utils/Utils";
import {createLayerPreview} from "@/app/generators/banners/utils/TextureManager";
import {InputField} from "@/components/InputField";
import UtilSelector from "@/app/generators/banners/UtilSelector";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useQueryState} from "nuqs";
import {
    enumParser,
    objectParser, useUrlUpdateEmitter,
} from "@/lib/urlParsers";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";
import DyePicker from "@/components/DyePicker";

type StringRecord = Record<string, string>

export type UtilInput = {
    key: string
    label: string
    kind: "text" | "color"
    defaultValue: string
}

export type UtilBaseProps = {
    title: string
    inputs: UtilInput[]
    getResultsAction: (values: Record<string, string>) => Record<string, Banner>
    livePreview: boolean
}

const modeParser = enumParser(["banner", "shield"]).withDefault("banner")

export default function UtilBase<T extends StringRecord>({title, inputs, getResultsAction, livePreview}: UtilBaseProps) {
    useUrlUpdateEmitter()
    const [mode, setMode] = useQueryState<Mode>("mode", modeParser)

    const schema = useMemo(() => Object.fromEntries(
        inputs.map(i => i.kind === "color" ? [i.key, Object.values(DyeColors)] : [i.key, "string"])
    ), [inputs]);

    const defaultValues = useMemo(() => Object.fromEntries(
        inputs.map(i => [i.key, i.defaultValue])
    ), [inputs]);

    const parser = useMemo(() => objectParser<Record<string, string>>(schema).withDefault(defaultValues), [schema, defaultValues]);

    const [values, setValues] = useQueryState("v", parser);

    const [manualResult, setManualResult] = useState<Record<string, Banner>>({})
    const [selected, setSelected] = useQueryState("selected")

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
            if (mainCanvas) createLayerPreview(mainCanvas, banner.patterns, mode, { useBase: true, baseColor: banner.baseColor }).catch(() => {})
        }

        if (selected) {
            const banner = result[selected]

            const mainCanvas = document.getElementById(`layer-preview-final-${selected}`) as HTMLCanvasElement | null
            if (mainCanvas) createLayerPreview(mainCanvas, banner.patterns, mode, { useBase: true, baseColor: banner.baseColor }).catch(() => {})

            const baseCanvas = document.getElementById(`layer-preview-${selected}-base`) as HTMLCanvasElement | null
            if (baseCanvas) createLayerPreview(baseCanvas, { pattern: "base", color: banner.baseColor }, mode).catch(() => {})

            for (let i = 0; i < banner.patterns.length; i++) {
                const pattern = banner.patterns[i]
                const canvas = document.getElementById(`layer-preview-${selected}-${i}`) as HTMLCanvasElement | null
                if (canvas) createLayerPreview(canvas, pattern, mode, { baseColor: pattern.color == DyeColors.black ? "#737373" : "#1e1e1e" }).catch(() => {})
            }
        }
    }, [mode, result, selected])
    
    const command = useMemo(() => {
        if (selected) {
            return generateCommand(mode, result[selected].patterns, result[selected].baseColor)
        }
        return ""
    }, [mode, result, selected])

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Configure the inputs below and click on a result for more information like the crafting recipe, and its /give command.</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    <Tabs value={mode} onValueChange={v => setMode(v == 'banner' ? v : 'shield')} className="mx-auto">
                        <TabsList>
                            <TabsTrigger value="banner">Banner</TabsTrigger>
                            <TabsTrigger value="shield">Shield</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {inputs.map(input => (
                        <BannerInput
                            key={String(input.key)}
                            input={input}
                            value={values[input.key]}
                            setValue={setValue}
                        />
                    ))}

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
                <CardContent className="flex flex-wrap justify-center gap-2 max-h-100 overflow-y-auto py-2">
                    {Object.keys(result).map((name, index) => (
                        <div key={index} className="flex flex-col justify-center">
                            <div className="w-full mt-2 text-center rounded bg-blue-400">
                                {name}
                            </div>
                            <canvas
                                id={`layer-preview-${name}`}
                                className="w-20 aspect-1/2 mt-1 cursor-pointer hover:ring-1"
                                style={{imageRendering: 'pixelated'}}
                                onClick={() => setSelected(name)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {selected != undefined && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>{`${selected} | Crafting Recipe`}</CardTitle>
                        <CardDescription>Copy the command below, or use the crafting recipe in a loom to get the banner.</CardDescription>
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
                        <label className="mt-2 font-bold">Command</label>
                        <InputField
                            showCopy
                            value={command}
                            readOnly
                        />
                        <CopyShareLinkInput className="mt-4" />
                    </CardContent>
                </Card>
            )}

            <h2 className="text-2xl font-bold mb-2 mx-auto text-center mt-8">Other Banner Utilities</h2>
            <p className="px-5 mx-auto w-full text-center">Other banner generators and utilities, like the editor, and more.</p>
            <div className="w-full flex justify-center mt-4">
                <UtilSelector ignore={title}/>
            </div>
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

function BannerInput<T extends StringRecord>({input, value, setValue}: {
    input: UtilInput
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
                <DyePicker selected={[value]} onSelectAction={value => {setValue(input.key, value)}} />
            )}
        </div>
    )
}
