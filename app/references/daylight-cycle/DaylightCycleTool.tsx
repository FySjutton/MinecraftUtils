"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    AngleSlider,
    AngleSliderRange,
    AngleSliderThumb,
    AngleSliderTrack,
    AngleSliderValue,
} from "@/components/ui/angle-slider"
import {Button} from "@/components/ui/button";
import {DaylightDetector} from "@/app/references/daylight-cycle/DaylightDetector";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {TimeTickConverter} from "@/app/references/daylight-cycle/TimeTickConverter";
import ImageObj from "next/image";

export default function DaylightCycleTool() {
    const videoEastRef = useRef<HTMLVideoElement | null>(null)
    const videoWestRef = useRef<HTMLVideoElement | null>(null)

    const isInteractingRef = useRef(false) // <-- guard to detect real user interaction
    const rafRef = useRef<number | null>(null)

    const MAX_ANGLE = 360

    const [angle, setAngle] = useState<number>(0)
    const [playing, setPlaying] = useState<boolean>(false)

    const [tick, setTick] = useState<number>(0)

    useEffect(() => {
        setTick(Math.round((angle / MAX_ANGLE) * 24000))
    }, [angle])

    const angleFromTime = (t: number, dur: number) =>
        dur > 0 ? (t / dur) * MAX_ANGLE : 0

    const timeFromAngle = (a: number, dur: number) => (a / MAX_ANGLE) * dur

    const togglePlay = async () => {
        const east = videoEastRef.current
        const west = videoWestRef.current
        if (!east || !west) return

        if (playing) {
            east.pause()
            west.pause()
            setPlaying(false)
        } else {
            try {
                await Promise.all([east.play(), west.play()])
                setPlaying(true)
            } catch (e) {
                console.warn("Play failed", e)
            }
        }
    }

    useEffect(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }

        if (!playing) return

        const loop = () => {
            const east = videoEastRef.current
            const west = videoWestRef.current
            if (!east || !west) {
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            const newAngle = angleFromTime(east.currentTime, east.duration || 1)
            setAngle((prev) => (Math.abs(newAngle - prev) >= 0.25 ? newAngle : prev))

            const targetWest = (east.currentTime / (east.duration || 1)) * (west.duration || 1)
            if (Math.abs((west.currentTime || 0) - targetWest) > 0.05) {
                try {
                    west.currentTime = targetWest
                } catch {}
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [playing])

    const onSliderChange = (vals: number[]) => {
        const a = vals[0]
        setAngle(a)

        if (!isInteractingRef.current) return

        const east = videoEastRef.current
        const west = videoWestRef.current
        if (!east || !west) return

        if (playing) {
            east.pause()
            west.pause()
            setPlaying(false)
        }

        const t = timeFromAngle(a, east.duration || 1)
        try {
            east.currentTime = t
            west.currentTime = t
        } catch {}
    }

    const onPointerDown = (e: React.PointerEvent) => {
        isInteractingRef.current = true
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }
    const onPointerUp = (e: React.PointerEvent) => {
        ;(e.target as Element).releasePointerCapture?.(e.pointerId)
        isInteractingRef.current = false
    }

    const formatTo24000 = (value: number | number[]) => {
        if (Array.isArray(value)) {
            const scaled = value.map(v => Math.round((v / 360) * 24000));
            return `${scaled[0]} - ${scaled[scaled.length - 1]}`;
        }
        return Math.round((value / 360) * 24000).toString();
    };

    const imageRef = React.useRef<HTMLImageElement | null>(null)
    const [sliderSize, setSliderSize] = useState(150)

    React.useEffect(() => {
        const updateSize = () => {
            if (imageRef.current) {
                const { width } = imageRef.current.getBoundingClientRect()
                setSliderSize((width - 50) / 3)
            }
        }

        if (imageRef.current?.complete) {
            updateSize()
        } else {
            imageRef.current?.addEventListener("load", updateSize)
        }

        window.addEventListener("resize", updateSize)

        return () => {
            window.removeEventListener("resize", updateSize)
            imageRef.current?.removeEventListener("load", updateSize)
        }
    }, [])


    return (
        <div className="relative flex flex-col items-center gap-6 w-full h-full p-4">
            <div className="relative w-[90vmin] h-[90vmin] sm:w-[80vmin] sm:h-[80vmin] md:w-[70vmin] md:h-[70vmin] lg:w-[600px] lg:h-[600px] mb-10 mt-5">

                <ImageObj
                    ref={imageRef}
                    src="/assets/tool/daycycle/background.png"
                    alt="background"
                    className="absolute inset-0 top-[50%] left-[50%] translate-[-50%] w-full h-full object-contain z-0 border-2"
                    width={1305}
                    height={1305}
                />

                <AngleSlider
                    value={[angle]}
                    onValueChange={onSliderChange}
                    max={MAX_ANGLE}
                    min={0}
                    step={1}
                    size={sliderSize}
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    className="absolute top-[50%] left-[50%] translate-[-50%] z-10"
                >
                    <AngleSliderTrack>
                        <AngleSliderRange />
                    </AngleSliderTrack>
                    <AngleSliderThumb />
                    <AngleSliderValue formatValue={formatTo24000} />
                </AngleSlider>
            </div>

            <Button onClick={togglePlay} variant="outline" className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%]">
                {playing ? "Pause" : "Play"}
            </Button>

            <Card className="w-full sm:w-[80%] md:w-[70%] lg:w-[60%]">
                <CardHeader>
                    <CardTitle>Daylight Detector Power Output</CardTitle>
                    <CardDescription>
                        View the current daylight detector power output at the current time.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                        <video
                            ref={videoEastRef}
                            src="/assets/tool/daycycle/east.mp4"
                            muted
                            loop
                            preload="metadata"
                            className="w-full sm:w-[45%] aspect-video rounded-lg shadow"
                        />
                        <video
                            ref={videoWestRef}
                            src="/assets/tool/daycycle/west.mp4"
                            muted
                            loop
                            preload="metadata"
                            className="w-full sm:w-[45%] aspect-video rounded-lg shadow"
                        />
                    </div>
                </CardContent>
            </Card>

            <DaylightDetector tick={tick} />

            <TimeTickConverter />
        </div>
    )
}
