"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Beacon3d, { SegmentTuple } from "@/app/generators/beacon-color/preview/Beacon3d"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { memo } from "react"
import {
    Candidate,
    findColorName,
    rgbToHex
} from "@/app/generators/beacon-color/subtools/beaconToGlassTool"

interface ResultCardProps {
    result: Candidate
    index: number
    show3D: boolean
    onToggle: (checked: boolean) => void
}

export function toTitleCase(str: string): string {
    return str.toLowerCase().split(' ').map((word: string) => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

export const ResultCard = memo(function ResultCard({result, index, show3D, onToggle}: ResultCardProps) {
    const segmentsFor3D: SegmentTuple[] =
        result.mergedStackColors!.map((color, i) => [
            `#${color
                .map(c => Math.round(c).toString(16).padStart(2, "0"))
                .join("")}`,
            findColorName(result.stack[i])
        ])
    console.log(segmentsFor3D)

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>
                    {`${Math.max(0, 100 - result.dist).toFixed(0)}% Accuracy (ΔE: ${result.dist.toFixed(2)})`}
                </CardTitle>
            </CardHeader>

            <CardContent className="h-full flex flex-col justify-between">
                <div className="mx-auto" style={{ width: 230 }}>
                    {show3D ? (
                        <Beacon3d
                            segments={segmentsFor3D}
                            width={220}
                            height={300}
                        />
                    ) : (
                        <>
                            <p className="text-xs text-gray-400 mb-2">Bottom to top</p>
                            <ul className="flex flex-col gap-2">
                                {segmentsFor3D.map(([, glass], i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Image
                                            src={`/assets/tool/beacon/glass/${glass}.png`}
                                            alt={glass}
                                            width={20}
                                            height={20}
                                            className="w-6 h-6 border"
                                        />
                                        <span className="text-xs">{toTitleCase(glass.replaceAll("_", " "))}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mt-2">
                        <div
                            className="w-6 h-6 rounded border"
                            style={{
                                backgroundColor: `rgb(${result.color
                                    .map(c => Math.round(c))
                                    .join(",")})`
                            }}
                        />
                        <span className="text-xs">
                            RGB: {result.color.map(c => Math.round(c)).join(", ")} ({rgbToHex(result.color)})
                        </span>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">
                            {`${Math.max(0, 100 - result.dist).toFixed(0)}% - ΔE: ${result.dist.toFixed(2)}`}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs">3D Preview</span>
                            <Switch
                                id={`preview-${index}`}
                                checked={show3D}
                                onCheckedChange={onToggle}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})
