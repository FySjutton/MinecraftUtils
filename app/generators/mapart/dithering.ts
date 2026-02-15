import {StaircasingMode, ColorDistanceMethod, Brightness, getAllowedBrightnesses} from './utils';
import { getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import ditheringMethods from './utils/dithering.json';
import {getBaseY, getYRange, ProcessedImageResult} from './imageProcessing';

export type DitheringMethodName = keyof typeof ditheringMethods;

interface DitheringMethod {
    uniqueId: number;
    name: string;
    description: string;
    type?: 'error_diffusion' | 'ordered';
    ditherMatrix: number[][];
    ditherDivisor?: number;
    centerX?: number;
    centerY?: number;
}

export function applyDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    ditheringMethod: DitheringMethodName
): ProcessedImageResult {
    const method = ditheringMethods[ditheringMethod] as DitheringMethod;

    if (method.type === 'ordered') {
        return applyOrderedDithering(
            imageData,
            width,
            height,
            enabledGroups,
            staircasingMode,
            colorMethod,
            method
        );
    } else {
        return applyErrorDiffusion(
            imageData,
            width,
            height,
            enabledGroups,
            staircasingMode,
            colorMethod,
            method
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
    method: DitheringMethod
): ProcessedImageResult {
    const data = new Uint8ClampedArray(imageData.data);
    const baseY = getBaseY(staircasingMode);
    const yRange = getYRange(staircasingMode);

    // Initialize maps
    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const oldR = Math.max(0, Math.min(255, Math.round(data[idx])));
            const oldG = Math.max(0, Math.min(255, Math.round(data[idx + 1])));
            const oldB = Math.max(0, Math.min(255, Math.round(data[idx + 2])));

            const bestMatch = findBestMatch(colorMethod, staircasingMode, oldR, oldG, oldB, enabledGroups, yRange, z, currentY, baseY);

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);
                data[idx] = rgb.r;
                data[idx + 1] = rgb.g;
                data[idx + 2] = rgb.b;

                // Store the block info in maps
                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                // Calculate and distribute error
                const errR = oldR - rgb.r;
                const errG = oldG - rgb.g;
                const errB = oldB - rgb.b;

                distributeError(
                    data,
                    width,
                    height,
                    x,
                    z,
                    errR,
                    errG,
                    errB,
                    method
                );

                currentY = bestMatch.y;
            } else {
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

function applyOrderedDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethod
): ProcessedImageResult {
    const data = new Uint8ClampedArray(imageData.data);
    const baseY = getBaseY(staircasingMode);
    const yRange = getYRange(staircasingMode);

    const matrixHeight = method.ditherMatrix.length;
    const matrixWidth = method.ditherMatrix[0].length;
    const divisor = method.ditherDivisor || 1;

    // Initialize maps
    const brightnessMap: Brightness[][] = Array(height).fill(0).map(() => Array(width));
    const groupIdMap: number[][] = Array(height).fill(0).map(() => Array(width));
    const yMap: number[][] = Array(height).fill(0).map(() => Array(width));

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            // Get threshold from Bayer matrix
            const matrixValue = method.ditherMatrix[z % matrixHeight][x % matrixWidth];
            const threshold = (matrixValue / divisor - 0.5) * 255;

            // Apply threshold to color
            const oldR = Math.max(0, Math.min(255, data[idx] + threshold));
            const oldG = Math.max(0, Math.min(255, data[idx + 1] + threshold));
            const oldB = Math.max(0, Math.min(255, data[idx + 2] + threshold));

            const bestMatch = findBestMatch(colorMethod, staircasingMode, oldR, oldG, oldB, enabledGroups, yRange, z, currentY, baseY);

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);
                data[idx] = rgb.r;
                data[idx + 1] = rgb.g;
                data[idx + 2] = rgb.b;

                // Store the block info in maps
                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                currentY = bestMatch.y;
            } else {
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
    let bestMatch: { y: number; color: number; groupId: number; brightness: Brightness } | null = null;

    if (staircasingMode === StaircasingMode.NONE) {
        const result = findBestColorAtBrightness(
            oldR, oldG, oldB,
            enabledGroups,
            Brightness.NORMAL,
            colorMethod
        );
        bestMatch = {
            y: 0,
            color: result.color,
            groupId: result.groupId,
            brightness: Brightness.NORMAL
        };
    } else {
        let bestDistance = Infinity;

        for (const groupId of enabledGroups) {
            const allowedBrightnesses = getAllowedBrightnesses(groupId);

            for (const brightness of allowedBrightnesses) {
                // Vatten (group 11) tar inte hänsyn till staircasing
                const targetY = (groupId === 11)
                    ? currentY
                    : calculateTargetY(brightness, z, currentY, baseY);

                if (targetY < yRange.min || targetY > yRange.max) {
                    continue;
                }

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
                        groupId: groupId,
                        brightness: brightness
                    };
                }
            }
        }
    }
    return bestMatch;
}

function distributeError(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    z: number,
    errR: number,
    errG: number,
    errB: number,
    method: DitheringMethod
): void {
    const matrix = method.ditherMatrix;
    const divisor = method.ditherDivisor || 16;
    const centerX = method.centerX || 0;
    const centerY = method.centerY || 0;

    for (let dy = 0; dy < matrix.length; dy++) {
        for (let dx = 0; dx < matrix[dy].length; dx++) {
            const weight = matrix[dy][dx];
            if (weight === 0) continue;

            const offsetX = dx - centerX;
            const offsetY = dy - centerY;

            const newX = x + offsetX;
            const newZ = z + offsetY;

            if (newX >= 0 && newX < width && newZ >= 0 && newZ < height) {
                const newIdx = (newZ * width + newX) * 4;
                const factor = weight / divisor;

                data[newIdx] = Math.max(0, Math.min(255, data[newIdx] + errR * factor));
                data[newIdx + 1] = Math.max(0, Math.min(255, data[newIdx + 1] + errG * factor));
                data[newIdx + 2] = Math.max(0, Math.min(255, data[newIdx + 2] + errB * factor));
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
    if (z === 0) {
        // First pixel - compare to virtual baseY
        if (brightness === Brightness.HIGH) return baseY + 1;
        if (brightness === Brightness.NORMAL) return baseY;
        return baseY - 1;
    } else {
        // Compare to previous pixel's Y
        if (brightness === Brightness.HIGH) return currentY + 1;
        if (brightness === Brightness.NORMAL) return currentY;
        return currentY - 1;
    }
}

export { ditheringMethods };