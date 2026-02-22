import { Brightness, ColorDistanceMethod, StaircasingMode } from '../utils/types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from '../utils/constants';
import { numberToRGB, findBestColorInSet, ColorCandidate, BestColorResult } from '../color/matching';
import { createBiasFunction, distributeError, clamp, BiasFunction } from './shared';
import { DitheringMethodName, DitheringMethodErrorDiffusion, ditheringMethods } from './types';
import { getYRange, finalizeColumn } from '../staircasing/heights';
import type { ProcessedImageResult } from '../utils/types';

function isStandardMode(mode: StaircasingMode): boolean {
    return (
        mode === StaircasingMode.STANDARD ||
        mode === StaircasingMode.STANDARD_CUSTOM ||
        mode === StaircasingMode.VALLEY_CUSTOM
    );
}

function getCandidatesForPixel(
    enabledGroups: Set<number>,
    currentY: number,
    yRange: { min: number; max: number },
): ColorCandidate[] {
    const candidates: ColorCandidate[] = [];
    for (const groupId of enabledGroups) {
        for (const brightness of getAllowedBrightnesses(groupId)) {
            if (groupId !== 11) {
                const delta = brightness === Brightness.HIGH ? 1 : brightness === Brightness.LOW ? -1 : 0;
                const nextY = currentY + delta;
                if (nextY < yRange.min || nextY > yRange.max) continue;
            }
            candidates.push({ groupId, brightness });
        }
    }
    return candidates;
}

function getAllCandidates(enabledGroups: Set<number>): ColorCandidate[] {
    const candidates: ColorCandidate[] = [];
    for (const groupId of enabledGroups) {
        for (const brightness of getAllowedBrightnesses(groupId)) {
            candidates.push({ groupId, brightness });
        }
    }
    return candidates;
}

function findBestForPixel(
    r: number, g: number, b: number,
    enabledGroups: Set<number>,
    colorMethod: ColorDistanceMethod,
    staircasingMode: StaircasingMode,
    currentY: number,
    yRange: { min: number; max: number },
): BestColorResult {
    if (staircasingMode === StaircasingMode.NONE) {
        const candidates = [...enabledGroups].map(groupId => ({ groupId, brightness: Brightness.NORMAL }));
        return findBestColorInSet(r, g, b, candidates, colorMethod);
    }
    if (isStandardMode(staircasingMode)) {
        return findBestColorInSet(r, g, b, getCandidatesForPixel(enabledGroups, currentY, yRange), colorMethod);
    }
    return findBestColorInSet(r, g, b, getAllCandidates(enabledGroups), colorMethod);
}

function advanceY(currentY: number, brightness: Brightness, groupId: number, mode: StaircasingMode): number {
    if (!isStandardMode(mode) || groupId === 11 || groupId === TRANSPARENT_GROUP_ID) return currentY;
    if (brightness === Brightness.HIGH) return currentY + 1;
    if (brightness === Brightness.LOW) return currentY - 1;
    return currentY;
}

function applyBiasDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    yRange: { min: number; max: number },
    getBias: BiasFunction,
    maxHeight: number,
): ProcessedImageResult {
    const data = new Uint8ClampedArray(imageData.data);
    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId: number[] = [];
        const colYDirect: number[] = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            if (data[idx + 3] < 128) {
                data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 0;
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(TRANSPARENT_GROUP_ID);
                colYDirect.push(currentY);
                continue;
            }

            const bias = getBias(x, z);
            const r = clamp(data[idx] + bias);
            const g = clamp(data[idx + 1] + bias);
            const b = clamp(data[idx + 2] + bias);

            const best = findBestForPixel(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);
            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b; data[idx + 3] = 255;

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colYDirect.push(currentY);
        }

        finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, brightnessMap, groupIdMap, yMap, colYDirect, maxHeight);
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
    method: DitheringMethodErrorDiffusion,
    maxHeight: number,
): ProcessedImageResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    const currentYPerColumn = new Array(width).fill(0);
    const colBrightnessAll: Brightness[][] = Array.from({ length: width }, () => []);
    const colGroupIdAll: number[][] = Array.from({ length: width }, () => []);
    const colYDirectAll: number[][] = Array.from({ length: width }, () => []);

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const idx = (z * width + x) * 4;
            const currentY = currentYPerColumn[x];

            if (imageData.data[idx + 3] < 128) {
                colBrightnessAll[x].push(Brightness.NORMAL);
                colGroupIdAll[x].push(TRANSPARENT_GROUP_ID);
                colYDirectAll[x].push(currentY);
                continue;
            }

            const oldR = clamp(Math.round(workingData[idx]));
            const oldG = clamp(Math.round(workingData[idx + 1]));
            const oldB = clamp(Math.round(workingData[idx + 2]));

            const best = findBestForPixel(oldR, oldG, oldB, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g;
            outputData[idx + 2] = rgb.b; outputData[idx + 3] = 255;

            if (method.ditherMatrix) {
                distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);
            }

            currentYPerColumn[x] = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colBrightnessAll[x].push(best.brightness);
            colGroupIdAll[x].push(best.groupId);
            colYDirectAll[x].push(currentYPerColumn[x]);
        }
    }

    for (let x = 0; x < width; x++) {
        finalizeColumn(x, height, colBrightnessAll[x], colGroupIdAll[x], staircasingMode, brightnessMap, groupIdMap, yMap, colYDirectAll[x], maxHeight);
    }

    return { imageData: new ImageData(outputData, width, height), brightnessMap, groupIdMap, yMap };
}

export function applyDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    ditheringMethod: DitheringMethodName,
    maxHeight: number,
): ProcessedImageResult {
    const method = ditheringMethods[ditheringMethod];
    const yRange = getYRange(staircasingMode, maxHeight);
    const getBias = createBiasFunction(method);

    if (getBias) {
        return applyBiasDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, getBias, maxHeight);
    }
    return applyErrorDiffusion(
        imageData, width, height, enabledGroups, staircasingMode, colorMethod,
        yRange, method as DitheringMethodErrorDiffusion, maxHeight,
    );
}