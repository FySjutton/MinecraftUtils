import { AreaSettingsResolved, Brightness, ColorDistanceMethod, ProcessedImageResult, StaircasingMode } from './types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from './constants';
import { getColorWithBrightness, numberToRGB, findBestColorInSet, buildCandidates } from '../color/matching';
import { calculateDistance } from '../color/distance';
import { applyDithering } from '../dithering/buildable';
import { DitheringMethodName } from '../dithering/types';
import { getYRange, computeColumnY, finalizeColumnMixed } from '../staircasing/heights';

export function resolveEffective(
    x: number, z: number,
    areas: AreaSettingsResolved[],
    globalGroups: Set<number>, globalMode: StaircasingMode,
    globalColorMethod: ColorDistanceMethod, globalMaxHeight: number,
    globalYRange: { min: number; max: number },
) {
    for (const a of areas) {
        if (x >= a.px && x < a.px + a.pw && z >= a.py && z < a.py + a.ph) {
            return { enabledGroups: a.enabledGroups, mode: a.staircasingMode, colorMethod: a.colorMethod, maxHeight: a.maxHeight, yRange: a.yRange };
        }
    }
    return { enabledGroups: globalGroups, mode: globalMode, colorMethod: globalColorMethod, maxHeight: globalMaxHeight, yRange: globalYRange };
}

function isStandardMode(mode: StaircasingMode): boolean {
    return mode === StaircasingMode.STANDARD || mode === StaircasingMode.STANDARD_CUSTOM || mode === StaircasingMode.VALLEY_CUSTOM;
}

function recomputeBrightness(
    pixels: Uint8ClampedArray,
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    width: number,
    height: number,
): void {
    for (let z = 1; z < height; z++) {
        for (let x = 0; x < width; x++) {
            if (groupIdMap[z][x] === TRANSPARENT_GROUP_ID) continue;
            let northZ = z - 1;
            while (northZ >= 0 && groupIdMap[northZ][x] === TRANSPARENT_GROUP_ID) northZ--;
            if (northZ < 0) continue;
            const actual = yMap[z][x] > yMap[northZ][x] ? Brightness.HIGH
                : yMap[z][x] < yMap[northZ][x] ? Brightness.LOW
                : Brightness.NORMAL;
            const prev = brightnessMap[z][x];
            if (actual === prev) continue;
            brightnessMap[z][x] = actual;
            const idx = (z * width + x) * 4;
            const ratio = actual / prev;
            pixels[idx]   = Math.max(0, Math.min(255, Math.round(pixels[idx]   * ratio)));
            pixels[idx+1] = Math.max(0, Math.min(255, Math.round(pixels[idx+1] * ratio)));
            pixels[idx+2] = Math.max(0, Math.min(255, Math.round(pixels[idx+2] * ratio)));
        }
    }
}

export function processImageData(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number,
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const result = ditheringMethod != null && ditheringMethod !== 'none'
        ? applyDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, ditheringMethod, maxHeight, areas)
        : processWithoutDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, maxHeight, areas);

    if (areas.length > 0 && result.brightnessMap.length > 0) {
        recomputeBrightness(result.imageData.data, result.brightnessMap, result.groupIdMap, result.yMap, width, height);
    }

    return result;
}

function processWithoutDithering(
    sourceImageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number,
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const sourceData = sourceImageData.data;
    const resultData = new Uint8ClampedArray(sourceData.length);

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    const globalYRange = getYRange(staircasingMode, maxHeight);
    const hasAreas = areas.length > 0;

    const flatCandidates = buildCandidates(enabledGroups, () => [Brightness.NORMAL]);

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
                ? resolveEffective(x, z, areas, enabledGroups, staircasingMode, colorMethod, maxHeight, globalYRange)
                : { enabledGroups, mode: staircasingMode, colorMethod, maxHeight, yRange: globalYRange };

            if (hasAreas) {
                colMode.push(eff.mode);
                colMaxHeight.push(eff.maxHeight);
            }

            if (sourceData[idx + 3] < 128) {
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(TRANSPARENT_GROUP_ID);
                colYDirect.push(currentY);
                continue;
            }

            const r = sourceData[idx];
            const g = sourceData[idx + 1];
            const b = sourceData[idx + 2];

            if (eff.mode === StaircasingMode.NONE) {
                const candidates = hasAreas
                    ? buildCandidates(eff.enabledGroups, () => [Brightness.NORMAL])
                    : flatCandidates;
                const best = findBestColorInSet(r, g, b, candidates, eff.colorMethod);
                const rgb = numberToRGB(best.color);
                resultData[idx] = rgb.r; resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b; resultData[idx + 3] = 255;
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(best.groupId);
                colYDirect.push(currentY);
                continue;
            }

            const isStd = isStandardMode(eff.mode);
            let bestDistance = Infinity;
            let bestBrightness = Brightness.NORMAL;
            let bestGroupId = -1;

            for (const groupId of eff.enabledGroups) {
                for (const brightness of getAllowedBrightnesses(groupId)) {
                    if (isStd && groupId !== 11) {
                        const delta = brightness === Brightness.HIGH ? 1 : brightness === Brightness.LOW ? -1 : 0;
                        const nextY = currentY + delta;
                        if (nextY < eff.yRange.min || nextY > eff.yRange.max) continue;
                    }
                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb = numberToRGB(colorNum);
                    const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, eff.colorMethod);
                    if (dist < bestDistance) {
                        bestDistance = dist;
                        bestBrightness = brightness;
                        bestGroupId = groupId;
                    }
                }
            }

            if (bestGroupId === -1) {
                bestGroupId = [...eff.enabledGroups][0];
                bestBrightness = Brightness.NORMAL;
            }

            colBrightness.push(bestBrightness);
            colGroupId.push(bestGroupId);

            if (isStd && bestGroupId !== 11) {
                if (bestBrightness === Brightness.HIGH) currentY++;
                else if (bestBrightness === Brightness.LOW) currentY--;
            }
            colYDirect.push(currentY);

            const colorNum = getColorWithBrightness(bestGroupId, bestBrightness);
            const rgb = numberToRGB(colorNum);
            resultData[idx] = rgb.r; resultData[idx + 1] = rgb.g;
            resultData[idx + 2] = rgb.b; resultData[idx + 3] = 255;
        }

        if (hasAreas) {
            finalizeColumnMixed(x, height, colBrightness, colGroupId, colMode, colMaxHeight, brightnessMap, groupIdMap, yMap);
        } else {
            const isValley = staircasingMode === StaircasingMode.VALLEY;
            const colY = isValley
                ? computeColumnY(colBrightness, colGroupId, staircasingMode, maxHeight)
                : colYDirect;

            const minY = Math.min(...colY);
            for (let z = 0; z < height; z++) {
                brightnessMap[z][x] = colBrightness[z];
                groupIdMap[z][x] = colGroupId[z];
                yMap[z][x] = colY[z] - minY;
            }
        }
    }

    return { imageData: new ImageData(resultData, width, height), brightnessMap, groupIdMap, yMap };
}
