import { Brightness, StaircasingMode } from '../utils/types';

const MAX_WORLD_HEIGHT = 384;

export function getYRange(
    mode: StaircasingMode,
    maxHeight?: number,
): { min: number; max: number } {
    if (mode === StaircasingMode.NONE) return { min: 0, max: 0 };

    if (mode === StaircasingMode.STANDARD_CUSTOM || mode === StaircasingMode.VALLEY_CUSTOM) {
        const h = maxHeight != null && maxHeight > 0 ? maxHeight : MAX_WORLD_HEIGHT;
        return { min: 0, max: h };
    }

    return { min: -MAX_WORLD_HEIGHT, max: MAX_WORLD_HEIGHT };
}

function solveMinimalHeights(signs: number[]): number[] {
    const n = signs.length + 1;
    type Edge = [number, number, number];
    const edges: Edge[] = [];

    for (let i = 0; i < signs.length; i++) {
        const s = signs[i];
        if (s === 1) edges.push([i, i + 1, 1]);
        else if (s === 0) { edges.push([i, i + 1, 0]); edges.push([i + 1, i, 0]); }
        else edges.push([i + 1, i, 1]);
    }

    for (let i = 0; i < n; i++) edges.push([n, i, 0]);

    const dist = new Array(n + 1).fill(0);
    for (let iter = 0; iter < n; iter++) {
        let updated = false;
        for (const [u, v, w] of edges) {
            if (dist[u] + w > dist[v]) { dist[v] = dist[u] + w; updated = true; }
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
    mode: StaircasingMode,
    maxHeight?: number,
): number[] {
    const n = brightnesses.length;
    if (n === 0) return [];
    if (mode === StaircasingMode.NONE) return new Array(n).fill(0);

    if (mode === StaircasingMode.VALLEY || mode === StaircasingMode.STANDARD_CUSTOM) {
        const signs = brightnesses.slice(1).map((b, i) => {
            if (groupIds[i + 1] === 11) return 0;
            return b === Brightness.HIGH ? 1 : b === Brightness.LOW ? -1 : 0;
        });
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

export function finalizeColumn(
    x: number,
    height: number,
    colBrightness: Brightness[],
    colGroupId: number[],
    staircasingMode: StaircasingMode,
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    colYDirect?: number[],
    maxHeight?: number,
): void {
    const isValley = staircasingMode === StaircasingMode.VALLEY;

    const colY = isValley
        ? computeColumnY(colBrightness, colGroupId, staircasingMode, maxHeight)
        : (colYDirect ?? computeColumnY(colBrightness, colGroupId, staircasingMode, maxHeight));

    const minY = Math.min(...colY);
    for (let z = 0; z < height; z++) {
        brightnessMap[z][x] = colBrightness[z];
        groupIdMap[z][x] = colGroupId[z];
        yMap[z][x] = colY[z] - minY;
    }
}