"use client"

import {useMemo, useCallback, useState} from "react"
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {InputField} from "@/components/inputs/InputField"
import {CopyShareLinkInput} from "@/components/inputs/CopyShareLinkInput"
import {Badge} from "@/components/ui/badge"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {useUrlUpdateEmitter} from "@/lib/urlParsers"
import {createParser, parseAsInteger, useQueryState} from "nuqs"
import {Throw, triangulateMultiple, TriangulationResult} from "./triangulate"
import StrongholdMap, {TAB_COLORS, StrongholdMapData} from "./StrongholdMap"
import {Plus, Trash2, Crosshair, AlertTriangle, Info, CircleHelp, X, MapPin, ClipboardPaste, ChevronDown, ChevronUp} from "lucide-react"

interface ThrowInput {
    x: string
    z: string
    yaw: string
}

// URL format: throwGroup1|throwGroup2  where each group = x,z,yaw;x,z,yaw
const strongholdsParser = createParser<ThrowInput[][]>({
    serialize(value) {
        return value
            .map(group => group.map(t => `${t.x},${t.z},${t.yaw}`).join(";"))
            .join("|")
    },
    parse(value) {
        if (!value) return null
        const groups = value.split("|").map(groupStr => {
            return groupStr.split(";").map(s => {
                const [x, z, yaw] = s.split(",")
                if (x === undefined || z === undefined || yaw === undefined) return null
                return {x, z, yaw}
            })
        })
        if (groups.some(g => g.some(t => t === null))) return null
        return groups as ThrowInput[][]
    }
}).withDefault([[{x: "", z: "", yaw: ""}]])

const confidenceColors: Record<string, string> = {
    "High": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    "Moderate": "bg-green-500/15 text-green-700 dark:text-green-400",
    "Low": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    "Very Low": "bg-red-500/15 text-red-700 dark:text-red-400",
}

function isThrowComplete(t: ThrowInput): boolean {
    return t.x !== "" && t.x !== "-" && t.z !== "" && t.z !== "-" && t.yaw !== "" && t.yaw !== "-"
}

function safeNumber(val: string): number | null {
    if (val === "" || val === "-") return null
    const n = Number(val.replace(",", "."))
    return isNaN(n) ? null : n
}

function parseThrows(inputs: ThrowInput[]): {validThrows: Throw[]; result: TriangulationResult | null} {
    const validThrows: Throw[] = []
    for (const t of inputs) {
        const x = safeNumber(t.x)
        const z = safeNumber(t.z)
        const yaw = safeNumber(t.yaw)
        if (x === null || z === null || yaw === null) continue
        validThrows.push({x, z, yaw})
    }
    return {
        validThrows,
        result: validThrows.length >= 2 ? triangulateMultiple(validThrows) : null,
    }
}

/**
 * Try to extract a throw from a pasted F3+C line or plain "x z yaw" text.
 *
 * Supported formats (from the original HTML tool / Minecraft):
 *   /execute in overworld run tp @s X Y Z yaw pitch
 *   /execute in the_nether run tp @s X Y Z yaw pitch   (coords ×8)
 *   /tp @s X Y Z yaw pitch
 *   X Z yaw
 *
 * Returns null if the line doesn't look like a throw.
 */
function parseF3CLine(line: string): ThrowInput | null {
    line = line.trim()
    if (!line || line.startsWith("--") || line.startsWith("#")) return null

    const float = /[-+]?(?:\d+(?:[.]\d*)?|[.]\d+)/

    // /execute … run tp @s X Y Z yaw pitch
    const execMatch = line.match(
        /\/execute\s+in\s+(\S+)\s+run\s+tp\s+@s\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)/i
    )
    if (execMatch) {
        const dimension = execMatch[1].toLowerCase()
        const scale = dimension === "the_nether" ? 8 : 1
        const x = parseFloat(execMatch[2]) * scale
        const z = parseFloat(execMatch[4]) * scale
        const yaw = parseFloat(execMatch[5])
        const pitch = parseFloat(execMatch[6])
        // Looking straight down means the player is standing on the stronghold — treat as point, skip
        if (Math.abs(pitch) >= 89) return null
        return {x: String(Math.round(x * 100) / 100), z: String(Math.round(z * 100) / 100), yaw: String(yaw)}
    }

    // /tp @s X Y Z yaw pitch
    const tpMatch = line.match(
        /\/tp\s+@s\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)\s+([-+]?\d[\d.]*)/i
    )
    if (tpMatch) {
        const pitch = parseFloat(tpMatch[5])
        if (Math.abs(pitch) >= 89) return null
        return {
            x: tpMatch[1],
            z: tpMatch[3],
            yaw: tpMatch[4],
        }
    }

    // Plain "X Z yaw" (three numbers, no ~)
    const parts = line.split(/\s+/)
    if (parts.length === 3 && parts.every(p => float.test(p))) {
        return {x: parts[0], z: parts[1], yaw: parts[2]}
    }

    return null
}

export default function StrongholdTriangulator() {
    useUrlUpdateEmitter()

    const [allStrongholds, setAllStrongholds] = useQueryState("t", strongholdsParser)
    const [activeTab, setActiveTab] = useQueryState("tab", parseAsInteger.withDefault(0))
    const [mapCollapsed, setMapCollapsed] = useState(false)
    const [instructionsCollapsed, setInstructionsCollapsed] = useState(true)
    const [pasteError, setPasteError] = useState<string | null>(null)

    // Clamp active tab
    const tab = Math.min(activeTab, allStrongholds.length - 1)
    const throwInputs = allStrongholds[tab] ?? [{x: "", z: "", yaw: ""}]

    // Compute results for all strongholds (for the map)
    const allResults: StrongholdMapData[] = useMemo(() => {
        return allStrongholds.map(group => {
            const {validThrows, result} = parseThrows(group)
            return {throws: validThrows, result}
        })
    }, [allStrongholds])

    const {result, validThrowCount} = useMemo(() => {
        const {validThrows, result} = parseThrows(throwInputs)
        return {result, validThrowCount: validThrows.length}
    }, [throwInputs])

    const warningsByIndex = useMemo(() => {
        const map = new Map<number, string>()
        if (result) {
            for (const w of result.throwWarnings) {
                map.set(w.index, w.message)
            }
        }
        return map
    }, [result])

    // Stronghold tab helpers
    const updateThrows = useCallback((updater: (prev: ThrowInput[]) => ThrowInput[]) => {
        setAllStrongholds(prev => {
            const next = [...prev]
            next[tab] = updater(next[tab] ?? [{x: "", z: "", yaw: ""}])
            return next
        })
    }, [setAllStrongholds, tab])

    const updateThrow = useCallback((index: number, field: keyof ThrowInput, value: string) => {
        updateThrows(prev => {
            const next = [...prev]
            next[index] = {...next[index], [field]: value}
            const lastIndex = next.length - 1
            if (index === lastIndex && isThrowComplete(next[lastIndex]) && next.length < 5) {
                next.push({x: "", z: "", yaw: ""})
            }
            return next
        })
    }, [updateThrows])

    const addThrow = useCallback(() => {
        updateThrows(prev => [...prev, {x: "", z: "", yaw: ""}])
    }, [updateThrows])

    const removeThrow = useCallback((index: number) => {
        updateThrows(prev => {
            const next = prev.filter((_, i) => i !== index)
            return next.length === 0 ? [{x: "", z: "", yaw: ""}] : next
        })
    }, [updateThrows])

    const resetThrows = useCallback(() => {
        updateThrows(() => [{x: "", z: "", yaw: ""}])
    }, [updateThrows])

    // Fix: don't call setActiveTab inside setAllStrongholds updater (side-effect in updater)
    const addStronghold = useCallback(() => {
        setAllStrongholds(prev => [...prev, [{x: "", z: "", yaw: ""}]])
            .then(() => {
                setActiveTab(allStrongholds.length)
            })
    }, [setAllStrongholds, setActiveTab, allStrongholds.length])

    const removeStronghold = useCallback((index: number) => {
        if (allStrongholds.length <= 1) return
        const next = allStrongholds.filter((_, i) => i !== index)
        const newTab = tab >= next.length ? next.length - 1 : tab > index ? tab - 1 : tab
        setAllStrongholds(next)
        setActiveTab(newTab)
    }, [setAllStrongholds, setActiveTab, allStrongholds, tab])

    // F3+C multi-line paste handler
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text")
        if (!text.includes("\n") && !text.includes("/execute") && !text.includes("/tp")) return

        const lines = text.split(/\r?\n/)
        const parsed: ThrowInput[] = []
        for (const line of lines) {
            const t = parseF3CLine(line)
            if (t) parsed.push(t)
        }

        if (parsed.length === 0) return

        e.preventDefault()
        setPasteError(null)

        updateThrows(prev => {
            // Merge: fill empty slots first, then append
            const next = [...prev]
            for (const t of parsed) {
                const emptyIdx = next.findIndex(r => !isThrowComplete(r))
                if (emptyIdx !== -1) {
                    next[emptyIdx] = t
                } else if (next.length < 5) {
                    next.push(t)
                }
            }
            return next
        })
    }, [updateThrows])

    const firstComplete = throwInputs.length > 0 && isThrowComplete(throwInputs[0])

    return (
        <div onPaste={handlePaste}>
            {/* Instructions */}
            <Card>
                <CardHeader>
                    <div className="card-header-text flex-1">
                        <CardTitle>How to Use</CardTitle>
                        <CardDescription>Instructions for measuring Eye of Ender throws</CardDescription>
                    </div>
                    <CardAction>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInstructionsCollapsed(c => !c)}
                        >
                            {instructionsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            {instructionsCollapsed ? "Show" : "Hide"}
                        </Button>
                    </CardAction>
                </CardHeader>
                {!instructionsCollapsed && (
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Throw an Eye of Ender.</li>
                            <li>Look directly at the Eye while it is flying.</li>
                            <li>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">F3</kbd> to open the debug screen.</li>
                            <li>Record your <strong>X</strong>, <strong>Z</strong>, and <strong>Facing (Yaw)</strong> values.</li>
                            <li>Walk <strong>250–300 blocks</strong> in any direction.</li>
                            <li>Repeat for a second throw (or more for better accuracy).</li>
                        </ol>
                        <p className="text-xs pt-1 border-t border-border">
                            <ClipboardPaste className="h-3 w-3 inline mr-1" />
                            <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">F3+C</kbd> in-game to copy your exact position, then paste it anywhere on this page — throws will be filled in automatically.
                        </p>
                    </CardContent>
                )}
            </Card>

            {/* Map */}
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Map
                    </CardTitle>
                    <CardDescription>Pan by dragging, zoom with scroll wheel.</CardDescription>
                    <CardAction>
                        <Button variant="outline" size="sm" onClick={() => setMapCollapsed(c => !c)}>
                            {mapCollapsed ? "Show" : "Hide"}
                        </Button>
                    </CardAction>
                </CardHeader>
                {!mapCollapsed && (
                    <CardContent className="p-0 overflow-hidden">
                        <div className="h-[350px] w-full rounded-b-xl overflow-hidden">
                            <StrongholdMap strongholds={allResults} activeIndex={tab} />
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Stronghold Tabs */}
            <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                {allStrongholds.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={`
                            relative group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
                            transition-colors border
                            ${i === tab
                            ? "bg-background border-border shadow-sm"
                            : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                        `}
                    >
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{backgroundColor: TAB_COLORS[i % TAB_COLORS.length]}}
                        />
                        Stronghold {i + 1}
                        {allResults[i]?.result && (
                            <span className="text-xs text-muted-foreground font-mono ml-1">
                                ({allResults[i].result!.x}, {allResults[i].result!.z})
                            </span>
                        )}
                        {allStrongholds.length > 1 && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeStronghold(i)
                                }}
                                className="ml-0.5 p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}
                    </button>
                ))}
                {allStrongholds.length < 5 && (
                    <button
                        onClick={addStronghold}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground
                            border border-dashed border-border hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Throw Inputs */}
            <Card className="mt-3">
                <CardHeader>
                    <CardTitle>
                        <span className="flex items-center gap-2">
                            <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{backgroundColor: TAB_COLORS[tab % TAB_COLORS.length]}}
                            />
                            Stronghold {tab + 1} — Throws
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {validThrowCount === 0 && "Enter your first throw to get started, or paste F3+C output."}
                        {validThrowCount === 1 && "Walk 250–300 blocks away and enter a second throw."}
                        {validThrowCount >= 2 && `${validThrowCount} throws entered. Add more to improve accuracy.`}
                    </CardDescription>
                    <CardAction>
                        <Button variant="outline" size="sm" onClick={resetThrows}>Reset</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                    {pasteError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{pasteError}</AlertDescription>
                        </Alert>
                    )}
                    {throwInputs.map((t, i) => (
                        <div key={i}>
                            {i === 1 && firstComplete && !isThrowComplete(t) && (
                                <p className="text-xs text-muted-foreground mb-1.5 ml-0.5">
                                    Walk ~250 blocks in any direction, throw another Eye, and record the values.
                                </p>
                            )}
                            <div className="flex items-end gap-2">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-6 mb-1.5 shrink-0 justify-center">
                                    {warningsByIndex.has(i) ? (
                                        <span title={warningsByIndex.get(i)}>
                                            <CircleHelp className="h-4 w-4 text-amber-500" />
                                        </span>
                                    ) : (
                                        <span className="font-mono">{i + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <InputField
                                        variant="text"
                                        value={t.x}
                                        onChange={(val) => updateThrow(i, "x", val)}
                                        placeholder="X"
                                        label={i === 0 ? "X" : undefined}
                                        maxLength={15}
                                    />
                                    <InputField
                                        variant="text"
                                        value={t.z}
                                        onChange={(val) => updateThrow(i, "z", val)}
                                        placeholder="Z"
                                        label={i === 0 ? "Z" : undefined}
                                        maxLength={15}
                                    />
                                    <InputField
                                        variant="text"
                                        value={t.yaw}
                                        onChange={(val) => updateThrow(i, "yaw", val)}
                                        placeholder="Yaw"
                                        label={i === 0 ? "Yaw" : undefined}
                                        maxLength={15}
                                    />
                                </div>
                                {throwInputs.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 mb-0.5"
                                        onClick={() => removeThrow(i)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {warningsByIndex.has(i) && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-8">
                                    {warningsByIndex.get(i)}
                                </p>
                            )}
                        </div>
                    ))}
                    {throwInputs.length < 5 && isThrowComplete(throwInputs[throwInputs.length - 1]) && (
                        <Button variant="outline" size="sm" onClick={addThrow} className="w-full">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Throw
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crosshair className="h-5 w-5" />
                        Stronghold {tab + 1} Estimate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <div className="text-sm text-muted-foreground">X Coordinate</div>
                                    <div className="text-2xl font-bold font-mono">{result.x}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <div className="text-sm text-muted-foreground">Z Coordinate</div>
                                    <div className="text-2xl font-bold font-mono">{result.z}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge className={confidenceColors[result.confidence] ?? ""}>
                                    {result.confidence} Confidence
                                </Badge>
                                <Badge variant="outline">
                                    ~{result.errorRadius} blocks
                                </Badge>
                                <Badge variant="outline">
                                    {result.angle}° intersection
                                </Badge>
                                <Badge variant="outline">
                                    {result.throwSpacing} blocks apart
                                </Badge>
                                {validThrowCount > 2 && (
                                    <Badge variant="outline">
                                        {validThrowCount} throws
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {result.confidenceReason}
                            </p>

                            {result.spacingWarning && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{result.spacingWarning}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>
                                {validThrowCount === 0 && "Enter your first Eye of Ender throw above to get started."}
                                {validThrowCount === 1 && "Enter a second throw to triangulate the stronghold position."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Share */}
            <Card className="mt-4">
                <CardContent>
                    <CopyShareLinkInput />
                </CardContent>
            </Card>
        </div>
    )
}