"use client"

import React, { useMemo, useState, useRef } from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, RGB, beaconColor, deltaE_lab_rgb, hexToRgb } from '@/app/generators/beacon-color/helpers/colorCalculator'
import {
    ColorPicker,
    ColorPickerArea,
    ColorPickerContent,
    ColorPickerEyeDropper,
    ColorPickerFormatSelect,
    ColorPickerHueSlider,
    ColorPickerInput,
    ColorPickerSwatch,
    ColorPickerTrigger
} from "@/components/ui/color-picker"
import { turnToHex } from "@/lib/ColorsToHex"
import { ComboBox } from "@/components/ComboBox"
import { BeaconPreview } from "@/app/generators/beacon-color/preview/BeaconBeam"
import {ResultCard} from "@/app/generators/beacon-color/ResultCard";
import {StepSlider} from "@/components/Slider";
import {MultiSelectDropdown} from "@/components/MultiSelectDropdown";
import Image from "next/image";
import {toDisplayName, toInternalName} from "@/app/generators/beacon-color/subtools/glassToBeaconTool";

const COLOR_ENTRIES = Object.entries(GLASS_COLORS)

export function rgbToHex(rgb: RGB) {
    return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

const presets = [
    { name: 'Very Low', beamWidth: 500 },
    { name: 'Low', beamWidth: 1000 },
    { name: 'Normal', beamWidth: 2000 },
    { name: 'High', beamWidth: 4000 },
    { name: 'Very High', beamWidth: 10000 },
    { name: 'Absolute', beamWidth: null },
]
const presentTypes = presets.map(i => i.name)

export interface Candidate {
    stack: RGB[]
    mergedStackColors?: RGB[]
    color: RGB
    dist: number
}

export function findColorName(rgb: RGB): string {
    const found = COLOR_ENTRIES.find(([_, v]) =>
        v[0] === rgb[0] && v[1] === rgb[1] && v[2] === rgb[2]
    )
    return found?.[0] ?? "Unknown"
}

export default function BeaconToGlassTool({ setTabAction }: { setTabAction: (tab: 'tool' | 'verify') => void }) {
    const [hex, setHex] = useState('#00eb76')
    const [preset, setPreset] = useState(presets[2].name)
    const [results, setResults] = useState<Candidate[]>([])
    const [colorsChecked, setColorsChecked] = useState(0)
    const [percentFinished, setPercentFinished] = useState(0)
    const [status, setStatus] = useState<string | null>(null)
    const [overrides, setOverrides] = useState<Record<number, boolean>>({})

    const [maxHeight, setMaxHeight] = React.useState(6)
    const [glassColors, setGlassColors] = React.useState(Object.keys(GLASS_COLORS))
    const filteredColors = useMemo(() => {
        return COLOR_ENTRIES.filter(([name]) =>
            glassColors.includes(name)
        )
    }, [glassColors])

    const workerRef = useRef<Worker | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const target = useMemo(() => hexToRgb(hex), [hex])
    const currentPreset = useMemo(() => presets.find(p => p.name === preset), [preset])

    const [searchStartTime, setSearchStartTime] = useState<number | null>(null)
    const [searchEndTime, setSearchEndTime] = useState<number | null>(null)

    const handleColorPickerChange = (val: string) => {
        const hex = turnToHex(val)
        if (hex) setHex(hex)
    }

    const runBeamSearch = async (beamWidth: number) => {
        setStatus(`Running beam search (width=${beamWidth})`)
        let checked = 0
        const bestPerLength: Record<number, Candidate | null> = {}
        let beam: Candidate[] = [{
            stack: [],
            mergedStackColors: [],
            color: [0, 0, 0],
            dist: deltaE_lab_rgb(target, [0, 0, 0])
        }]

        for (let depth = 1; depth <= maxHeight; depth++) {
            const expanded: Candidate[] = []
            for (const cand of beam) {
                for (const [, rgb] of filteredColors) {
                    const newStack = [...cand.stack, rgb]
                    const newMergedStack: RGB[] = cand.mergedStackColors ? [...cand.mergedStackColors] : []
                    const lastMerged = newMergedStack.length > 0 ? newMergedStack[newMergedStack.length - 1] : null
                    const nextMerged = lastMerged ? beaconColor([lastMerged, rgb]) : rgb
                    newMergedStack.push(nextMerged)
                    const color = beaconColor(newStack)
                    const dist = deltaE_lab_rgb(target, color)
                    expanded.push({ stack: newStack, mergedStackColors: newMergedStack, color, dist })
                    checked++
                }
            }
            expanded.sort((a, b) => a.dist - b.dist)
            beam = expanded.slice(0, beamWidth)
            for (const cand of beam) {
                const len = cand.stack.length
                const existing = bestPerLength[len]
                if (!existing || cand.dist < existing.dist) bestPerLength[len] = { ...cand }
            }
            await new Promise(r => setTimeout(r, 0))
            setColorsChecked(checked)
        }

        setStatus(null)
        return { bestPerLength, checked }
    }

    const runExhaustive = () => {
        if (workerRef.current) workerRef.current.terminate()
        setStatus('Running exhaustive search')
        setIsLoading(true)
        setSearchStartTime(Date.now())
        setSearchEndTime(null)
        setPercentFinished(0)
        const worker = new Worker(new URL('../helpers/beaconWorker.ts', import.meta.url), { type: 'module' })
        workerRef.current = worker
        worker.postMessage({ cmd: 'exhaustive', maxHeight: maxHeight, targetHex: hex })
        const bestPerLength: Record<number, Candidate | null> = {}

        worker.onmessage = (ev: MessageEvent) => {
            const data = ev.data
            if (data.type === 'progress') {
                setColorsChecked(data.checked)
                setPercentFinished(data.checked / ((Math.pow(glassColors.length, maxHeight + 1) - 1) / (glassColors.length - 1)))
            }
            else if (data.type === 'lengthResult') {
                const best = data.best as Candidate
                if (best) {
                    const mergedStack: RGB[] = []
                    for (let i = 0; i < best.stack.length; i++) mergedStack.push(beaconColor(best.stack.slice(0, i + 1)))
                    best.mergedStackColors = mergedStack
                    bestPerLength[data.length] = best
                } else bestPerLength[data.length] = null
            } else if (data.type === 'done') {
                const resultsArr: Candidate[] = []
                let bestDistSoFar = Infinity
                for (let len = 1; len <= maxHeight; len++) {
                    const cand = bestPerLength[len]
                    if (cand && cand.dist < bestDistSoFar) {
                        resultsArr.push({ ...cand })
                        bestDistSoFar = cand.dist
                    }
                }
                setResults(resultsArr)
                setColorsChecked(data.checked)
                setSearchEndTime(Date.now())
                setIsLoading(false)
                setPercentFinished(1)
                setStatus(`Search finished`)
                worker.terminate()
                workerRef.current = null
            }
        }
    }

    const findBest = async () => {
        if (!currentPreset) return
        setResults([])
        setColorsChecked(0)
        if (currentPreset.beamWidth === null) {
            runExhaustive()
            return
        }

        setStatus('Running beam search')
        setIsLoading(true)
        setSearchStartTime(Date.now())
        setPercentFinished(0)
        setSearchEndTime(null)
        const { bestPerLength, checked } = await runBeamSearch(currentPreset.beamWidth)
        const resultsArr: Candidate[] = []
        let bestDistSoFar = Infinity

        for (let len = 1; len <= maxHeight; len++) {
            const cand = bestPerLength[len]
            if (cand && cand.dist < bestDistSoFar) {
                resultsArr.push({ ...cand })
                bestDistSoFar = cand.dist
            }
        }

        setResults(resultsArr)
        setColorsChecked(checked)
        setSearchEndTime(Date.now())
        setIsLoading(false)
        setStatus(`Search finished`)
    }

    const cancelWorker = () => {
        if (workerRef.current) {
            workerRef.current.terminate()
            workerRef.current = null
            setStatus('Search cancelled')
            setIsLoading(false)
        }
    }

    const durationMs =
        searchStartTime && searchEndTime
            ? searchEndTime - searchStartTime
            : null

    return (
        <div className="flex flex-col gap-3">
            <Card>
                <CardHeader>
                    <CardTitle>Beacon Beam Color Generator</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    {/* Target color picker */}
                    <div>
                        <p className="font-medium">Target Color:</p>
                        <p className="text-xs text-gray-400">Select the color that you want the beacon to be.</p>
                        <div className="flex w-full items-center">
                            <ColorPicker
                                className="w-full mr-5"
                                defaultFormat="hex"
                                value={hex}
                                onValueChange={handleColorPickerChange}
                            >
                                <ColorPickerTrigger asChild className="w-full px-5">
                                    <ColorPickerSwatch className="flex place-items-center">
                                        <p className="text-stroke-black select-none">
                                            {hex.toUpperCase()}
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
                            <BeaconPreview color={hex} />
                        </div>
                    </div>

                    <Separator />

                    {/* Presets */}
                    <div>
                        <p className="font-medium">Search Preset:</p>
                        <p className="text-xs text-gray-400 mb-2">
                            A measurement of speed compared to accuracy.
                        </p>
                        <ComboBox
                            items={presentTypes}
                            value={preset}
                            onChange={setPreset}
                            placeholder="Select present"
                            placeholderSearch="Search present..."
                            width="300px"
                            renderItem={item => (
                                <p className={`text-xs ${item === "Absolute" ? "text-red-400" : "text-gray-400"}`}>
                                    {item === "Absolute"
                                        ? "Check all combinations"
                                        : `Beam width: ${presets.find(v => v.name === item)?.beamWidth}`}
                                </p>
                            )}
                        />
                    </div>

                    <div>
                        <p className="font-medium">Max glass height:</p>
                        <p className="text-xs text-gray-400 mb-2">
                            Higher numbers gives better results in <span className="underline">some</span> cases, but <span className="underline">MUCH</span> worse performance!
                        </p>
                        <div className="w-[300px]">
                            <StepSlider min={1} value={maxHeight} onValueChange={setMaxHeight} disabled={isLoading}/>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium">Glass Filtering:</p>
                        <p className="text-xs text-gray-400 mb-2">
                            Choose which glass types the calculator is allowed to use. All enabled by default. Useful for superflat etc.
                        </p>
                        <MultiSelectDropdown
                            width={"300px"}
                            items={Object.keys(GLASS_COLORS).map(value => toDisplayName(value))}
                            selected={glassColors.map(value => toDisplayName(value))} onChange={values => setGlassColors(values.map(value => toInternalName(value)))}
                            renderIcon={item => {
                                return <Image
                                    src={`/assets/tool/beacon/glass/${toInternalName(item)}.png`}
                                    alt={item}
                                    width={20}
                                    height={20}
                                    className="w-6 h-6 border"
                                />
                            }
                        }></MultiSelectDropdown>
                    </div>

                    <Separator />

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <Button variant="outline" disabled={isLoading} onClick={findBest}>Calculate</Button>
                        {isLoading && (<Button variant="destructive" onClick={cancelWorker}>Cancel</Button>)}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex text-xs text-muted-foreground">
                            Colors checked: {colorsChecked}{percentFinished != 0 && (
                                <p className="text-white">{`‎ - ${Math.round(percentFinished * 100 * 100) / 100}%`}</p>
                            )}
                        </div>
                        {status && <div className="text-xs">{status}</div>}
                        {durationMs !== null && (
                            <div className="text-xs text-muted-foreground">Ran for {durationMs}ms</div>
                        )}
                    </div>

                    <Separator />

                    {/* Results */}
                    <div className="flex gap-2 flex-wrap justify-center">
                        {results.slice().reverse().map((r, revIdx) => {
                            const originalIdx = results.length - 1 - revIdx
                            const show3D = overrides[originalIdx] ?? true

                            return (
                                <ResultCard
                                    key={originalIdx}
                                    result={r}
                                    index={originalIdx}
                                    show3D={show3D}
                                    onToggle={(checked) =>
                                        setOverrides(prev => ({
                                            ...prev,
                                            [originalIdx]: checked
                                        }))
                                    }
                                />
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>How to Use</CardTitle>
                    <CardDescription className="mt-2 text-sm text-gray-300">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Select a target color using the color picker.</li>
                            <li>
                                Choose a preset to control how the search balances speed and accuracy.
                                Presets range from very fast but rough guesses to thorough searches.
                                The <span className="font-semibold">Absolute</span> mode checks all possible combinations for maximum accuracy.
                            </li>
                            <li>
                                Press the button to find the best glass stack options. You can see the results in a <span className="font-semibold">3D preview</span> or switch to a simple list view.
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
                            This tool uses <a href="https://en.wikipedia.org/wiki/Color_difference#CIEDE2000" target="_blank" className="underline">Delta E 2000 (ΔE2000)</a> to measure how close the beacon color is to your target.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Lower ΔE values mean the color is closer to the target.</li>
                            <li>The percentage shown is based on ΔE: higher numbers mean a better match.</li>
                        </ul>
                        <p className="mt-2">How this compares to other tools:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <a href="https://minecraft.wiki/w/Calculators/Beacon_color" target="_blank" className="underline">Minecraft Wiki</a>: Uses ΔE too, but with a simpler method. It often gives less accurate results.
                            </li>
                            <li>
                                <a href="https://minecraft.tools/en/beacon-color.php" target="_blank" className="underline">Minecraft Tools</a>: Shows similarity percentages in a different way. These numbers aren’t comparable to ours.
                            </li>
                        </ul>
                        <p>
                            Overall, in testing, the tool on this site is more accurate than both listed above, achieving more accurate glass combinations to the target color. You can also use the{' '}
                            <button
                                type="button"
                                className="underline"
                                onClick={() => setTabAction('verify')}
                            >
                                Glass to Beacon Calculator
                            </button>{' '}
                            tab to compare results from other tools with our calculations.
                        </p>
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}