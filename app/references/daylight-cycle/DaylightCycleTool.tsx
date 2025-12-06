"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    AngleSlider,
    AngleSliderRange,
    AngleSliderThumb,
    AngleSliderTrack,
    AngleSliderValue,
} from "@/components/ui/angle-slider"

export default function DaylightCycleTool() {
    const videoEastRef = useRef<HTMLVideoElement | null>(null)
    const videoWestRef = useRef<HTMLVideoElement | null>(null)

    const MAX_ANGLE = 360

    const [angle, setAngle] = useState<number>(0)
    const [playing, setPlaying] = useState<boolean>(false)

    const angleFromTime = (t: number, dur: number) => (dur > 0 ? (t / dur) * MAX_ANGLE : 0)

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

    // Smooth slider update from videos
    useEffect(() => {
        if (!playing) return

        const loop = () => {
            const east = videoEastRef.current
            const west = videoWestRef.current
            if (!east || !west) return

            // Update slider from east video
            setAngle(angleFromTime(east.currentTime, east.duration || 1))

            // Keep west video in sync
            const drift = Math.abs(east.currentTime - west.currentTime)
            if (drift > 0.05) {
                try {
                    west.currentTime = east.currentTime
                } catch {}
            }

            requestAnimationFrame(loop)
        }

        const rafId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafId)
    }, [playing])

    return (
        <div className="flex flex-col items-center gap-6 w-full h-full p-4">
            <AngleSlider
                value={[angle]}
                max={MAX_ANGLE}
                min={0}
                step={1}
                size={150}
                disabled // slider is read-only
            >
                <AngleSliderTrack>
                    <AngleSliderRange />
                </AngleSliderTrack>
                <AngleSliderThumb />
                <AngleSliderValue />
            </AngleSlider>

            <button onClick={togglePlay} className="px-4 py-2 rounded bg-blue-600 text-white">
                {playing ? "Pause" : "Play"}
            </button>

            <div className="flex gap-4 w-full max-w-4xl mt-4">
                <video
                    ref={videoEastRef}
                    src="/assets/daycycle/east.mp4"
                    muted
                    loop
                    preload="metadata"
                    className="w-1/2 aspect-video rounded-lg shadow"
                />
                <video
                    ref={videoWestRef}
                    src="/assets/daycycle/west.mp4"
                    muted
                    loop
                    preload="metadata"
                    className="w-1/2 aspect-video rounded-lg shadow"
                />
            </div>
        </div>
    )
}
