"use client"

import * as React from "react"
import Image from "next/image"

type ImageSliderProps = {
    xp: number
    xpChangeAction: (newXp: number) => void
}

export default function ImageSlider({ xp, xpChangeAction }: ImageSliderProps) {
    const [value, setValue] = React.useState(50) // % bar
    const [level, setLevel] = React.useState(1)

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
        if (!isEditing) {
            const ui = xpToUI(xp)
            setLevel(ui.level)
        }
    }, [xp, isEditing, xpToUI])

    const handleSlider = (v: number) => {
        const clamped = Math.min(v, 99.999) // never reach 100%
        setValue(clamped)
        const newXp = uiToXp(level, clamped / 100)
        xpChangeAction(newXp)
    }

    const handleInputChange = (val: string) => {
        setIsEditing(true)
        const num = Number(val || 0)
        setLevel(num)
    }

    const handleInputBlur = () => {
        setIsEditing(false)
        const newXp = uiToXp(level, value / 100)
        xpChangeAction(newXp)
    }

    return (
        <div className="relative w-[90%] select-none overflow-visible font-minecraft mx-auto flex flex-col items-center">

            <input
                type="text"
                value={level}
                maxLength={5}
                onFocus={() => setIsEditing(true)}
                onBlur={handleInputBlur}
                onChange={(e) => handleInputChange(e.target.value)}
                className="font-minecraft text-center text-[#80ff20] bg-transparent border-none outline-none pointer-events-auto"
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

                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none h-[120%] flex items-center justify-center"
                    style={{ left: `${value}%` }}
                >
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
