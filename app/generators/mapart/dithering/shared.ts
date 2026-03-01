import {
    DitheringMethod,
    DitheringMethodErrorDiffusion
} from './types';
import { Brightness } from '../utils/types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from '../utils/constants';
import { getColorWithBrightness, numberToRGB } from '../color/matching';

export type BiasFunction = (x: number, z: number) => number;

export function createBiasFunction(method: DitheringMethod): BiasFunction | null {
    switch (method.type) {
        case 'ordered':
            return (x, z) =>
                (method.ditherMatrix[z % method.ditherMatrix.length][x % method.ditherMatrix[0].length]
                    / method.ditherDivisor - 0.5) * 255;

        case 'threshold':
            return () => (method.threshold - 0.5) * 255;

        case 'stochastic':
            return () => (Math.random() - 0.5) * method.noiseRange * 255;

        default:
            return null;
    }
}

export function distributeError(
    data: Float32Array,
    width: number,
    height: number,
    x: number,
    z: number,
    errR: number,
    errG: number,
    errB: number,
    method: DitheringMethodErrorDiffusion,
): void {
    const { ditherMatrix: matrix, ditherDivisor: divisor, centerX: cx, centerY: cy } = method;

    for (let dy = 0; dy < matrix.length; dy++) {
        for (let dx = 0; dx < matrix[dy].length; dx++) {
            const weight = matrix[dy][dx];
            if (weight === 0) continue;

            const nx = x + (dx - cx);
            const nz = z + (dy - cy);
            if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue;

            const ni = (nz * width + nx) * 4;
            const factor = weight / divisor;
            data[ni] += errR * factor;
            data[ni + 1] += errG * factor;
            data[ni + 2] += errB * factor;
        }
    }
}

export function clamp(v: number): number {
    return v < 0 ? 0 : v > 255 ? 255 : v;
}

export interface PaletteGamut {
    minR: number; maxR: number;
    minG: number; maxG: number;
    minB: number; maxB: number;
}

export function computeGamut(enabledGroups: Set<number>, brightness: Brightness): PaletteGamut {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;

    for (const groupId of enabledGroups) {
        if (groupId === TRANSPARENT_GROUP_ID) continue;
        const allowed = getAllowedBrightnesses(groupId);
        if (!allowed.includes(brightness)) continue;
        const { r, g, b } = numberToRGB(getColorWithBrightness(groupId, brightness));
        if (r < minR) minR = r; if (r > maxR) maxR = r;
        if (g < minG) minG = g; if (g > maxG) maxG = g;
        if (b < minB) minB = b; if (b > maxB) maxB = b;
    }

    if (minR > maxR) { minR = 0; maxR = 255; }
    if (minG > maxG) { minG = 0; maxG = 255; }
    if (minB > maxB) { minB = 0; maxB = 255; }

    return { minR, maxR, minG, maxG, minB, maxB };
}

export function buildAllGamuts(enabledGroups: Set<number>,): { high: PaletteGamut; normal: PaletteGamut; low: PaletteGamut } {
    return {
        high: computeGamut(enabledGroups, Brightness.HIGH),
        normal: computeGamut(enabledGroups, Brightness.NORMAL),
        low: computeGamut(enabledGroups, Brightness.LOW),
    };
}

export function clampToGamut(
    v: number,
    channel: 'r' | 'g' | 'b',
    gamut: PaletteGamut | null,
): number {
    if (!gamut) return clamp(v);
    const lo = channel === 'r' ? gamut.minR : channel === 'g' ? gamut.minG : gamut.minB;
    const hi = channel === 'r' ? gamut.maxR : channel === 'g' ? gamut.maxG : gamut.maxB;
    return v < lo ? lo : v > hi ? hi : v;
}

export function mulberry32(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
