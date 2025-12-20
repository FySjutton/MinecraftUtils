export type RGB = [number, number, number]

function clamp(v: number, min = 0, max = 255) {
    return Math.min(max, Math.max(min, v))
}

function rgbToHex([r, g, b]: RGB): string {
    return (
        '#' +
        [r, g, b]
            .map(v => clamp(Math.round(v)).toString(16).padStart(2, '0'))
            .join('')
    )
}

function hslToRgb(h: number, s: number, l: number): RGB {
    s /= 100
    l /= 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2

    return hslHsbHelper(h, c, x, m)
}

function hsbToRgb(h: number, s: number, v: number): RGB {
    s /= 100
    v /= 100

    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c

    return hslHsbHelper(h, c, x, m)
}

function hslHsbHelper(h: number, c: number, x: number, m: number): RGB {
    let r: number, g: number, b: number

    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]

    return [
        (r + m) * 255,
        (g + m) * 255,
        (b + m) * 255
    ]
}

export function turnToHex(value: string): string | null {
    value = value.trim().toLowerCase()

    // HEX
    if (value.startsWith('#')) {
        return value
    }

    // RGB
    let m = value.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (m) {
        return rgbToHex([+m[1], +m[2], +m[3]])
    }

    // HSL
    m = value.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/)
    if (m) {
        const rgb = hslToRgb(+m[1], +m[2], +m[3])
        return rgbToHex(rgb)
    }

    // HSB / HSV
    m = value.match(/hsb\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/)
    if (m) {
        const rgb = hsbToRgb(+m[1], +m[2], +m[3])
        return rgbToHex(rgb)
    }

    return null
}
