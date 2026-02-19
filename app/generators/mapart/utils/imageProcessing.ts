import { findNearestMapColor, getColorWithBrightness, numberToRGB, calculateDistance } from './colorMatching';
import { Brightness, ColorDistanceMethod, getAllowedBrightnesses, StaircasingMode } from './utils';
import { applyDithering, DitheringMethodName } from './dithering';

const MAX_WORLD_HEIGHT = 384;

export function getBaseY(_mode: StaircasingMode, _maxHeight: number = 0): number {
    // Y always starts at 0. Column normalisation guarantees all values remain non-negative.
    return 0;
}

export function getYRange(
    mode: StaircasingMode,
    maxHeight: number
): { min: number; max: number } {
    if (mode === StaircasingMode.NONE) return { min: 0, max: 0 };
    if (mode === StaircasingMode.VALLEY_CUSTOM) return { min: 0, max: Math.min(maxHeight, MAX_WORLD_HEIGHT - 1) };
    return { min: 0, max: MAX_WORLD_HEIGHT - 1 };
}

export interface ProcessedImageResult {
    imageData: ImageData;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
}

// ---------------------------------------------------------------------------
// Core Y computation
// ---------------------------------------------------------------------------

/**
 * Compute the Y positions for one image column from its brightness / groupId
 * sequences.
 *
 * STANDARD / VALLEY_CUSTOM:
 *   Accumulate raw Y (HIGH → +1, LOW → -1, NORMAL → 0).
 *   Group 11 (water) never changes Y.
 *   Shift the whole column so its global minimum is 0 (no negatives ever).
 *
 * VALLEY:
 *   HIGH → y++, NORMAL → y unchanged, LOW → y = 0 (snap back to floor).
 *   Group 11 never changes Y.
 *   This produces clean sawtooth ramps with no floating intermediate blocks.
 */
export function computeColumnY(
    brightnesses: Brightness[],
    groupIds: number[],
    mode: StaircasingMode
): number[] {
    const n = brightnesses.length;
    if (n === 0) return [];
    if (mode === StaircasingMode.NONE) return new Array(n).fill(0);

    // ── VALLEY: direct snap-to-zero on LOW ──────────────────────────────────
    if (mode === StaircasingMode.VALLEY) {
        let y = 0;
        const result: number[] = [];
        for (let i = 0; i < n; i++) {
            if (groupIds[i] !== 11) {
                if (brightnesses[i] === Brightness.HIGH)       y++;
                else if (brightnesses[i] === Brightness.LOW)   y = 0;
                // NORMAL → y unchanged
            }
            result.push(y);
        }
        return result;
    }

    // ── STANDARD / VALLEY_CUSTOM: accumulate then shift to non-negative ──────
    let y = 0;
    const rawY: number[] = [];
    for (let i = 0; i < n; i++) {
        if (groupIds[i] !== 11) {
            if (brightnesses[i] === Brightness.HIGH)     y++;
            else if (brightnesses[i] === Brightness.LOW) y--;
        }
        rawY.push(y);
    }

    // Shift so the global minimum lands at 0
    const globalMin = Math.min(0, ...rawY);
    return rawY.map(v => v - globalMin);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Non-dithered processing
// ---------------------------------------------------------------------------

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
    const groupIdMap:    number[][]      = Array.from({ length: height }, () => new Array(width));
    const yMap:          number[][]      = Array.from({ length: height }, () => new Array(width));

    const yRange = getYRange(staircasingMode, maxHeight);

    for (let x = 0; x < width; x++) {
        const colBrightness: Brightness[] = [];
        const colGroupId:    number[]     = [];

        // currentY is only used to enforce the hard Y limit in VALLEY_CUSTOM.
        let currentY = 0;

        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const r = sourceData[idx];
            const g = sourceData[idx + 1];
            const b = sourceData[idx + 2];
            const a = sourceData[idx + 3];

            // ── NONE: flat map ─────────────────────────────────────────────
            if (staircasingMode === StaircasingMode.NONE) {
                const result = findNearestMapColor(r, g, b, enabledGroups, false, colorMethod);
                const rgb = numberToRGB(result.color);
                resultData[idx]     = rgb.r;
                resultData[idx + 1] = rgb.g;
                resultData[idx + 2] = rgb.b;
                resultData[idx + 3] = a;
                colBrightness.push(Brightness.NORMAL);
                colGroupId.push(result.groupId);
                continue;
            }

            // ── Staircasing: pick best (groupId, brightness) by colour ─────
            let bestDistance   = Infinity;
            let bestBrightness = Brightness.NORMAL;
            let bestGroupId    = 0;

            for (const groupId of enabledGroups) {
                for (const brightness of getAllowedBrightnesses(groupId)) {

                    // VALLEY_CUSTOM only: reject steps that leave [0, maxHeight]
                    if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && groupId !== 11) {
                        const delta = brightness === Brightness.HIGH ?  1
                            : brightness === Brightness.LOW  ? -1 : 0;
                        const nextY = currentY + delta;
                        if (nextY < yRange.min || nextY > yRange.max) continue;
                    }

                    const colorNum = getColorWithBrightness(groupId, brightness);
                    const rgb      = numberToRGB(colorNum);
                    const dist     = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, colorMethod);

                    if (dist < bestDistance) {
                        bestDistance   = dist;
                        bestBrightness = brightness;
                        bestGroupId    = groupId;
                    }
                }
            }

            // Advance VALLEY_CUSTOM Y tracker
            if (staircasingMode === StaircasingMode.VALLEY_CUSTOM && bestGroupId !== 11) {
                if (bestBrightness === Brightness.HIGH)     currentY++;
                else if (bestBrightness === Brightness.LOW) currentY--;
            }

            colBrightness.push(bestBrightness);
            colGroupId.push(bestGroupId);

            const colorNum = getColorWithBrightness(bestGroupId, bestBrightness);
            const rgb      = numberToRGB(colorNum);
            resultData[idx]     = rgb.r;
            resultData[idx + 1] = rgb.g;
            resultData[idx + 2] = rgb.b;
            resultData[idx + 3] = a;
        }

        // ── Post-column: compute normalised Y positions ────────────────────
        const colY = computeColumnY(colBrightness, colGroupId, staircasingMode);

        for (let z = 0; z < height; z++) {
            brightnessMap[z][x] = colBrightness[z];
            groupIdMap[z][x]    = colGroupId[z];
            yMap[z][x]          = colY[z];
        }
    }

    return {
        imageData: new ImageData(resultData, width, height),
        brightnessMap,
        groupIdMap,
        yMap
    };
}