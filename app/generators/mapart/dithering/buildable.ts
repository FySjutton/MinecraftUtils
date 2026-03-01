import { Brightness, ColorDistanceMethod, StaircasingMode, AreaSettingsResolved } from '../utils/types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from '../utils/constants';
import { numberToRGB, findBestColorInSet, ColorCandidate, BestColorResult } from '../color/matching';
import { createBiasFunction, distributeError, clamp, clampToGamut, buildAllGamuts, BiasFunction, PaletteGamut } from './shared';
import { DitheringMethodName, DitheringMethodErrorDiffusion, ditheringMethods } from './types';
import { getYRange, finalizeColumn, finalizeColumnMixed } from '../staircasing/heights';
import type { ProcessedImageResult } from '../utils/types';
import {resolveEffective} from "@/app/generators/mapart/utils/buildable";

function isStandardMode(mode: StaircasingMode): boolean {
    return (
        mode === StaircasingMode.STANDARD ||
        mode === StaircasingMode.SOUTHLINE ||
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
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const data = new Uint8ClampedArray(imageData.data);
    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const hasAreas = areas.length > 0;

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId: number[] = [];
        const colYDirect: number[] = [];
        const colMode: StaircasingMode[] = [];
        const colMaxHeight: number[] = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const eff = hasAreas
                ? resolveEffective(x, z, areas, enabledGroups, staircasingMode, colorMethod, maxHeight, yRange)
                : { enabledGroups, mode: staircasingMode, colorMethod, maxHeight, yRange };

            if (hasAreas) {
                colMode.push(eff.mode);
                colMaxHeight.push(eff.maxHeight);
            }

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

            const best = findBestForPixel(r, g, b, eff.enabledGroups, eff.colorMethod, eff.mode, currentY, eff.yRange);
            const rgb = numberToRGB(best.color);
            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b; data[idx + 3] = 255;

            colBrightness.push(best.brightness);
            colGroupId.push(best.groupId);
            currentY = advanceY(currentY, best.brightness, best.groupId, eff.mode);
            colYDirect.push(currentY);
        }

        if (hasAreas) {
            finalizeColumnMixed(x, height, colBrightness, colGroupId, colMode, colMaxHeight, brightnessMap, groupIdMap, yMap);
        } else {
            finalizeColumn(x, height, colBrightness, colGroupId, staircasingMode, brightnessMap, groupIdMap, yMap, colYDirect, maxHeight);
        }
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
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const hasAreas = areas.length > 0;

    const gamuts = buildAllGamuts(enabledGroups, colorMethod);
    const gamutByBrightness: Record<number, PaletteGamut> = {
        [Brightness.HIGH]: gamuts.high,
        [Brightness.NORMAL]: gamuts.normal,
        [Brightness.LOW]: gamuts.low,
    };

    const currentYPerColumn = new Array(width).fill(0);
    const colBrightnessAll: Brightness[][] = Array.from({ length: width }, () => []);
    const colGroupIdAll: number[][] = Array.from({ length: width }, () => []);
    const colYDirectAll: number[][] = Array.from({ length: width }, () => []);
    const colModeAll: StaircasingMode[][] = hasAreas ? Array.from({ length: width }, () => []) : [];
    const colMaxHeightAll: number[][] = hasAreas ? Array.from({ length: width }, () => []) : [];

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const idx = (z * width + x) * 4;
            const currentY = currentYPerColumn[x];
            const eff = hasAreas
                ? resolveEffective(x, z, areas, enabledGroups, staircasingMode, colorMethod, maxHeight, yRange)
                : { enabledGroups, mode: staircasingMode, colorMethod, maxHeight, yRange };

            if (hasAreas) {
                colModeAll[x].push(eff.mode);
                colMaxHeightAll[x].push(eff.maxHeight);
            }

            if (imageData.data[idx + 3] < 128) {
                colBrightnessAll[x].push(Brightness.NORMAL);
                colGroupIdAll[x].push(TRANSPARENT_GROUP_ID);
                colYDirectAll[x].push(currentY);
                continue;
            }

            // Clamp working data to palette gamut (use NORMAL gamut as default estimate)
            const gamut = gamutByBrightness[Brightness.NORMAL] ?? null;
            const oldR = Math.round(clampToGamut(workingData[idx], 'r', gamut));
            const oldG = Math.round(clampToGamut(workingData[idx + 1], 'g', gamut));
            const oldB = Math.round(clampToGamut(workingData[idx + 2], 'b', gamut));

            const best = findBestForPixel(oldR, oldG, oldB, eff.enabledGroups, eff.colorMethod, eff.mode, currentY, eff.yRange);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g;
            outputData[idx + 2] = rgb.b; outputData[idx + 3] = 255;

            if (method.ditherMatrix) {
                distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);
            }

            currentYPerColumn[x] = advanceY(currentY, best.brightness, best.groupId, eff.mode);
            colBrightnessAll[x].push(best.brightness);
            colGroupIdAll[x].push(best.groupId);
            colYDirectAll[x].push(currentYPerColumn[x]);
        }
    }

    for (let x = 0; x < width; x++) {
        if (hasAreas) {
            finalizeColumnMixed(x, height, colBrightnessAll[x], colGroupIdAll[x], colModeAll[x], colMaxHeightAll[x], brightnessMap, groupIdMap, yMap);
        } else {
            finalizeColumn(x, height, colBrightnessAll[x], colGroupIdAll[x], staircasingMode, brightnessMap, groupIdMap, yMap, colYDirectAll[x], maxHeight);
        }
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
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const method = ditheringMethods[ditheringMethod];
    const yRange = getYRange(staircasingMode, maxHeight);

    if (method.type === 'riemersma') {
        const { applyRiemersmaDithering } = require('./riemersma') as typeof import('./riemersma');
        return applyRiemersmaDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, maxHeight, method, areas);
    }

    const getBias = createBiasFunction(method);

    if (getBias) {
        return applyBiasDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, yRange, getBias, maxHeight, areas);
    }
    return applyErrorDiffusion(
        imageData, width, height, enabledGroups, staircasingMode, colorMethod,
        yRange, method as DitheringMethodErrorDiffusion, maxHeight, areas,
    );
}