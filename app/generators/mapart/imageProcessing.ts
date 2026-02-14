import { findNearestMapColor, getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import { Brightness, ColorDistanceMethod, StaircasingMode } from './utils';
import { applyDithering, DitheringMethodName } from './dithering';

function getBaseY(mode: StaircasingMode): number {
    switch (mode) {
        case StaircasingMode.NONE:
            return 0;
        case StaircasingMode.STANDARD:
            return 0;
        case StaircasingMode.VALLEY:
        case StaircasingMode.VALLEY_3_LEVEL:
            return 1;
        default:
            return 0;
    }
}

function getYRange(mode: StaircasingMode): { min: number; max: number } {
    switch (mode) {
        case StaircasingMode.NONE:
            return { min: 0, max: 0 };
        case StaircasingMode.STANDARD:
            return { min: -1000, max: 1000 };
        case StaircasingMode.VALLEY:
            return { min: -1000, max: 1000 };
        case StaircasingMode.VALLEY_3_LEVEL:
            return { min: 0, max: 2 };
        default:
            return { min: 0, max: 0 };
    }
}

export interface ProcessedImageResult {
    imageData: ImageData;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
}

export function processImage(
    sourceImage: HTMLImageElement,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod
): ProcessedImageResult {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(sourceImage, 0, 0, width, height);
    const sourceImageData = ctx.getImageData(0, 0, width, height);

    const shouldApplyDithering = ditheringMethod !== 'None' &&
        ditheringMethod !== null &&
        ditheringMethod !== undefined &&
        String(ditheringMethod) !== 'None';

    if (shouldApplyDithering) {
        return applyDithering(
            sourceImageData,
            width,
            height,
            enabledGroups,
            staircasingMode,
            colorMethod,
            ditheringMethod
        );
    } else {
        return processWithoutDithering(
            sourceImageData,
            width,
            height,
            enabledGroups,
            staircasingMode,
            colorMethod
        );
    }
}

function processWithoutDithering(
    sourceImageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod
): ProcessedImageResult {
    console.log('[MapArt] processWithoutDithering - NO DITHERING APPLIED');

    const sourceData = sourceImageData.data;
    const resultData = new Uint8ClampedArray(sourceData.length);

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

            const targetR = sourceData[idx];
            const targetG = sourceData[idx + 1];
            const targetB = sourceData[idx + 2];
            const targetA = sourceData[idx + 3];

            if (staircasingMode === StaircasingMode.NONE) {
                const result = findNearestMapColor(
                    targetR, targetG, targetB,
                    enabledGroups,
                    false,
                    colorMethod
                );
                const rgb = numberToRGB(result.color);

                resultData[idx] = rgb.r;
                resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b;
                resultData[idx + 3] = targetA;

                brightnessMap[z][x] = result.brightness;
                groupIdMap[z][x] = result.groupId;
                yMap[z][x] = 0;
                continue;
            }

            let bestMatch: {
                y: number;
                color: number;
                groupId: number;
                brightness: Brightness;
            } | null = null;
            let bestDistance = Infinity;

            for (const brightness of [Brightness.HIGH, Brightness.NORMAL, Brightness.LOW]) {
                let targetY: number;

                if (z === 0) {
                    if (brightness === Brightness.HIGH) {
                        targetY = baseY + 1;
                    } else if (brightness === Brightness.NORMAL) {
                        targetY = baseY;
                    } else {
                        targetY = baseY - 1;
                    }
                } else {
                    if (brightness === Brightness.HIGH) {
                        targetY = currentY + 1;
                    } else if (brightness === Brightness.NORMAL) {
                        targetY = currentY;
                    } else {
                        targetY = currentY - 1;
                    }
                }

                if (targetY < yRange.min || targetY > yRange.max) {
                    continue;
                }

                let minDistance = Infinity;
                let bestColor = 0;
                let bestGroupId = 0;

                for (const groupId of enabledGroups) {
                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb = numberToRGB(colorNum);

                    const distance = calculateDistance(
                        targetR, targetG, targetB,
                        rgb.r, rgb.g, rgb.b,
                        colorMethod
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        bestColor = colorNum;
                        bestGroupId = groupId;
                    }
                }

                if (minDistance < bestDistance) {
                    bestDistance = minDistance;
                    bestMatch = {
                        y: targetY,
                        color: bestColor,
                        groupId: bestGroupId,
                        brightness: brightness
                    };
                }
            }

            if (bestMatch) {
                const rgb = numberToRGB(bestMatch.color);

                resultData[idx] = rgb.r;
                resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b;
                resultData[idx + 3] = targetA;

                brightnessMap[z][x] = bestMatch.brightness;
                groupIdMap[z][x] = bestMatch.groupId;
                yMap[z][x] = bestMatch.y;

                currentY = bestMatch.y;
            } else {
                resultData[idx] = 0;
                resultData[idx + 1] = 0;
                resultData[idx + 2] = 0;
                resultData[idx + 3] = targetA;

                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
            }
        }
    }

    return {
        imageData: new ImageData(resultData, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}

export function extractBrightnessMap(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode
): { brightnessMap: Brightness[][], groupIdMap: number[][], yMap: number[][] } {
    const data = imageData.data;
    const brightnessMap: Brightness[][] = [];
    const groupIdMap: number[][] = [];
    const yMap: number[][] = [];

    for (let z = 0; z < height; z++) {
        brightnessMap[z] = [];
        groupIdMap[z] = [];
        yMap[z] = [];
    }

    const baseY = getBaseY(staircasingMode);

    for (let x = 0; x < width; x++) {
        let currentY = baseY;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            let found = false;
            let foundGroupId = 0;
            let foundBrightness = Brightness.NORMAL;

            for (const brightness of [Brightness.HIGH, Brightness.NORMAL, Brightness.LOW]) {
                for (const groupId of enabledGroups) {
                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb = numberToRGB(colorNum);

                    if (rgb.r === r && rgb.g === g && rgb.b === b) {
                        foundGroupId = groupId;
                        foundBrightness = brightness;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            if (!found) {
                brightnessMap[z][x] = Brightness.NORMAL;
                groupIdMap[z][x] = 0;
                yMap[z][x] = currentY;
                continue;
            }

            brightnessMap[z][x] = foundBrightness;
            groupIdMap[z][x] = foundGroupId;

            if (staircasingMode === StaircasingMode.NONE) {
                yMap[z][x] = 0;
            } else {
                if (z === 0) {
                    if (foundBrightness === Brightness.HIGH) {
                        currentY = baseY + 1;
                    } else if (foundBrightness === Brightness.NORMAL) {
                        currentY = baseY;
                    } else {
                        currentY = baseY - 1;
                    }
                } else {
                    if (foundBrightness === Brightness.HIGH) {
                        currentY = currentY + 1;
                    } else if (foundBrightness === Brightness.LOW) {
                        currentY = currentY - 1;
                    }
                    // NORMAL keeps currentY the same
                }
                yMap[z][x] = currentY;
            }
        }
    }

    return { brightnessMap, groupIdMap, yMap };
}

export function countUniqueColors(imageData: ImageData): number {
    const data = imageData.data;
    const colors = new Set<string>();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        colors.add(`${r},${g},${b}`);
    }

    return colors.size;
}