import {StaircasingMode, ColorDistanceMethod, Brightness, getAllowedBrightnesses} from './utils';
import { getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import ditheringMethods from '../inputs/dithering.json';
import {getBaseY, getYRange, ProcessedImageResult} from './imageProcessing';

export type DitheringMethodName = keyof typeof ditheringMethods;
export const DitheringMethods = Object.fromEntries(
    Object.keys(ditheringMethods).map(key => [key, key])
) as Record<DitheringMethodName, DitheringMethodName>;

type DitheringMethodNone = {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'none';
};

type DitheringMethodErrorDiffusion = {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'error_diffusion';
    ditherMatrix: number[][];
    ditherDivisor: number;
    centerX: number;
    centerY: number;
};

type DitheringMethodOrdered = {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'ordered';
    ditherMatrix: number[][];
    ditherDivisor: number;
    centerX?: number;
    centerY?: number;
};

type DitheringMethodThreshold = {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'threshold';
    threshold: number;
};

type DitheringMethodStochastic = {
    uniqueId?: number;
    name: string;
    description: string;
    type: 'stochastic';
    noiseRange: number;
};

type DitheringMethod =
    | DitheringMethodNone
    | DitheringMethodErrorDiffusion
    | DitheringMethodOrdered
    | DitheringMethodThreshold
    | DitheringMethodStochastic;

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
            return applyOrderedDithering(
                imageData, width, height,
                enabledGroups, staircasingMode, colorMethod, method, maxHeight
            );
        case 'threshold':
            return applyThresholdDithering(
                imageData, width, height,
                enabledGroups, staircasingMode, colorMethod, method, maxHeight
            );
        case 'stochastic':
            return applyStochasticDithering(
                imageData, width, height,
                enabledGroups, staircasingMode, colorMethod, method, maxHeight
            );
        case 'error_diffusion':
        default:
            return applyErrorDiffusion(
                imageData, width, height,
                enabledGroups, staircasingMode, colorMethod,
                method as DitheringMethodErrorDiffusion, maxHeight
            );
    }
}

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
    const workingData = new Float32Array(width * height * 4);
    const outputData = new Uint8ClampedArray(imageData.data.length);

    for (let i = 0; i < imageData.data.length; i++) {
        workingData[i] = imageData.data[i];
        outputData[i] = imageData.data[i];
    }

    const baseY = getBaseY(staircasingMode, maxHeight);
    const yRange = getYRange(staircasingMode, maxHeight);

    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            const oldR = Math.max(0, Math.min(255, Math.round(workingData[idx])));
            const oldG = Math.max(0, Math.min(255, Math.round(workingData[idx + 1])));
            const oldB = Math.max(0, Math.min(255, Math.round(workingData[idx + 2])));

            const bestMatch = findBestMatch(
                colorMethod, staircasingMode,
                oldR, oldG, oldB,
                enabledGroups, yRange, z, currentY, baseY
            );

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);

                outputData[idx] = rgb.r;
                outputData[idx + 1] = rgb.g;
                outputData[idx + 2] = rgb.b;

                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                distributeError(
                    workingData, width, height, x, z,
                    oldR - rgb.r, oldG - rgb.g, oldB - rgb.b,
                    method
                );

                currentY = bestMatch.y;
            } else {
                outputData[idx] = 0;
                outputData[idx + 1] = 0;
                outputData[idx + 2] = 0;

                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
            }
        }
    }

    return {
        imageData: new ImageData(outputData, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

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
    const data = new Uint8ClampedArray(imageData.data);
    const baseY = getBaseY(staircasingMode, maxHeight);
    const yRange = getYRange(staircasingMode, maxHeight);

    const matrixHeight = method.ditherMatrix.length;
    const matrixWidth = method.ditherMatrix[0].length;
    const divisor = method.ditherDivisor;

    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            const matrixValue = method.ditherMatrix[z % matrixHeight][x % matrixWidth];
            const threshold = (matrixValue / divisor - 0.5) * 255;

            const oldR = Math.max(0, Math.min(255, data[idx] + threshold));
            const oldG = Math.max(0, Math.min(255, data[idx + 1] + threshold));
            const oldB = Math.max(0, Math.min(255, data[idx + 2] + threshold));

            const bestMatch = findBestMatch(
                colorMethod, staircasingMode,
                oldR, oldG, oldB,
                enabledGroups, yRange, z, currentY, baseY
            );

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);
                data[idx] = rgb.r;
                data[idx + 1] = rgb.g;
                data[idx + 2] = rgb.b;

                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                currentY = bestMatch.y;
            } else {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;

                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
            }
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

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
    const data = new Uint8ClampedArray(imageData.data);
    const baseY = getBaseY(staircasingMode, maxHeight);
    const yRange = getYRange(staircasingMode, maxHeight);

    const bias = (method.threshold - 0.5) * 255;

    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            const oldR = Math.max(0, Math.min(255, data[idx] + bias));
            const oldG = Math.max(0, Math.min(255, data[idx + 1] + bias));
            const oldB = Math.max(0, Math.min(255, data[idx + 2] + bias));

            const bestMatch = findBestMatch(
                colorMethod, staircasingMode,
                oldR, oldG, oldB,
                enabledGroups, yRange, z, currentY, baseY
            );

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);
                data[idx] = rgb.r;
                data[idx + 1] = rgb.g;
                data[idx + 2] = rgb.b;

                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                currentY = bestMatch.y;
            } else {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;

                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
            }
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

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
    const data = new Uint8ClampedArray(imageData.data);
    const baseY = getBaseY(staircasingMode, maxHeight);
    const yRange = getYRange(staircasingMode, maxHeight);

    const halfRange = (method.noiseRange / 2) * 255;

    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            const noise = (Math.random() - 0.5) * 2 * halfRange;

            const oldR = Math.max(0, Math.min(255, data[idx] + noise));
            const oldG = Math.max(0, Math.min(255, data[idx + 1] + noise));
            const oldB = Math.max(0, Math.min(255, data[idx + 2] + noise));

            const bestMatch = findBestMatch(
                colorMethod, staircasingMode,
                oldR, oldG, oldB,
                enabledGroups, yRange, z, currentY, baseY
            );

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);
                data[idx] = rgb.r;
                data[idx + 1] = rgb.g;
                data[idx + 2] = rgb.b;

                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                currentY = bestMatch.y;
            } else {
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;

                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
            }
        }
    }

    return {
        imageData: new ImageData(data, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

function findBestMatch(
    colorMethod: ColorDistanceMethod,
    staircasingMode: StaircasingMode,
    oldR: number,
    oldG: number,
    oldB: number,
    enabledGroups: Set<number>,
    yRange: { min: number; max: number },
    z: number,
    currentY: number,
    baseY: number
): { y: number; color: number; groupId: number; brightness: Brightness } | null {
    if (staircasingMode === StaircasingMode.NONE) {
        const result = findBestColorAtBrightness(
            oldR, oldG, oldB,
            enabledGroups,
            Brightness.NORMAL,
            colorMethod
        );
        return {
            y: 0,
            color: result.color,
            groupId: result.groupId,
            brightness: Brightness.NORMAL
        };
    }

    let bestMatch: { y: number; color: number; groupId: number; brightness: Brightness } | null = null;
    let bestDistance = Infinity;

    for (const groupId of enabledGroups) {
        const allowedBrightnesses = getAllowedBrightnesses(groupId);

        for (const brightness of allowedBrightnesses) {
            const targetY = (groupId === 11)
                ? currentY
                : calculateTargetY(brightness, z, currentY, baseY);

            if (targetY < yRange.min || targetY > yRange.max) continue;

            const result = findBestColorAtBrightness(
                oldR, oldG, oldB,
                new Set([groupId]),
                brightness,
                colorMethod
            );

            if (result.distance < bestDistance) {
                bestDistance = result.distance;
                bestMatch = {
                    y: targetY,
                    color: result.color,
                    groupId,
                    brightness
                };
            }
        }
    }

    return bestMatch;
}

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
    const matrix = method.ditherMatrix;
    const divisor = method.ditherDivisor;
    const centerX = method.centerX;
    const centerY = method.centerY;

    for (let dy = 0; dy < matrix.length; dy++) {
        for (let dx = 0; dx < matrix[dy].length; dx++) {
            const weight = matrix[dy][dx];
            if (weight === 0) continue;

            const newX = x + (dx - centerX);
            const newZ = z + (dy - centerY);

            if (newX >= 0 && newX < width && newZ >= 0 && newZ < height) {
                const newIdx = (newZ * width + newX) * 4;
                const factor = weight / divisor;

                data[newIdx] += errR * factor;
                data[newIdx + 1] += errG * factor;
                data[newIdx + 2] += errB * factor;
            }
        }
    }
}

function findBestColorAtBrightness(
    targetR: number,
    targetG: number,
    targetB: number,
    enabledGroups: Set<number>,
    brightness: Brightness,
    method: ColorDistanceMethod
): { color: number; distance: number; groupId: number } {
    let bestColor = 0;
    let bestDistance = Infinity;
    let bestGroupId = 0;

    for (const groupId of enabledGroups) {
        const colorNum = getColorWithBrightness(groupId, brightness);
        const rgb = numberToRGB(colorNum);

        const distance = calculateDistance(
            targetR, targetG, targetB,
            rgb.r, rgb.g, rgb.b,
            method
        );

        if (distance < bestDistance) {
            bestDistance = distance;
            bestColor = colorNum;
            bestGroupId = groupId;
        }
    }

    return { color: bestColor, distance: bestDistance, groupId: bestGroupId };
}

function calculateTargetY(
    brightness: Brightness,
    z: number,
    currentY: number,
    baseY: number
): number {
    const base = z === 0 ? baseY : currentY;
    if (brightness === Brightness.HIGH) return base + 1;
    if (brightness === Brightness.NORMAL) return base;
    return base - 1;
}

export { ditheringMethods };