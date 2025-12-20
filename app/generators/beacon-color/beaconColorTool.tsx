"use client"

import { useMemo, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, RGB, beaconColor, deltaE_lab_rgb, hexToRgb } from './colorCalculator'
import {
    ColorPicker, ColorPickerAlphaSlider,
    ColorPickerArea,
    ColorPickerContent, ColorPickerEyeDropper, ColorPickerFormatSelect, ColorPickerHueSlider, ColorPickerInput,
    ColorPickerSwatch,
    ColorPickerTrigger
} from "@/components/ui/color-picker";

const COLOR_ENTRIES = Object.entries(GLASS_COLORS)
const MAX_HEIGHT = 6

function rgbToHex(rgb: RGB) {
    return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`
}

interface Preset {
    name: string
    beamWidth: number | null
}

const PRESETS: Preset[] = [
    { name: 'Very Low', beamWidth: 60 },
    { name: 'Low', beamWidth: 180 },
    { name: 'Normal', beamWidth: 400 },
    { name: 'High', beamWidth: 800 },
    { name: 'Very High', beamWidth: 4000 },
    { name: 'Absolute', beamWidth: null },
]

interface Candidate {
    stack: RGB[]
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
    const [preset, setPreset] = useState(PRESETS[2].name)
    const [results, setResults] = useState<Candidate[]>([])
    const [colorsChecked, setColorsChecked] = useState(0)
    const [status, setStatus] = useState<string | null>(null)
    const [previewColor, setPreviewColor] = useState<RGB | null>(null)

    const workerRef = useRef<Worker | null>(null)

    const target = useMemo(() => hexToRgb(hex), [hex])
    const currentPreset = useMemo(() => PRESETS.find(p => p.name === preset), [preset])

    // Runs beam search
    const runBeamSearch = async (beamWidth: number) => {
        setStatus(`Running beam search (width=${beamWidth})`)
        let checked = 0
        const bestPerLength: Record<number, Candidate | null> = {}
        let beam: Candidate[] = [{ stack: [], color: [0, 0, 0], dist: deltaE_lab_rgb(target, [0, 0, 0]) }]

        for (let depth = 1; depth <= MAX_HEIGHT; depth++) {
            const expanded: Candidate[] = []
            for (const cand of beam) {
                for (const [, rgb] of COLOR_ENTRIES) {
                    const newStack = [...cand.stack, rgb]
                    const color = beaconColor(newStack)
                    const dist = deltaE_lab_rgb(target, color)
                    expanded.push({ stack: newStack, color, dist })
                    checked++
                }
            }
            expanded.sort((a, b) => a.dist - b.dist)
            beam = expanded.slice(0, beamWidth)

            for (const cand of beam) {
                const len = cand.stack.length
                const existing = bestPerLength[len]
                if (!existing || cand.dist < existing.dist) {
                    bestPerLength[len] = { ...cand }
                }
            }

            // allow UI updates
            await new Promise(r => setTimeout(r, 0))
            setColorsChecked(checked)
        }

        setStatus(null)
        return { bestPerLength, checked }
    }

    const runExhaustive = () => {
        if (workerRef.current) {
            workerRef.current.terminate()
        }

        setStatus('Starting exhaustive search (worker)')
        const worker = new Worker(new URL('./beaconWorker.ts', import.meta.url), { type: 'module' })
        workerRef.current = worker

        worker.postMessage({ cmd: 'exhaustive', maxHeight: MAX_HEIGHT, targetHex: hex })

        const bestPerLength: Record<number, Candidate | null> = {}

        worker.onmessage = (ev: MessageEvent) => {
            const data = ev.data
            if (data.type === 'progress') {
                setColorsChecked(data.checked)
            } else if (data.type === 'lengthResult') {
                bestPerLength[data.length] = data.best
            } else if (data.type === 'done') {
                const resultsArr: Candidate[] = []
                let bestDistSoFar = Infinity
                for (let len = 1; len <= MAX_HEIGHT; len++) {
                    const cand = bestPerLength[len]
                    if (cand && cand.dist < bestDistSoFar) {
                        resultsArr.push(cand)
                        bestDistSoFar = cand.dist
                    }
                }
                setResults(resultsArr)
                if (resultsArr.length > 0) setPreviewColor(resultsArr[resultsArr.length - 1].color)
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
        setPreviewColor(null)

        if (currentPreset.beamWidth === null) {
            runExhaustive()
            return
        }

        setStatus('Starting beam search')
        const { bestPerLength, checked } = await runBeamSearch(currentPreset.beamWidth)

        const resultsArr: Candidate[] = []
        let bestDistSoFar = Infinity
        for (let len = 1; len <= MAX_HEIGHT; len++) {
            const cand = bestPerLength[len]
            if (cand && cand.dist < bestDistSoFar) {
                resultsArr.push(cand)
                bestDistSoFar = cand.dist
            }
        }

        if (resultsArr.length > 0) setPreviewColor(resultsArr[resultsArr.length - 1].color)
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beacon Beam Color Generator</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <ColorPicker defaultFormat="hex" defaultValue="#3b82f6" onValueChange={(val) => setHex(val)}>
                    <ColorPickerTrigger asChild>
                        <ColorPickerSwatch />
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
                            <ColorPickerInput withoutAlpha={true} />
                        </div>
                    </ColorPickerContent>
                </ColorPicker>
                <div className="flex items-center gap-4">
                    <Input type="color" value={hex} onChange={e => setHex(e.target.value)} />
                    <span className="text-sm">Target color: {hex}</span>
                    <div className="w-6 h-6 rounded border" style={{ backgroundColor: hex }} />
                </div>

                <div>
                    <label>Search Preset:</label>
                    <select value={preset} onChange={e => setPreset(e.target.value)}>
                        {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <div className="text-xs text-muted-foreground">Beam width / strategy: {currentPreset?.beamWidth ?? 'Exhaustive'}</div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={findBest}>Find Closest Glass Stacks</Button>
                    <Button onClick={cancelWorker}>Cancel</Button>
                    <div className="text-xs text-muted-foreground">Colors checked: {colorsChecked}</div>
                    {status && <div className="text-xs">{status}</div>}
                </div>

                {results.length > 0 && <>
                    <Separator />
                    {results.map((r, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                            <div className="font-semibold">Length {r.stack.length} — ΔE: {r.dist.toFixed(2)}</div>
                            <ul className="list-disc list-inside text-sm">
                                {r.stack.map((rgb: RGB, i: number) => (
                                    <li key={i}>{findColorName(rgb)}</li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border" style={{ backgroundColor: `rgb(${r.color.map(c => Math.round(c)).join(',')})` }} />
                                <span className="text-sm">Result RGB: {r.color.map(c => Math.round(c)).join(', ')} / Hex: {rgbToHex(r.color)}</span>
                            </div>
                        </div>
                    ))}
                    {previewColor && <div>
                        <div className="mt-2">Live Preview:</div>
                        <div className="w-32 h-32 border" style={{ backgroundColor: `rgb(${previewColor.map(c => Math.round(c)).join(',')})` }} />
                    </div>}
                </>}
            </CardContent>
        </Card>
    )
}
