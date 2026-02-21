import ditheringMethodsJson from '../inputs/dithering.json';

export interface DitheringMethodNone {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'none';
}

export interface DitheringMethodErrorDiffusion {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'error_diffusion';
    ditherMatrix: number[][];
    ditherDivisor: number;
    centerX: number;
    centerY: number;
}

export interface DitheringMethodOrdered {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'ordered';
    ditherMatrix: number[][];
    ditherDivisor: number;
}

export interface DitheringMethodThreshold {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'threshold';
    threshold: number;
}

export interface DitheringMethodStochastic {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'stochastic';
    noiseRange: number;
}

export type DitheringMethod =
    | DitheringMethodNone
    | DitheringMethodErrorDiffusion
    | DitheringMethodOrdered
    | DitheringMethodThreshold
    | DitheringMethodStochastic;

export const ditheringMethods = ditheringMethodsJson as Record<string, DitheringMethod>;

export type DitheringMethodName = keyof typeof ditheringMethodsJson;

export const DitheringMethods = Object.fromEntries(
    Object.keys(ditheringMethodsJson).map(k => [k, k]),
) as Record<DitheringMethodName, DitheringMethodName>;