"use client"
import Image from 'next/image'

export function IconImage({name, size = 32}: { name: string, size?: number }) {
    return (
        <span className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <Image
                src={`/assets/icons/${name}.png`}
                alt={name}
                fill
                style={{ objectFit: 'contain' }}
                className="image-pixelated"
            />
        </span>
    )
}
