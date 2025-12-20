"use client"

import { useMemo, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, RGB, beaconColor, deltaE_lab_rgb, hexToRgb } from './colorCalculator'
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
import { turnToHex } from "@/lib/ColorsToHex";
import { ComboBox } from "@/components/ComboBox";
import { BeaconPreview } from "@/app/generators/beacon-color/preview/BeaconBeam";
import Beacon3d, { SegmentTuple } from "@/app/generators/beacon-color/preview/Beacon3d";
import {Switch} from "@/components/ui/switch";

const COLOR_ENTRIES = Object.entries(GLASS_COLORS)
const MAX_HEIGHT = 6

function rgbToHex(rgb: RGB) {
    return `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

const presets = [
    { name: 'Very Low', beamWidth: 60 },
    { name: 'Low', beamWidth: 180 },
    { name: 'Normal', beamWidth: 400 },
    { name: 'High', beamWidth: 800 },
    { name: 'Very High', beamWidth: 4000 },
    { name: 'Absolute', beamWidth: null },
]
const presentTypes = presets.map(i => (i.name))

interface Candidate {
    stack: RGB[]
    mergedStackColors?: RGB[]
    color: RGB
    dist: number
}

function findColorName(rgb: RGB): string {
    const found = COLOR_ENTRIES.find(([_, v]) =>
        v[0] === rgb[0] && v[1] === rgb[1] && v[2] === rgb[2]
    )
    return found?.[0] ?? "Unknown"
}

export default function BeaconColorTool() {
    const [hex, setHex] = useState('#00eb76')
    const [preset, setPreset] = useState(presets[2].name)
    const [results, setResults] = useState<Candidate[]>([])
    const [colorsChecked, setColorsChecked] = useState(0)
    const [status, setStatus] = useState<string | null>(null)

    const workerRef = useRef<Worker | null>(null)

    const target = useMemo(() => hexToRgb(hex), [hex])
    const currentPreset = useMemo(() => presets.find(p => p.name === preset), [preset])

    const handleColorPickerChange = (val: string) => {
        const hex = turnToHex(val)
        if (hex) setHex(hex)
    }

    // Beam search logic
    const runBeamSearch = async (beamWidth: number) => {
        setStatus(`Running beam search (width=${beamWidth})`)
        let checked = 0
        const bestPerLength: Record<number, Candidate | null> = {}
        let beam: Candidate[] = [{ stack: [], mergedStackColors: [], color: [0, 0, 0], dist: deltaE_lab_rgb(target, [0, 0, 0]) }]

        for (let depth = 1; depth <= MAX_HEIGHT; depth++) {
            const expanded: Candidate[] = []
            for (const cand of beam) {
                for (const [, rgb] of COLOR_ENTRIES) {
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
        setStatus('Starting exhaustive search (worker)')
        const worker = new Worker(new URL('./beaconWorker.ts', import.meta.url), { type: 'module' })
        workerRef.current = worker
        worker.postMessage({ cmd: 'exhaustive', maxHeight: MAX_HEIGHT, targetHex: hex })
        const bestPerLength: Record<number, Candidate | null> = {}

        worker.onmessage = (ev: MessageEvent) => {
            const data = ev.data
            if (data.type === 'progress') setColorsChecked(data.checked)
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
                for (let len = 1; len <= MAX_HEIGHT; len++) {
                    const cand = bestPerLength[len]
                    if (cand && cand.dist < bestDistSoFar) {
                        if (!cand.mergedStackColors) {
                            const mergedStack: RGB[] = []
                            for (let i = 0; i < cand.stack.length; i++) mergedStack.push(beaconColor(cand.stack.slice(0, i + 1)))
                            cand.mergedStackColors = mergedStack
                        }
                        resultsArr.push({ ...cand })
                        bestDistSoFar = cand.dist
                    }
                }
                setResults(resultsArr)
                setColorsChecked(data.checked)
                setStatus('Exhaustive search finished')
                worker.terminate()
                workerRef.current = null
            }
        }

        worker.onerror = (e) => {
            setStatus('Worker error: ' + e.message)
            worker.terminate()
            workerRef.current = null
        }
    }

    const findBest = async () => {
        if (!currentPreset) return
        setResults([])
        setColorsChecked(0)
        if (currentPreset.beamWidth === null) { runExhaustive(); return }

        setStatus('Starting beam search')
        const { bestPerLength, checked } = await runBeamSearch(currentPreset.beamWidth)
        const resultsArr: Candidate[] = []
        let bestDistSoFar = Infinity
        for (let len = 1; len <= MAX_HEIGHT; len++) {
            const cand = bestPerLength[len]
            if (cand) {
                if (!cand.mergedStackColors) {
                    const mergedStack: RGB[] = []
                    for (let i = 0; i < cand.stack.length; i++) mergedStack.push(beaconColor(cand.stack.slice(0, i + 1)))
                    cand.mergedStackColors = mergedStack
                }
                if (cand.dist < bestDistSoFar) {
                    resultsArr.push({ ...cand })
                    bestDistSoFar = cand.dist
                }
            }
        }
        setResults(resultsArr)
        setColorsChecked(checked)
        setStatus(null)
    }

    const cancelWorker = () => {
        if (workerRef.current) {
            workerRef.current.terminate()
            workerRef.current = null
            setStatus('Worker cancelled')
        }
    }

    // --- Toggle state for 3D / list ---
    const reversedResults = useMemo(() => results.slice().reverse(), [results])
    const [overrides, setOverrides] = useState<Record<number, boolean>>({})

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beacon Beam Color Generator</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {/* Target color picker */}
                <div>
                    <p>Target Color:</p>
                    <p className="text-xs text-gray-300 mb-2">Select the color that you want the beacon to be.</p>
                    <div className="flex w-full items-center">
                        <ColorPicker className="w-full mr-5" defaultFormat="hex" value={hex} onValueChange={handleColorPickerChange}>
                            <ColorPickerTrigger asChild className="w-full px-5">
                                <ColorPickerSwatch className="flex place-items-center">
                                    <p className="text-stroke-black select-none">{hex.toUpperCase()}</p>
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
                        <BeaconPreview color={hex}></BeaconPreview>
                    </div>
                </div>

                <Separator />

                {/* Presets */}
                <div>
                    <p className="font-medium">Search Preset:</p>
                    <p className="text-sx text-gray-400 mb-2">A measurement of speed compared to accuracy.</p>
                    <ComboBox
                        items={presentTypes}
                        value={preset}
                        onChange={setPreset}
                        placeholder="Select present"
                        placeholderSearch="Search present..."
                        width="300px"
                        renderItem={item => {
                            return <p className="text-xs text-gray-400">{item == "Absolute" ? "Check all combinations" : `Beam width: ${presets.find(value => value.name == item)?.beamWidth}`}</p>
                        }}
                    />
                </div>

                <Separator />

                {/* Buttons */}
                <div className="flex gap-2">
                    <Button onClick={findBest}>Find Closest Glass Stacks</Button>
                    <Button onClick={cancelWorker}>Cancel</Button>
                    <div className="text-xs text-muted-foreground">Colors checked: {colorsChecked}</div>
                    {status && <div className="text-xs">{status}</div>}
                </div>

                {/* Results */}
                <div className="flex gap-2">
                    {reversedResults.map((r, revIdx) => {
                        const originalIdx = results.length - 1 - revIdx
                        const segmentsFor3D: SegmentTuple[] = r.mergedStackColors!.map((color, i) => [
                            `#${color.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`,
                            findColorName(r.stack[i])
                        ])
                        const show3D = overrides[originalIdx] ?? true

                        return (
                            <Card key={originalIdx}>
                                <CardHeader className="flex justify-between items-center">
                                    <CardTitle>{`ΔE: ${r.dist.toFixed(2)} - ${Math.max(0, 100 - r.dist).toFixed(0)}% Accuracy`}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">3D Preview</span>
                                        <Switch
                                            id={`preview-${originalIdx}`}
                                            checked={show3D}
                                            onCheckedChange={(checked) =>
                                                setOverrides(prev => ({ ...prev, [originalIdx]: checked }))
                                            }
                                        />
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="mx-auto" style={{ width: 250 }}>
                                        {show3D ? (
                                            <Beacon3d segments={segmentsFor3D} width={250} height={300} />
                                        ) : (
                                            <ul className="flex flex-col gap-2">
                                                {segmentsFor3D.map(([_, glass], i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <img
                                                            src={`/assets/tool/beacon/glass/${glass}.png`}
                                                            alt={glass}
                                                            className="w-6 h-6 border"
                                                        />
                                                        <span className="text-xs">{glass}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <div
                                            className="w-6 h-6 rounded border"
                                            style={{ backgroundColor: `rgb(${r.color.map(c => Math.round(c)).join(',')})` }}
                                        />
                                        <span className="text-xs">
                                            RGB: {r.color.map(c => Math.round(c)).join(', ')} ({rgbToHex(r.color)})
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
