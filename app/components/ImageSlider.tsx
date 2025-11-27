"use client"

import * as React from "react"
import Image from "next/image"

export default function ImageSlider() {
    const [value, setValue] = React.useState(50)
    const [level, setLevel] = React.useState(1)

    return (
        <div
            className="relative w-[90%] select-none overflow-visible font-minecraft mx-auto flex flex-col items-center">

            <input
                type="text"
                value={level}
                maxLength={5}
                onChange={(e) => setLevel(e.target.value === "" ? 0 : Number.parseInt(e.target.value))}
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
                {/* Empty background */}
                <Image
                    src="/images/experience/empty.png"
                    alt=""
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{imageRendering: "pixelated", width: "100%", height: "auto"}}
                />

                {/* Filled image */}
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
                            WebkitClipPath: `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`,
                        }}
                    />
                </div>

                {/* Invisible range input */}
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />

                {/* Thumb */}
                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none h-[120%] flex items-center justify-center"
                    style={{left: `${value}%`}}
                >
                    <Image
                        src="/images/experience/dragger.png"
                        alt="thumb"
                        width={9}
                        height={9}
                        style={{imageRendering: "pixelated", height: "100%", width: "auto", maxWidth: "none"}}
                    />
                </div>
            </div>
        </div>
    )
}
