import { StaircasingMode, ColorDistanceMethod, Brightness, getAllowedBrightnesses } from './utils';
import { getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import ditheringMethods from '../inputs/dithering.json';
import { getYRange, ProcessedImageResult, computeColumnY } from './imageProcessing';

export type DitheringMethodName = keyof typeof ditheringMethods;
export const DitheringMethods = Object.fromEntries(
    Object.keys(ditheringMethods).map(key => [key, key])
) as Record<DitheringMethodName, DitheringMethodName>;

type DitheringMethodNone = { uniqueId?: number; name: string; description: string; type: 'none' };
type DitheringMethodErrorDiffusion = { uniqueId?: number; name: string; description: string; type: 'error_diffusion'; ditherMatrix: number[][]; ditherDivisor: number; centerX: number; centerY: number };
type DitheringMethodOrdered = { uniqueId?: number; name: string; description: string; type: 'ordered'; ditherMatrix: number[][]; ditherDivisor: number; centerX?: number; centerY?: number };
type DitheringMethodThreshold = { uniqueId?: number; name: string; description: string; type: 'threshold'; threshold: number };
type DitheringMethodStochastic = { uniqueId?: number; name: string; description: string; type: 'stochastic'; noiseRange: number };
type DitheringMethod = DitheringMethodNone | DitheringMethodErrorDiffusion | DitheringMethodOrdered | DitheringMethodThreshold | DitheringMethodStochastic;

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
    const yRange = getYRange(staircasingMode, maxHeight);

    if (method.type === 'error_diffusion' || method.type === 'none') {
        return applyErrorDiffusion(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, method as DitheringMethodErrorDiffusion);
    }

    const getBias: (x: number, z: number) => number =
        method.type === 'ordered'
            ? (x, z) => (method.ditherMatrix[z % method.ditherMatrix.length][x % method.ditherMatrix[0].length] / method.ditherDivisor - 0.5) * 255
            : method.type === 'threshold'
                ? () => (method.threshold - 0.5) * 255
                : () => (Math.random() - 0.5) * method.noiseRange * 255;

    return applyBiasDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, getBias);
}

function findBestColor(
    r: number, g: number, b: number,
    enabledGroups: Set<number>,
    colorMethod: ColorDistanceMethod,
    staircasingMode: StaircasingMode,
    currentY: number,
    yRange: { min: number; max: number }
): { brightness: Brightness; groupId: number; color: number } {
    if (staircasingMode === StaircasingMode.NONE) {
        return findBestAtBrightness(r, g, b, enabledGroups, Brightness.NORMAL, colorMethod);
    }

    let bestDistance = Infinity, bestBrightness = Brightness.NORMAL, bestGroupId = 0, bestColor = 0;

    for (const groupId of enabledGroups) {
        for (const brightness of getAllowedBrightnesses(groupId)) {
            if (groupId !== 11) {
                const delta = brightness === Brightness.HIGH ? 1 : brightness === Brightness.LOW ? -1 : 0;
                const nextY = currentY + delta;
                if (nextY < yRange.min || nextY > yRange.max) continue;
            }

            const colorNum = getColorWithBrightness(groupId, brightness);
            const rgb = numberToRGB(colorNum);
            const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, colorMethod);

            if (dist < bestDistance) {
                bestDistance = dist; bestBrightness = brightness; bestGroupId = groupId; bestColor = colorNum;
            }
        }
    }

    return { brightness: bestBrightness, groupId: bestGroupId, color: bestColor };
}

function findBestAtBrightness(
    r: number, g: number, b: number,
    enabledGroups: Set<number>,
    brightness: Brightness,
    method: ColorDistanceMethod
): { brightness: Brightness; groupId: number; color: number } {
    let bestColor = 0, bestDist = Infinity, bestGroupId = 0;

    for (const groupId of enabledGroups) {
        const colorNum = getColorWithBrightness(groupId, brightness);
        const rgb = numberToRGB(colorNum);
        const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);
        if (dist < bestDist) { bestDist = dist; bestColor = colorNum; bestGroupId = groupId; }
    }

    return { brightness, groupId: bestGroupId, color: bestColor };
}

function advanceY(currentY: number, brightness: Brightness, groupId: number, staircasingMode: StaircasingMode): number {
    if (staircasingMode === StaircasingMode.NONE || groupId === 11) return currentY;
    if (brightness === Brightness.HIGH) return currentY + 1;
    if (brightness === Brightness.LOW) return currentY - 1;
    return currentY;
}

function buildOutputMaps(width: number, height: number) {
    return {
        brightnessMap: Array.from({ length: height }, () => new Array<Brightness>(width)),
        groupIdMap: Array.from({ length: height }, () => new Array<number>(width)),
        yMap: Array.from({ length: height }, () => new Array<number>(width)),
    };
}

function finalizeColumn(
    x: number, height: number,
    colBrightness: Brightness[], colGroupId: number[],
    staircasingMode: StaircasingMode,
    yRange: { min: number; max: number },
    brightnessMap: Brightness[][], groupIdMap: number[][], yMap: number[][],
    colYDirect?: number[]
): void {
    const isValley = staircasingMode === StaircasingMode.VALLEY || staircasingMode === StaircasingMode.VALLEY_CUSTOM;
    const colY = isValley
        ? computeColumnY(colBrightness, colGroupId, staircasingMode)
        : (colYDirect ?? computeColumnY(colBrightness, colGroupId, staircasingMode));
    const minY = Math.min(...colY);
    for (let z = 0; z < height; z++) {
        brightnessMap[z][x] = colBrightness[z];
        groupIdMap[z][x] = colGroupId[z];
        yMap[z][x] = colY[z] - minY;
    }
}

function applyBiasDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    yRange: { min: number; max: number },
    getBias: (x: number, z: number) => number
): ProcessedImageResult {
    const data = new Uint8ClampedArray(imageData.data);
    const { brightnessMap, groupIdMap, yMap } = buildOutputMaps(width, height);

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId: number[] = [];
        const colYDirect: number[] = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const bias = getBias(x, z);

            const r = Math.max(0, Math.min(255, data[idx] + bias));
            const g = Math.max(0, Math.min(255, data[idx + 1] + bias));
            const b = Math.max(0, Math.min(255, data[idx + 2] + bias));

            const best = findBestColor(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);

            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b;

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colYDirect.push(currentY);
        }

        finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, yRange, brightnessMap, groupIdMap, yMap, colYDirect);
    }

    return { imageData: new ImageData(data, width, height), brightnessMap, groupIdMap, yMap };
}

function applyErrorDiffusion(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    yRange: { min: number; max: number },
    method: DitheringMethodErrorDiffusion
): ProcessedImageResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    const { brightnessMap, groupIdMap, yMap } = buildOutputMaps(width, height);

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId: number[] = [];
        const colYDirect: number[] = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const oldR = Math.max(0, Math.min(255, Math.round(workingData[idx])));
            const oldG = Math.max(0, Math.min(255, Math.round(workingData[idx + 1])));
            const oldB = Math.max(0, Math.min(255, Math.round(workingData[idx + 2])));

            const best = findBestColor(oldR, oldG, oldB, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g; outputData[idx + 2] = rgb.b;
            outputData[idx + 3] = imageData.data[idx + 3];

            if (method.ditherMatrix) {
                distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);
            }

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colYDirect.push(currentY);
        }

        finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, yRange, brightnessMap, groupIdMap, yMap, colYDirect);
    }

    return { imageData: new ImageData(outputData, width, height), brightnessMap, groupIdMap, yMap };
}

function distributeError(
    data: Float32Array,
    width: number, height: number,
    x: number, z: number,
    errR: number, errG: number, errB: number,
    method: DitheringMethodErrorDiffusion
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

export { ditheringMethods };