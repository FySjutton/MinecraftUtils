"use client"
import Image from "next/image"
import React from "react"

export function IconImage({ name, size }: { name: string, size?: number }) {
    return (
        <span className="flex items-center shrink-0" style={{ width: size, height: size }}>
            <Image
                src={`/assets/icons/${name}.png`}
                alt={name}
                width={size}
                height={size}
                className="object-contain image-pixelated"
            />
        </span>
    )
}
