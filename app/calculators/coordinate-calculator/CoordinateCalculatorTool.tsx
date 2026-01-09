"use client"

import {useEffect, useState} from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InputField } from "@/components/InputField"
import {useShareManager} from "@/lib/share/useShareManager";
import {useShareSync} from "@/lib/share/useShareSync";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";

export default function CoordinateCalculatorTool() {
    const [owCoords, setOwCoords] = useState({ x: "0", y: "63", z: "0" })

    const safeNumber = (val: string) => {
        if (val === "" || val === "-" || val === ",") return 0
        const n = Number(val.replace(",", "."))
        return isNaN(n) ? 0 : Math.floor(n)
    }

    const updateOw = (coords: { x?: number; y?: number; z?: number }) => {
        setOwCoords((prev) => ({
            x: coords.x !== undefined ? coords.x.toString() : prev.x,
            y: coords.y !== undefined ? coords.y.toString() : prev.y,
            z: coords.z !== undefined ? coords.z.toString() : prev.z,
        }))
    }

    const owX = safeNumber(owCoords.x)
    const owY = safeNumber(owCoords.y)
    const owZ = safeNumber(owCoords.z)

    const nether = {
        x: Math.floor(owX / 8),
        y: owY,
        z: Math.floor(owZ / 8),
    }

    // Chunk info (16x16x256)
    const chunk = {
        x: Math.floor(owX / 16),
        y: Math.floor(owY / 16),
        z: Math.floor(owZ / 16),
        startX: Math.floor(owX / 16) * 16,
        startY: Math.floor(owY / 16) * 16,
        startZ: Math.floor(owZ / 16) * 16,
        endX: Math.floor(owX / 16) * 16 + 15,
        endY: Math.floor(owY / 16) * 16 + 15,
        endZ: Math.floor(owZ / 16) * 16 + 15,
    }

    // Region info (512x512 in X/Z)
    const region = {
        x: Math.floor(owX / 512),
        z: Math.floor(owZ / 512),
        fileName: `r.${Math.floor(owX / 512)}.${Math.floor(owZ / 512)}.mca`,
        chunkStartX: Math.floor(owX / 512) * 32,
        chunkStartZ: Math.floor(owZ / 512) * 32,
        chunkEndX: Math.floor(owX / 512) * 32 + 31,
        chunkEndZ: Math.floor(owZ / 512) * 32 + 31,
        blockStartX: Math.floor(owX / 512) * 512,
        blockEndX: Math.floor(owX / 512) * 512 + 511,
        blockStartZ: Math.floor(owZ / 512) * 512,
        blockEndZ: Math.floor(owZ / 512) * 512 + 511,
    }

    const reset = () => setOwCoords({ x: "0", y: "63", z: "0" })

    const share = useShareManager();

    share.register<{ x: string, y: string, z: string }>(
        "cords",
        [owCoords, setOwCoords],
        value => `${value.x}|${value.y}|${value.z}`,
        value => {
            const values = value.split("|");
            if (values.length == 3 && /^(-?\d+\|-?\d+\|-?\d+)$/.test(value)) {
                return { x: values[0], y: values[1], z: values[2] };
            }
            return { x: "0", y: "63", z: "0" };
        }
    );

    useShareSync(share, "cords", owCoords);

    useEffect(() => {
        share.hydrate();

        return share.startAutoUrlSync({
            debounceMs: 300,
            replace: true,
        });
    }, []);

    const renderInputs = (
        values: { x: string; y: string; z: string },
        onChange: (axis: "x" | "y" | "z", val: string) => void
    ) => (
        <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
                <InputField
                    key={axis}
                    variant="number"
                    allowNegative
                    value={values[axis]}
                    onChange={(val) => onChange(axis, val)}
                    placeholder={axis.toUpperCase()}
                />
            ))}
        </div>
    )

    return (
        <div>
            {/* Overworld Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Overworld Coordinates</CardTitle>
                    <CardDescription>Edit any field to recalculate all derived info.</CardDescription>
                    <CardAction>
                        <Button variant="outline" onClick={reset}>Reset</Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Row 1: Coordinates */}
                    <div>
                        <CardDescription className="font-medium">Coordinates</CardDescription>
                        {renderInputs(owCoords, (axis, val) => updateOw({ [axis]: safeNumber(val) }))}
                    </div>

                    {/* Row 2: Chunk Info */}
                    <div>
                        <CardDescription className="font-medium">Chunk Information</CardDescription>
                        {renderInputs(
                            { x: chunk.x.toString(), y: chunk.y.toString(), z: chunk.z.toString() },
                            (axis, val) => {
                                const intVal = safeNumber(val)
                                if (axis === "x") updateOw({ x: intVal * 16 + (owX % 16) })
                                if (axis === "y") updateOw({ y: intVal * 16 + (owY % 16) })
                                if (axis === "z") updateOw({ z: intVal * 16 + (owZ % 16) })
                            }
                        )}
                        <CardDescription>
                            This chunk goes from X: {chunk.startX}, Y: {chunk.startY}, Z: {chunk.startZ} to X: {chunk.endX}, Y: {chunk.endY}, Z: {chunk.endZ}
                        </CardDescription>
                    </div>

                    {/* Row 3: Region Info */}
                    <div>
                        <CardDescription className="font-medium">Region Information</CardDescription>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <InputField
                                variant="number"
                                value={region.x.toString()}
                                onChange={(val) => updateOw({ x: safeNumber(val) * 512 + (owX % 512) })}
                                placeholder="X"
                            />
                            <InputField
                                variant="number"
                                value={region.z.toString()}
                                onChange={(val) => updateOw({ z: safeNumber(val) * 512 + (owZ % 512) })}
                                placeholder="Z"
                            />
                            <InputField
                                variant="text"
                                value={region.fileName}
                                readOnly
                                placeholder="File Name"
                            />
                        </div>
                        <CardDescription>
                            This region has chunks X: {region.chunkStartX}–{region.chunkEndX}, Z: {region.chunkStartZ}–{region.chunkEndZ}.
                        </CardDescription>
                        <CardDescription>
                            This chunk has blocks X: {region.blockStartX}–{region.blockEndX}, Y: 0–255, Z: {region.blockStartZ}–{region.blockEndZ}.
                        </CardDescription>
                    </div>
                </CardContent>
            </Card>

            {/* Nether Card */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Nether Coordinates</CardTitle>
                    <CardDescription>Edit any field to update Overworld coordinates.</CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-3 gap-2">
                    <InputField
                        variant="number"
                        allowNegative
                        value={nether.x.toString()}
                        onChange={(val) => updateOw({ x: safeNumber(val) * 8 })}
                        placeholder="X"
                    />
                    <InputField
                        variant="number"
                        allowNegative
                        value={nether.y.toString()}
                        onChange={(val) => updateOw({ y: safeNumber(val) })}
                        placeholder="Y"
                    />
                    <InputField
                        variant="number"
                        allowNegative
                        value={nether.z.toString()}
                        onChange={(val) => updateOw({ z: safeNumber(val) * 8 })}
                        placeholder="Z"
                    />
                </CardContent>
            </Card>

            {/* Copy share link */}
            <Card className="mt-6">
                <CardContent>
                    <CopyShareLinkInput label="Copy Share Link:" className="w-full"></CopyShareLinkInput>
                </CardContent>
            </Card>
        </div>
    )
}
