import { GLASS_COLORS, RGB, beaconColor, deltaE_lab_rgb } from './colorCalculator'

interface WorkerMessage {
    cmd: 'exhaustive'
    maxHeight: number
    targetHex: string
}

interface LengthResult {
    stack: RGB[]
    color: RGB
    dist: number
}

interface ProgressMessage {
    type: 'progress'
    checked: number
}

interface LengthResultMessage {
    type: 'lengthResult'
    length: number
    best: LengthResult
}

interface DoneMessage {
    type: 'done'
    bestPerLength: Record<number, LengthResult>
    checked: number
}

const COLOR_ENTRIES = Object.entries(GLASS_COLORS)

function hexToRgb(hex: string): RGB {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
}

self.onmessage = (ev: MessageEvent<WorkerMessage>) => {
    const data = ev.data

    if (data.cmd === 'exhaustive') {
        const maxHeight = data.maxHeight
        const target = hexToRgb(data.targetHex)
        let checked = 0
        const bestPerLength: Record<number, LengthResult> = {}

        function recurse(stack: RGB[]) {
            const len = stack.length
            if (len > 0) {
                const color = beaconColor(stack)
                const dist = deltaE_lab_rgb(target, color)
                const existing = bestPerLength[len]
                if (!existing || dist < existing.dist) {
                    bestPerLength[len] = { stack: [...stack], color, dist }
                    self.postMessage({ type: 'lengthResult', length: len, best: bestPerLength[len] } as LengthResultMessage)
                }
            }

            if (len === maxHeight) return

            for (const [_, rgb] of COLOR_ENTRIES) {
                recurse([...stack, rgb])
                checked++
                if (checked % 1000 === 0) {
                    self.postMessage({ type: 'progress', checked } as ProgressMessage)
                }
            }
        }

        try {
            recurse([])
        } catch (e) {
            console.error('Worker error', e)
        }

        self.postMessage({ type: 'done', bestPerLength, checked } as DoneMessage)
    }
}
