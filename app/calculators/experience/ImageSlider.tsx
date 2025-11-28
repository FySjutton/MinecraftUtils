"use client"

import * as React from "react"
import Image from "next/image"
import {Button} from "@/components/ui/button";
import {ArrowBigLeft, ArrowBigRight} from "lucide-react";

type ExperienceBarProps = {
    xp: number
    lastSource: "slider" | "input" | null
    onSliderAction: (total: number, level: number, progress: number) => void
}

export default function ExperienceBar({ xp, lastSource, onSliderAction }: ExperienceBarProps) {
    const [value, setValue] = React.useState(0) // % bar
    const [level, setLevel] = React.useState(0)

    const [decreaseBtnDisabled, setDecreaseBtnDisabled] = React.useState<true | false>(false)

    const xpToLevel = (exp: number) => {
        if (exp >= 1508) {
            return ((325 / 18) + Math.sqrt((2 / 9) * (exp - (54215 / 72))))
        } else if (exp >= 353) {
            return (81 / 10) + Math.sqrt((2 / 5) * (exp - (7839 / 40)))
        } else {
            return Math.sqrt(exp + 9) - 3
        }
    }

    const levelToXp = (level: number) => {
        if (level >= 32) {
            return 4.5 * Math.pow(level, 2) - 162.5 * level + 2220
        } else if (level >= 17) {
            return 2.5 * Math.pow(level, 2) - 40.5 * level + 360
        } else {
            return Math.pow(level, 2) + 6 * level
        }
    }

    const xpToUI = React.useCallback((xpVal: number) => {
        const lvl = Math.floor(xpToLevel(xpVal))
        const currentLevelXp = levelToXp(lvl)
        const nextLevelXp = levelToXp(lvl + 1)
        return {
            level: lvl,
            percent: (xpVal - currentLevelXp) / (nextLevelXp - currentLevelXp)
        }
    }, [])

    const uiToXp = (levelVal: number, percentVal: number) => {
        let exp = levelToXp(levelVal)
        exp += (levelToXp(levelVal + 1) - exp) * percentVal
        return exp
    }

    const [isEditing, setIsEditing] = React.useState(false)

    React.useEffect(() => {
        if (!isEditing && lastSource !== "slider") {
            const ui = xpToUI(xp)
            setLevel(ui.level)
            setValue(ui.percent * 100)
        }
    }, [xp, lastSource, isEditing, xpToUI])


    const handleSlider = (v: number) => {
        const clamped = Math.min(v, 99.999)
        setValue(clamped)
        const newXp = uiToXp(level, clamped / 100)
        onSliderAction(newXp, level, clamped)
    }

    const handleInputChange = (val: string) => {
        setIsEditing(true)
        const num = Number(val || 0)
        setLevel(num)

        const newXp = uiToXp(num, value / 100)
        onSliderAction(newXp, num, value)
    }

    const handleInputBlur = () => {
        setIsEditing(false)
        const newXp = uiToXp(level, value / 100)
        onSliderAction(newXp, level, value)
    }

    return (
        <div className="relative select-none overflow-visible mx-auto flex flex-col items-center">
            <div className="flex items-center">
                <Button variant="outline" size="icon" disabled={decreaseBtnDisabled} onClick={() => {
                    if (level == 1) {
                        setDecreaseBtnDisabled(true)
                    }
                    handleInputChange((level - 1).toString())
                }}><ArrowBigLeft /></Button>
                <input
                    type="text"
                    value={level}
                    maxLength={5}
                    onFocus={() => setIsEditing(true)}
                    onBlur={handleInputBlur}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="font-minecraft text-center text-[clamp(12px,4vw,40px)] text-[#80ff20] bg-transparent border-none outline-none pointer-events-auto mx-5"
                    style={{
                        width: `${String(level).length || 1}ch`,
                        minWidth: "2ch",
                        textShadow: `
            -1px 0px 0px black,
            1px 0px 0px black,
            0px -1px 0px black,
            0px 1px 0px black
          `,
                    }}
                />
                <Button variant="outline" size="icon" onClick={() => {
                    if (decreaseBtnDisabled && level >= 0) {
                        setDecreaseBtnDisabled(false)
                    }
                    handleInputChange((level + 1).toString())
                }}><ArrowBigRight /></Button>
            </div>

            <div className="relative w-full">
                <Image
                    src="/images/experience/empty.png"
                    alt=""
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ imageRendering: "pixelated", width: "100%", height: "auto" }}
                />

                <div className="absolute left-0 top-0 h-full w-full overflow-hidden pointer-events-none">
                    <Image
                        src="/images/experience/filled.png"
                        alt=""
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{
                            imageRendering: "pixelated",
                            width: "100%",
                            height: "auto",
                            clipPath: `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`,
                        }}
                    />
                </div>

                <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => handleSlider(Number(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none h-[120%] flex items-center justify-center" style={{ left: `${value}%` }}>
                    <Image
                        src="/images/experience/dragger.png"
                        alt="thumb"
                        width={9}
                        height={9}
                        style={{ imageRendering: "pixelated", height: "100%", width: "auto", maxWidth: "none" }}
                    />
                </div>
            </div>
        </div>
    )
}
