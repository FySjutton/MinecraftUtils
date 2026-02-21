import {
    DitheringMethod,
    DitheringMethodErrorDiffusion
} from './types';

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