import { Brightness, ColorDistanceMethod, StaircasingMode, AreaSettingsResolved } from '../utils/types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from '../utils/constants';
import { numberToRGB, findBestColorInSet, ColorCandidate } from '../color/matching';
import { clamp } from './shared';
import { DitheringMethodRiemersma } from './types';
import { finalizeColumn, finalizeColumnMixed } from '../staircasing/heights';
import type { ProcessedImageResult } from '../utils/types';
import { resolveEffective } from '../utils/buildable';

function nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

export function generateHilbertOrder(w: number, h: number): [number, number][] {
    const n = nextPowerOf2(Math.max(w, h));
    const total = n * n;
    const order: [number, number][] = [];

    for (let d = 0; d < total; d++) {
        let x = 0, y = 0, t = d;
        for (let s = 1; s < n; s *= 2) {
            const rx = (t & 2) > 0 ? 1 : 0;
            const ry = (t & (rx === 1 ? 1 : 3)) > 0 ? 1 : 0;
            if (ry === 0) {
                if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
                const tmp = x; x = y; y = tmp;
            }
            x += s * rx;
            y += s * ry;
            t >>= 2;
        }
        if (x < w && y < h) order.push([x, y]);
    }

    return order;
}

function getCandidates(
    enabledGroups: Set<number>,
    mode: StaircasingMode,
    currentY: number,
    yRange: { min: number; max: number },
): ColorCandidate[] {
    if (mode === StaircasingMode.NONE) {
        return [...enabledGroups].map(groupId => ({ groupId, brightness: Brightness.NORMAL }));
    }

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

export function applyRiemersmaDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    yRange: { min: number; max: number },
    maxHeight: number,
    method: DitheringMethodRiemersma,
    areas: AreaSettingsResolved[] = [],
): ProcessedImageResult {
    const sourceData = imageData.data;
    const outputData = new Uint8ClampedArray(sourceData.length);

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const hasAreas = areas.length > 0;

    const { historyLength, errorDecay } = method;

    const currentYPerColumn = new Int32Array(width);

    const colBrightnessAll: Brightness[][] = Array.from({ length: width }, () => new Array(height));
    const colGroupIdAll: number[][] = Array.from({ length: width }, () => new Array(height));
    const colModeAll: StaircasingMode[][] = hasAreas ? Array.from({ length: width }, () => new Array(height)) : [];
    const colMaxHeightAll: number[][] = hasAreas ? Array.from({ length: width }, () => new Array(height)) : [];

    const histR = new Float32Array(historyLength);
    const histG = new Float32Array(historyLength);
    const histB = new Float32Array(historyLength);
    let histPos = 0;
    let histCount = 0;

    const order = generateHilbertOrder(width, height);

    for (const [x, z] of order) {
        const idx = (z * width + x) * 4;

        const eff = hasAreas
            ? resolveEffective(x, z, areas, enabledGroups, staircasingMode, colorMethod, maxHeight, yRange)
            : { enabledGroups, mode: staircasingMode, colorMethod, maxHeight, yRange };

        if (hasAreas) {
            colModeAll[x][z] = eff.mode;
            colMaxHeightAll[x][z] = eff.maxHeight;
        }

        if (sourceData[idx + 3] < 128) {
            outputData[idx] = 0; outputData[idx + 1] = 0; outputData[idx + 2] = 0; outputData[idx + 3] = 0;
            colBrightnessAll[x][z] = Brightness.NORMAL;
            colGroupIdAll[x][z] = TRANSPARENT_GROUP_ID;
            // Transparent pixels don't push to error history
            continue;
        }

        let accR = 0, accG = 0, accB = 0, w = 1.0;
        const filled = Math.min(histCount, historyLength);
        for (let i = 0; i < filled; i++) {
            const pos = (histPos - 1 - i + historyLength) % historyLength;
            accR += histR[pos] * w;
            accG += histG[pos] * w;
            accB += histB[pos] * w;
            w *= errorDecay;
        }

        const srcR = clamp(Math.round(sourceData[idx] + accR));
        const srcG = clamp(Math.round(sourceData[idx + 1] + accG));
        const srcB = clamp(Math.round(sourceData[idx + 2] + accB));

        const candidates = getCandidates(eff.enabledGroups, eff.mode, currentYPerColumn[x], eff.yRange);
        const best = findBestColorInSet(srcR, srcG, srcB, candidates, eff.colorMethod);
        const rgb = numberToRGB(best.color);

        outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g;
        outputData[idx + 2] = rgb.b; outputData[idx + 3] = 255;

        // Push quantization error into history
        histR[histPos] = srcR - rgb.r;
        histG[histPos] = srcG - rgb.g;
        histB[histPos] = srcB - rgb.b;
        histPos = (histPos + 1) % historyLength;
        if (histCount < historyLength) histCount++;

        colBrightnessAll[x][z] = best.brightness;
        colGroupIdAll[x][z] = best.groupId;

        if (eff.mode !== StaircasingMode.NONE) {
            if (best.groupId !== 11 && best.groupId !== TRANSPARENT_GROUP_ID) {
                if (best.brightness === Brightness.HIGH) currentYPerColumn[x]++;
                else if (best.brightness === Brightness.LOW) currentYPerColumn[x]--;
            }
        }
    }

    for (let x = 0; x < width; x++) {
        if (hasAreas) {
            finalizeColumnMixed(
                x, height,
                colBrightnessAll[x], colGroupIdAll[x],
                colModeAll[x], colMaxHeightAll[x],
                brightnessMap, groupIdMap, yMap,
            );
        } else {
            finalizeColumn(
                x, height,
                colBrightnessAll[x], colGroupIdAll[x],
                staircasingMode,
                brightnessMap, groupIdMap, yMap,
                undefined, maxHeight,
            );
        }
    }

    return { imageData: new ImageData(outputData, width, height), brightnessMap, groupIdMap, yMap };
}
