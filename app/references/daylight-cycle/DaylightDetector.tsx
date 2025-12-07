'use client'

import * as React from "react"
import powerData from "./daylight_detector.json"
import { ComboBox } from "@/components/ComboBox"
import {InputField} from "@/components/InputField";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

type Weather = "Clear" | "Rain" | "Thunder"

interface DaylightDetectorProps {
    tick: number
}

export function DaylightDetector({ tick }: DaylightDetectorProps) {
    const [weather, setWeather] = React.useState<Weather>("Clear")
    const [currentPower, setCurrentPower] = React.useState<number>(0)

    React.useEffect(() => {
        const weatherData = powerData[weather]

        for (const hour of Object.keys(weatherData) as Array<keyof typeof weatherData>) {
            const ranges = weatherData[hour]!

            for (const [start, end] of ranges) {
                if (start <= end) {
                    if (tick >= start && tick <= end) {
                        setCurrentPower(Number(hour))
                        return
                    }
                } else {
                    if (tick >= start || tick <= end) {
                        setCurrentPower(Number(hour))
                        return
                    }
                }
            }
        }

        setCurrentPower(0)
    }, [tick, weather])

    return (
        <Card className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%]">
            <CardHeader>
                <CardTitle>Daylight Detector Power Output</CardTitle>
                <CardDescription>View the current daylight detector power output at the current time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <label className="font-medium w-full block">Current Weather</label>
                <ComboBox
                    items={["Clear", "Rain", "Thunder"]}
                    value={weather}
                    onChange={(value: string) => setWeather(value as Weather)}
                    placeholder="Select weather"
                    placeholderSearch="Search weather..."
                />

                <div className="mt-2">
                    <InputField
                        showCopy
                        value={currentPower}
                        label="Current Power"
                        readOnly
                    />
                </div>
            </CardContent>
        </Card>
    )
}
