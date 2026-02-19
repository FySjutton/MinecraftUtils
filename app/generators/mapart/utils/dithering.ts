import { StaircasingMode, ColorDistanceMethod, Brightness, getAllowedBrightnesses } from './utils';
import { getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import ditheringMethods from '../inputs/dithering.json';
import { getYRange, ProcessedImageResult, computeColumnY } from './imageProcessing';

export type DitheringMethodName = keyof typeof ditheringMethods;
export const DitheringMethods = Object.fromEntries(
    Object.keys(ditheringMethods).map(key => [key, key])
) as Record<DitheringMethodName, DitheringMethodName>;

// ---------------------------------------------------------------------------
// Dithering method type definitions
// ---------------------------------------------------------------------------

type DitheringMethodNone = {
    uniqueId?: number; name: string; description: string;
    type: 'none';
};

type DitheringMethodErrorDiffusion = {
    uniqueId?: number; name: string; description: string;
    type: 'error_diffusion';
    ditherMatrix: number[][];
    ditherDivisor: number;
    centerX: number;
    centerY: number;
};

type DitheringMethodOrdered = {
    uniqueId?: number; name: string; description: string;
    type: 'ordered';
    ditherMatrix: number[][];
    ditherDivisor: number;
    centerX?: number;
    centerY?: number;
};

type DitheringMethodThreshold = {
    uniqueId?: number; name: string; description: string;
    type: 'threshold';
    threshold: number;
};

type DitheringMethodStochastic = {
    uniqueId?: number; name: string; description: string;
    type: 'stochastic';
    noiseRange: number;
};

type DitheringMethod =
    | DitheringMethodNone
    | DitheringMethodErrorDiffusion
    | DitheringMethodOrdered
    | DitheringMethodThreshold
    | DitheringMethodStochastic;

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function applyDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    ditheringMethod: DitheringMethodName,
    maxHeight: number
): ProcessedImageResult {
    const method = ditheringMethods[ditheringMethod] as DitheringMethod;

    switch (method.type) {
        case 'ordered':
            return applyOrderedDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, method, maxHeight);
        case 'threshold':
            return applyThresholdDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, method, maxHeight);
        case 'stochastic':
            return applyStochasticDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, method, maxHeight);
        case 'error_diffusion':
        default:
            return applyErrorDiffusion(imageData, width, height, enabledGroups, staircasingMode, colorMethod, method as DitheringMethodErrorDiffusion, maxHeight);
    }
}

// ---------------------------------------------------------------------------
// Shared colour-matching helper
// ---------------------------------------------------------------------------

/**
 * Pick the best (groupId, brightness, color) for a pixel given adjusted RGB.
 *
 * For STANDARD and VALLEY modes no Y constraints are applied during matching —
 * the brightness sequence is used to compute Y in a post-column pass.
 * For VALLEY_CUSTOM the hard [0, maxHeight] limit is enforced here via
 * currentY.
 */
function findBestColor(
    r: number,
    g: number,
    b: number,
    enabledGroups: Set<number>,
    colorMethod: ColorDistanceMethod,
    staircasingMode: StaircasingMode,
    currentY: number,
    yRange: { min: number; max: number }
): { brightness: Brightness; groupId: number; color: number } {

    if (staircasingMode === StaircasingMode.NONE) {
        // Flat map: only NORMAL brightness considered
        return findBestAtBrightness(r, g, b, enabledGroups, Brightness.NORMAL, colorMethod);
    }

    let bestDistance  = Infinity;
    let bestBrightness = Brightness.NORMAL;
    let bestGroupId    = 0;
    let bestColor      = 0;

    for (const groupId of enabledGroups) {
        for (const brightness of getAllowedBrightnesses(groupId)) {

            // VALLEY_CUSTOM: hard Y-range check using the running tracker
            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && groupId !== 11) {
                const delta = brightness === Brightness.HIGH ?  1
                    : brightness === Brightness.LOW  ? -1 : 0;
                const nextY = currentY + delta;
                if (nextY < yRange.min || nextY > yRange.max) continue;
            }

            const colorNum = getColorWithBrightness(groupId, brightness);
            const rgb      = numberToRGB(colorNum);
            const dist     = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, colorMethod);

            if (dist < bestDistance) {
                bestDistance   = dist;
                bestBrightness = brightness;
                bestGroupId    = groupId;
                bestColor      = colorNum;
            }
        }
    }

    return { brightness: bestBrightness, groupId: bestGroupId, color: bestColor };
}

/** Find the best groupId for a fixed brightness level. */
function findBestAtBrightness(
    r: number,
    g: number,
    b: number,
    enabledGroups: Set<number>,
    brightness: Brightness,
    method: ColorDistanceMethod
): { brightness: Brightness; groupId: number; color: number } {
    let bestColor    = 0;
    let bestDist     = Infinity;
    let bestGroupId  = 0;

    for (const groupId of enabledGroups) {
        const colorNum = getColorWithBrightness(groupId, brightness);
        const rgb      = numberToRGB(colorNum);
        const dist     = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);
        if (dist < bestDist) {
            bestDist    = dist;
            bestColor   = colorNum;
            bestGroupId = groupId;
        }
    }

    return { brightness, groupId: bestGroupId, color: bestColor };
}

// ---------------------------------------------------------------------------
// Error diffusion
// ---------------------------------------------------------------------------

function applyErrorDiffusion(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethodErrorDiffusion,
    maxHeight: number
): ProcessedImageResult {
    // workingData carries accumulated floating-point error across the pass.
    const workingData = new Float32Array(imageData.data.length);
    const outputData  = new Uint8ClampedArray(imageData.data.length);

    for (let i = 0; i < imageData.data.length; i++) {
        workingData[i] = imageData.data[i];
    }

    const yRange       = getYRange(staircasingMode, maxHeight);
    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap:    number[][]      = Array.from({ length: height }, () => new Array(width));
    const yMap:          number[][]      = Array.from({ length: height }, () => new Array(width));

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId:    number[]     = [];

        let currentY = 0; // VALLEY_CUSTOM constraint tracker only

        for (let z = 0; z < height; z++) {
            const idx  = (z * width + x) * 4;
            const oldR = Math.max(0, Math.min(255, Math.round(workingData[idx])));
            const oldG = Math.max(0, Math.min(255, Math.round(workingData[idx + 1])));
            const oldB = Math.max(0, Math.min(255, Math.round(workingData[idx + 2])));

            const best = findBestColor(oldR, oldG, oldB, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb  = numberToRGB(best.color);

            outputData[idx]     = rgb.r;
            outputData[idx + 1] = rgb.g;
            outputData[idx + 2] = rgb.b;
            outputData[idx + 3] = imageData.data[idx + 3];

            distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);

            brightnessMap[z][x] = best.brightness;
            groupIdMap[z][x]    = best.groupId;
            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);

            // Advance VALLEY_CUSTOM Y tracker
            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && best.groupId !== 11) {
                if (best.brightness === Brightness.HIGH) currentY++;
                else if (best.brightness === Brightness.LOW) currentY--;
            }
        }

        // Post-column: compute normalised Y (+ valley segment normalisation)
        const colY = computeColumnY(colBrightness, colGroupId, staircasingMode);
        for (let z = 0; z < height; z++) {
            yMap[z][x] = colY[z];
        }
    }

    return {
        imageData: new ImageData(outputData, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

// ---------------------------------------------------------------------------
// Error distribution
// ---------------------------------------------------------------------------

function distributeError(
    data: Float32Array,
    width: number,
    height: number,
    x: number,
    z: number,
    errR: number,
    errG: number,
    errB: number,
    method: DitheringMethodErrorDiffusion
): void {
    const matrix  = method.ditherMatrix;
    const divisor = method.ditherDivisor;
    const cx      = method.centerX;
    const cy      = method.centerY;

    for (let dy = 0; dy < matrix.length; dy++) {
        for (let dx = 0; dx < matrix[dy].length; dx++) {
            const weight = matrix[dy][dx];
            if (weight === 0) continue;

            const nx = x + (dx - cx);
            const nz = z + (dy - cy);
            if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue;

            const ni     = (nz * width + nx) * 4;
            const factor = weight / divisor;
            data[ni]     += errR * factor;
            data[ni + 1] += errG * factor;
            data[ni + 2] += errB * factor;
        }
    }
}

// ---------------------------------------------------------------------------
// Ordered dithering
// ---------------------------------------------------------------------------

function applyOrderedDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethodOrdered,
    maxHeight: number
): ProcessedImageResult {
    const data     = new Uint8ClampedArray(imageData.data);
    const yRange   = getYRange(staircasingMode, maxHeight);
    const mH       = method.ditherMatrix.length;
    const mW       = method.ditherMatrix[0].length;
    const divisor  = method.ditherDivisor;

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap:    number[][]      = Array.from({ length: height }, () => new Array(width));
    const yMap:          number[][]      = Array.from({ length: height }, () => new Array(width));

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId:    number[]     = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx       = (z * width + x) * 4;
            const matVal    = method.ditherMatrix[z % mH][x % mW];
            const threshold = (matVal / divisor - 0.5) * 255;

            const r = Math.max(0, Math.min(255, data[idx]     + threshold));
            const g = Math.max(0, Math.min(255, data[idx + 1] + threshold));
            const b = Math.max(0, Math.min(255, data[idx + 2] + threshold));

            const best = findBestColor(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb  = numberToRGB(best.color);

            data[idx]     = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;

            brightnessMap[z][x] = best.brightness;
            groupIdMap[z][x]    = best.groupId;
            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);

            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && best.groupId !== 11) {
                if (best.brightness === Brightness.HIGH) currentY++;
                else if (best.brightness === Brightness.LOW) currentY--;
            }
        }

        const colY = computeColumnY(colBrightness, colGroupId, staircasingMode);
        for (let z = 0; z < height; z++) {
            yMap[z][x] = colY[z];
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

// ---------------------------------------------------------------------------
// Threshold dithering
// ---------------------------------------------------------------------------

function applyThresholdDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethodThreshold,
    maxHeight: number
): ProcessedImageResult {
    const data   = new Uint8ClampedArray(imageData.data);
    const yRange = getYRange(staircasingMode, maxHeight);
    const bias   = (method.threshold - 0.5) * 255;

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap:    number[][]      = Array.from({ length: height }, () => new Array(width));
    const yMap:          number[][]      = Array.from({ length: height }, () => new Array(width));

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId:    number[]     = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            const r = Math.max(0, Math.min(255, data[idx]     + bias));
            const g = Math.max(0, Math.min(255, data[idx + 1] + bias));
            const b = Math.max(0, Math.min(255, data[idx + 2] + bias));

            const best = findBestColor(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb  = numberToRGB(best.color);

            data[idx]     = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;

            brightnessMap[z][x] = best.brightness;
            groupIdMap[z][x]    = best.groupId;
            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);

            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && best.groupId !== 11) {
                if (best.brightness === Brightness.HIGH) currentY++;
                else if (best.brightness === Brightness.LOW) currentY--;
            }
        }

        const colY = computeColumnY(colBrightness, colGroupId, staircasingMode);
        for (let z = 0; z < height; z++) {
            yMap[z][x] = colY[z];
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

// ---------------------------------------------------------------------------
// Stochastic dithering
// ---------------------------------------------------------------------------

function applyStochasticDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethodStochastic,
    maxHeight: number
): ProcessedImageResult {
    const data      = new Uint8ClampedArray(imageData.data);
    const yRange    = getYRange(staircasingMode, maxHeight);
    const halfRange = (method.noiseRange / 2) * 255;

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap:    number[][]      = Array.from({ length: height }, () => new Array(width));
    const yMap:          number[][]      = Array.from({ length: height }, () => new Array(width));

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId:    number[]     = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx   = (z * width + x) * 4;
            const noise = (Math.random() - 0.5) * 2 * halfRange;

            const r = Math.max(0, Math.min(255, data[idx]     + noise));
            const g = Math.max(0, Math.min(255, data[idx + 1] + noise));
            const b = Math.max(0, Math.min(255, data[idx + 2] + noise));

            const best = findBestColor(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb  = numberToRGB(best.color);

            data[idx]     = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;

            brightnessMap[z][x] = best.brightness;
            groupIdMap[z][x]    = best.groupId;
            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);

            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && best.groupId !== 11) {
                if (best.brightness === Brightness.HIGH) currentY++;
                else if (best.brightness === Brightness.LOW) currentY--;
            }
        }

        const colY = computeColumnY(colBrightness, colGroupId, staircasingMode);
        for (let z = 0; z < height; z++) {
            yMap[z][x] = colY[z];
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

export { ditheringMethods };