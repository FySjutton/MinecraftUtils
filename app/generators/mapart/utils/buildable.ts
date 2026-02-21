import { Brightness, ColorDistanceMethod, ProcessedImageResult, StaircasingMode } from '../utils/types';
import { getAllowedBrightnesses } from '../utils/constants';
import { getColorWithBrightness, numberToRGB, findBestColorInSet, buildCandidates } from '../color/matching';
import { calculateDistance } from '../color/distance';
import { applyDithering } from '../dithering/buildable';
import { DitheringMethodName } from '../dithering/types';
import { getYRange, computeColumnY } from '../staircasing/heights';

export function processImageData(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number,
): ProcessedImageResult {
    const hasDithering = ditheringMethod != null && ditheringMethod !== 'none';

    if (hasDithering) {
        return applyDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, ditheringMethod, maxHeight);
    }

    return processWithoutDithering(imageData, width, height, enabledGroups, staircasingMode, colorMethod, maxHeight);
}

function processWithoutDithering(
    sourceImageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number,
): ProcessedImageResult {
    const sourceData = sourceImageData.data;
    const resultData = new Uint8ClampedArray(sourceData.length);

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    const yRange = getYRange(staircasingMode, maxHeight);
    const isLimited = staircasingMode !== StaircasingMode.NONE;
    const isValley = staircasingMode === StaircasingMode.VALLEY || staircasingMode === StaircasingMode.VALLEY_CUSTOM;

    const flatCandidates = buildCandidates(enabledGroups, () => [Brightness.NORMAL]);

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId: number[] = [];
        const colYDirect: number[] = [];
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const r = sourceData[idx];
            const g = sourceData[idx + 1];
            const b = sourceData[idx + 2];
            const a = sourceData[idx + 3];

            if (staircasingMode === StaircasingMode.NONE) {
                const best = findBestColorInSet(r, g, b, flatCandidates, colorMethod);
                const rgb = numberToRGB(best.color);
                resultData[idx] = rgb.r; resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b; resultData[idx + 3] = a;
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(best.groupId);
                colYDirect.push(0);
                continue;
            }

            let bestDistance = Infinity;
            let bestBrightness = Brightness.NORMAL;
            let bestGroupId = 0;

            for (const groupId of enabledGroups) {
                for (const brightness of getAllowedBrightnesses(groupId)) {
                    if (isLimited && groupId !== 11) {
                        const delta = brightness === Brightness.HIGH ? 1 : brightness === Brightness.LOW ? -1 : 0;
                        const nextY = currentY + delta;
                        if (nextY < yRange.min || nextY > yRange.max) continue;
                    }

                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb = numberToRGB(colorNum);
                    const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, colorMethod);

                    if (dist < bestDistance) {
                        bestDistance = dist;
                        bestBrightness = brightness;
                        bestGroupId = groupId;
                    }
                }
            }

            if (isLimited && bestGroupId !== 11) {
                if (bestBrightness === Brightness.HIGH) currentY++;
                else if (bestBrightness === Brightness.LOW) currentY--;
            }

            colBrightness.push(bestBrightness);
            colGroupId.push(bestGroupId);
            colYDirect.push(currentY);

            const colorNum = getColorWithBrightness(bestGroupId, bestBrightness);
            const rgb = numberToRGB(colorNum);
            resultData[idx] = rgb.r; resultData[idx + 1] = rgb.g;
            resultData[idx + 2] = rgb.b; resultData[idx + 3] = a;
        }

        const colY = isValley
            ? computeColumnY(colBrightness, colGroupId, staircasingMode)
            : colYDirect;

        const minY = Math.min(...colY);
        for (let z = 0; z < height; z++) {
            brightnessMap[z][x] = colBrightness[z];
            groupIdMap[z][x] = colGroupId[z];
            yMap[z][x] = colY[z] - minY;
        }
    }

    return { imageData: new ImageData(resultData, width, height), brightnessMap, groupIdMap, yMap };
}