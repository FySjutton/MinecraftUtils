import {calculateDistance, findNearestMapColor, getColorWithBrightness, numberToRGB} from './colorMatching';
import {Brightness, ColorDistanceMethod, getAllowedBrightnesses, StaircasingMode} from './utils';
import {applyDithering, DitheringMethodName} from './dithering';

const MAX_WORLD_HEIGHT = 384;

export function getYRange(
    mode: StaircasingMode,
    maxHeight?: number
): { min: number; max: number } {
    if (mode === StaircasingMode.NONE) return { min: 0, max: 0 };
    if (mode === StaircasingMode.VALLEY_CUSTOM || mode === StaircasingMode.STANDARD_CUSTOM) {
        return { min: 0, max: maxHeight != null && maxHeight > 0 ? maxHeight : MAX_WORLD_HEIGHT };
    }
    return { min: 0, max: MAX_WORLD_HEIGHT - 1 };
}

export interface ProcessedImageResult {
    imageData: ImageData;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
}

function solveMinimalHeights(signs: number[]): number[] {
    const n = signs.length + 1;
    type Edge = [number, number, number];
    const edges: Edge[] = [];

    for (let i = 0; i < signs.length; i++) {
        const s = signs[i];
        if (s === 1) {
            edges.push([i, i + 1, 1]);
        } else if (s === 0) {
            edges.push([i, i + 1, 0]);
            edges.push([i + 1, i, 0]);
        } else {
            edges.push([i + 1, i, 1]);
        }
    }

    for (let i = 0; i < n; i++) edges.push([n, i, 0]);

    const dist = new Array(n + 1).fill(0);

    for (let iter = 0; iter < n; iter++) {
        let updated = false;
        for (const [u, v, w] of edges) {
            if (dist[u] + w > dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;
    }

    const result = dist.slice(0, n);
    const minVal = Math.min(...result);
    return result.map(v => v - minVal);
}

export function computeColumnY(
    brightnesses: Brightness[],
    groupIds: number[],
    mode: StaircasingMode
): number[] {
    const n = brightnesses.length;
    if (n === 0) return [];
    if (mode === StaircasingMode.NONE) return new Array(n).fill(0);

    if (
        mode === StaircasingMode.VALLEY ||
        mode === StaircasingMode.VALLEY_CUSTOM ||
        mode === StaircasingMode.STANDARD_CUSTOM
    ) {
        const signs: number[] = [];
        for (let i = 0; i < n - 1; i++) {
            if (groupIds[i + 1] === 11) {
                signs.push(0);
            } else {
                const b = brightnesses[i + 1];
                signs.push(b === Brightness.HIGH ? 1 : b === Brightness.LOW ? -1 : 0);
            }
        }
        return solveMinimalHeights(signs);
    }

    let y = 0;
    const rawY: number[] = [];
    for (let i = 0; i < n; i++) {
        if (groupIds[i] !== 11) {
            if (brightnesses[i] === Brightness.HIGH) y++;
            else if (brightnesses[i] === Brightness.LOW) y--;
        }
        rawY.push(y);
    }

    const globalMin = Math.min(0, ...rawY);
    return rawY.map(v => v - globalMin);
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
    }
    return processWithoutDithering(
        imageData, width, height,
        enabledGroups, staircasingMode, colorMethod,
        maxHeight
    );
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

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    const yRange = getYRange(staircasingMode, maxHeight);
    const isLimited = staircasingMode !== StaircasingMode.NONE;

    const isValley = staircasingMode === StaircasingMode.VALLEY || staircasingMode === StaircasingMode.VALLEY_CUSTOM;

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
                const result = findNearestMapColor(r, g, b, enabledGroups, false, colorMethod);
                const rgb = numberToRGB(result.color);
                resultData[idx] = rgb.r;
                resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b;
                resultData[idx + 3] = a;
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(result.groupId);
                colYDirect.push(0);
                continue;
            }

            let bestDistance = Infinity;
            let bestBrightness = Brightness.NORMAL;
            let bestGroupId = 0;

            for (const groupId of enabledGroups) {
                for (const brightness of getAllowedBrightnesses(groupId)) {

                    if (isLimited && groupId !== 11) {
                        const delta = brightness === Brightness.HIGH ? 1
                            : brightness === Brightness.LOW ? -1 : 0;
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
            resultData[idx] = rgb.r;
            resultData[idx + 1] = rgb.g;
            resultData[idx + 2] = rgb.b;
            resultData[idx + 3] = a;
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

    return {
        imageData: new ImageData(resultData, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}