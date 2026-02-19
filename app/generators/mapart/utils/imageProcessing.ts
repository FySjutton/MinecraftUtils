import { findNearestMapColor, getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import {Brightness, ColorDistanceMethod, getAllowedBrightnesses, StaircasingMode} from './utils';
import { applyDithering, DitheringMethodName } from './dithering';

const MAX_WORLD_HEIGHT = 384;

export function getBaseY(mode: StaircasingMode, maxHeight: number = 0): number {
    switch (mode) {
        case StaircasingMode.NONE:
            return 0;
        case StaircasingMode.STANDARD:
            return 0;
        case StaircasingMode.VALLEY:
            return 1;
        case StaircasingMode.VALLEY_CUSTOM:
            return Math.floor(maxHeight / 2);
        default:
            return 0;
    }
}

export function getYRange(
    mode: StaircasingMode,
    maxHeight: number
): { min: number; max: number } {
    if (mode === StaircasingMode.NONE) {
        return { min: 0, max: 0 };
    }

    if (mode === StaircasingMode.VALLEY_CUSTOM) {
        return { min: 0, max: Math.min(maxHeight, MAX_WORLD_HEIGHT - 1) };
    }

    return { min: -192, max: 191 };
}

export interface ProcessedImageResult {
    imageData: ImageData;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
}

const NO_DITHERING_KEY: DitheringMethodName = 'none';

export function processImageDataDirect(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number
): ProcessedImageResult {
    const shouldApplyDithering =
        ditheringMethod != null &&
        (ditheringMethod as string) !== '' &&
        ditheringMethod !== NO_DITHERING_KEY;

    if (shouldApplyDithering) {
        return applyDithering(
            imageData, width, height,
            enabledGroups, staircasingMode, colorMethod,
            ditheringMethod, maxHeight
        );
    } else {
        return processWithoutDithering(
            imageData, width, height,
            enabledGroups, staircasingMode, colorMethod,
            maxHeight
        );
    }
}

function processWithoutDithering(
    sourceImageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number
): ProcessedImageResult {
    const sourceData = sourceImageData.data;
    const resultData = new Uint8ClampedArray(sourceData.length);

    const baseY = getBaseY(staircasingMode, maxHeight);
    const yRange = getYRange(staircasingMode, maxHeight);

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
                    enabledGroups, false, colorMethod
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

            for (const groupId of enabledGroups) {
                const allowedBrightnesses = getAllowedBrightnesses(groupId);

                for (const brightness of allowedBrightnesses) {
                    let targetY: number;

                    if (groupId === 11) {
                        targetY = currentY;
                    } else {
                        const base = z === 0 ? baseY : currentY;
                        if (brightness === Brightness.HIGH) targetY = base + 1;
                        else if (brightness === Brightness.NORMAL) targetY = base;
                        else                          targetY = base - 1;
                    }

                    if (targetY < yRange.min || targetY > yRange.max) continue;

                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb = numberToRGB(colorNum);

                    const distance = calculateDistance(
                        targetR, targetG, targetB,
                        rgb.r, rgb.g, rgb.b,
                        colorMethod
                    );

                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = { y: targetY, color: colorNum, groupId, brightness };
                    }
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