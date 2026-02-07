"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {Card, CardHeader, CardTitle, CardContent, CardDescription} from "@/components/ui/card"
import { Clock } from "lucide-react"
import {InputField} from "@/components/inputs/InputField";
import {useState} from "react";

interface TimeTickConverterProps {
    initialTick?: number
}

export function TimeTickConverter({ initialTick = 0 }: TimeTickConverterProps) {
    const [date, setDate] = useState<Date>(() => ticksToDate(initialTick))
    const [tick, setTick] = useState<number>(initialTick)
    const timeInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => setTick(dateToTicks(date)), [date])
    React.useEffect(() => setDate(ticksToDate(tick)), [tick])

    const handleTimeChange = (value: string) => {
        const [hours, minutes] = value.split(":").map(Number)
        const newDate = new Date(date)
        newDate.setHours(hours, minutes, 0, 0)
        setDate(newDate)
    }

    const handleTickChange = (value: string) => {
        const newTick = Number(value)
        if (!isNaN(newTick) && newTick >= 0 && newTick <= 24000) {
            setTick(newTick)
        }
    }

    return (
        <Card className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%]">
            <CardHeader>
                <CardTitle>Time & Tick Converter</CardTitle>
                <CardDescription>Convert time to ticks, or the other way around.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-300">Clock Time (24h)</label>
                <div className="relative">
                    <Input
                        type="time"
                        value={formatDateToTime(date)}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        ref={timeInputRef}
                        className="pr-10"
                    />
                    <Clock
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                        onClick={() => timeInputRef.current?.showPicker?.()}
                    />
                </div>

                <InputField
                    label="Tick"
                    value={String(tick)}
                    onChange={handleTickChange}
                    showCopy
                    variant="number"
                    maxLength={5}
                    min={0}
                    max={24000}
                />
            </CardContent>
        </Card>
    )
}

function ticksToDate(tick: number) {
    const totalSeconds = (tick / 24000) * 24 * 3600
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const date = new Date()
    date.setHours(hours, minutes, seconds, 0)
    return date
}

function dateToTicks(date: Date) {
    const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
    return Math.round((seconds / (24 * 3600)) * 24000)
}

function formatDateToTime(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
