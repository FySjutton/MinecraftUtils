import { Brightness, ColorDistanceMethod, StaircasingMode } from '../utils/types';
import { getAllowedBrightnesses } from '../utils/constants';
import { numberToRGB, findBestColorInSet, ColorCandidate, BestColorResult } from '../color/matching';
import { createBiasFunction, distributeError, clamp, BiasFunction } from './shared';
import { DitheringMethodName, DitheringMethodErrorDiffusion, ditheringMethods } from './types';
import { getYRange, finalizeColumn } from '../staircasing/heights';
import type { ProcessedImageResult } from '../utils/types';

function getCandidatesForPixel(
    enabledGroups: Set<number>,
    currentY: number,
    yRange: { min: number; max: number },
    isLimited: boolean,
): ColorCandidate[] {
    const candidates: ColorCandidate[] = [];
    for (const groupId of enabledGroups) {
        for (const brightness of getAllowedBrightnesses(groupId)) {
            if (isLimited && groupId !== 11) {
                const delta = brightness === Brightness.HIGH ? 1 : brightness === Brightness.LOW ? -1 : 0;
                const nextY = currentY + delta;
                if (nextY < yRange.min || nextY > yRange.max) continue;
            }
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
    const isLimited = staircasingMode !== StaircasingMode.NONE;

    if (staircasingMode === StaircasingMode.NONE) {
        const candidates = [...enabledGroups].map(groupId => ({ groupId, brightness: Brightness.NORMAL }));
        return findBestColorInSet(r, g, b, candidates, colorMethod);
    }

    const candidates = getCandidatesForPixel(enabledGroups, currentY, yRange, isLimited);
    return findBestColorInSet(r, g, b, candidates, colorMethod);
}

function advanceY(currentY: number, brightness: Brightness, groupId: number, mode: StaircasingMode): number {
    if (mode === StaircasingMode.NONE || groupId === 11) return currentY;
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
            const bias = getBias(x, z);
            const r = clamp(data[idx] + bias);
            const g = clamp(data[idx + 1] + bias);
            const b = clamp(data[idx + 2] + bias);

            const best = findBestForPixel(r, g, b, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);
            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b;

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colYDirect.push(currentY);
        }

        finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, brightnessMap, groupIdMap, yMap, colYDirect);
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
): ProcessedImageResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
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
            const oldR = clamp(Math.round(workingData[idx]));
            const oldG = clamp(Math.round(workingData[idx + 1]));
            const oldB = clamp(Math.round(workingData[idx + 2]));

            const best = findBestForPixel(oldR, oldG, oldB, enabledGroups, colorMethod, staircasingMode, currentY, yRange);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g;
            outputData[idx + 2] = rgb.b; outputData[idx + 3] = imageData.data[idx + 3];

            if (method.ditherMatrix) {
                distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);
            }

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, staircasingMode);
            colYDirect.push(currentY);
        }

        finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, brightnessMap, groupIdMap, yMap, colYDirect);
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
        return applyBiasDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, getBias);
    }
    return applyErrorDiffusion(
        imageData, width, height, enabledGroups, staircasingMode, colorMethod,
        yRange, method as DitheringMethodErrorDiffusion,
    );
}