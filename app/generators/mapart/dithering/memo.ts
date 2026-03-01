
import { Brightness, ColorDistanceMethod, StaircasingMode } from '../utils/types';
import { getAllowedBrightnesses, TRANSPARENT_GROUP_ID } from '../utils/constants';
import { numberToRGB, findBestColorInSet, ColorCandidate } from '../color/matching';
import { calculateDistance } from '../color/distance';
import type { ProcessedImageResult } from '../utils/types';

const MAX_DEPTH = 950;
const MAX_CACHE = 200_000;

function mulberry32(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface ColorOpt {
    groupId: number;
    brightness: Brightness;
    r: number;
    g: number;
    b: number;
    error: number;
}

interface RowPrecomp {
    transparent: boolean;
    high: ColorOpt | null;
    same: ColorOpt | null;
    low: ColorOpt | null;
}

function buildColorOpt(
    r: number, g: number, b: number,
    candidates: ColorCandidate[],
    method: ColorDistanceMethod,
    refColor: number | null,
): ColorOpt | null {
    if (candidates.length === 0) return null;
    const best = findBestColorInSet(r, g, b, candidates, method);
    const rgb = numberToRGB(best.color);
    const err = (refColor !== null && best.color === refColor)
        ? 0
        : calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);
    return { groupId: best.groupId, brightness: best.brightness, r: rgb.r, g: rgb.g, b: rgb.b, error: err };
}

function precomputeRow(
    idx: number,
    sourceData: Uint8ClampedArray,
    enabledGroups: Set<number>,
    method: ColorDistanceMethod,
): RowPrecomp {
    if (sourceData[idx + 3] < 128) return { transparent: true, high: null, same: null, low: null };

    const r = sourceData[idx], g = sourceData[idx + 1], b = sourceData[idx + 2];

    const highCandidates: ColorCandidate[] = [];
    const sameCandidates: ColorCandidate[] = [];
    const lowCandidates: ColorCandidate[] = [];
    const allCandidates: ColorCandidate[] = [];

    for (const groupId of enabledGroups) {
        const allowed = getAllowedBrightnesses(groupId);
        if (groupId === 11) {
            if (allowed.includes(Brightness.HIGH)) {
                sameCandidates.push({ groupId, brightness: Brightness.HIGH });
                allCandidates.push({ groupId, brightness: Brightness.HIGH });
            }
        } else {
            if (allowed.includes(Brightness.HIGH)) { highCandidates.push({ groupId, brightness: Brightness.HIGH }); allCandidates.push({ groupId, brightness: Brightness.HIGH }); }
            if (allowed.includes(Brightness.NORMAL)) { sameCandidates.push({ groupId, brightness: Brightness.NORMAL }); allCandidates.push({ groupId, brightness: Brightness.NORMAL }); }
            if (allowed.includes(Brightness.LOW)) { lowCandidates.push({ groupId, brightness: Brightness.LOW }); allCandidates.push({ groupId, brightness: Brightness.LOW }); }
        }
    }

    const refBest = allCandidates.length > 0
        ? findBestColorInSet(r, g, b, allCandidates, method).color
        : null;

    return {
        transparent: false,
        high: buildColorOpt(r, g, b, highCandidates, method, refBest),
        same: buildColorOpt(r, g, b, sameCandidates, method, refBest),
        low: buildColorOpt(r, g, b, lowCandidates, method, refBest),
    };
}


function solveSection(
    rows: RowPrecomp[],
    start: number,
    end: number,
    startH: number,
    maxHeight: number,
): Int16Array | null {
    const H = maxHeight + 1;
    const INF = Infinity;
    const len = end - start;

    let dp = new Float64Array(H).fill(INF);
    dp[startH] = 0;

    const back: Int16Array[] = new Array(len);
    let cacheSize = 0;

    for (let i = 0; i < len; i++) {
        const row = rows[start + i];
        const nextDp = new Float64Array(H).fill(INF);
        const backRow = new Int16Array(H).fill(-1);

        if (row.transparent) {
            for (let h = 0; h < H; h++) {
                if (dp[h] < nextDp[h]) { nextDp[h] = dp[h]; backRow[h] = h; }
            }
        } else {
            for (let h = 0; h < H; h++) {
                if (dp[h] === INF) continue;
                cacheSize++;
                if (cacheSize > MAX_CACHE) return null;
                const base = dp[h];

                if (row.same !== null) {
                    const cost = base + row.same.error;
                    if (cost < nextDp[h]) { nextDp[h] = cost; backRow[h] = h; }
                }
                if (h + 1 < H && row.high !== null) {
                    const cost = base + row.high.error;
                    if (cost < nextDp[h + 1]) { nextDp[h + 1] = cost; backRow[h + 1] = h; }
                }
                if (h - 1 >= 0 && row.low !== null) {
                    const cost = base + row.low.error;
                    if (cost < nextDp[h - 1]) { nextDp[h - 1] = cost; backRow[h - 1] = h; }
                }
            }
        }

        back[i] = backRow;
        dp = nextDp;
    }

    let hFinal = 0;
    for (let h = 1; h < H; h++) {
        if (dp[h] < dp[hFinal]) hFinal = h;
    }

    const chosenH = new Int16Array(len);
    let h = hFinal;
    for (let i = len - 1; i >= 0; i--) {
        chosenH[i] = h;
        h = back[i][h];
    }
    return chosenH;
}

function solveColumnWithSubdivision(
    x: number,
    sourceData: Uint8ClampedArray,
    outputData: Uint8ClampedArray,
    width: number,
    height: number,
    rows: RowPrecomp[],
    maxHeight: number,
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    rng: () => number,
): void {
    const chosenH = new Int16Array(height);

    type Section = [number, number, number];
    const stack: Section[] = [[0, height, 0]];

    while (stack.length > 0) {
        const [start, end, startH] = stack.pop()!;
        const len = end - start;

        if (len <= 0) continue;

        if (len > MAX_DEPTH) {
            const pivot = start + Math.max(1, Math.floor(rng() * (len - 1)));
            stack.push([pivot, end, startH], [start, pivot, startH]);
            continue;
        }

        const result = solveSection(rows, start, end, startH, maxHeight);
        if (result === null) {
            const lo = start + Math.floor(len * 0.25) + 1;
            const hi = start + Math.floor(len * 0.75);
            const pivot = lo + Math.floor(rng() * Math.max(1, hi - lo));
            stack.push([pivot, end, startH], [start, pivot, startH]);
        } else {
            for (let i = 0; i < len; i++) chosenH[start + i] = result[i];
        }
    }

    // Write output
    const minH = chosenH.reduce((m, v) => Math.min(m, v), Infinity);
    let prevH = 0;

    for (let z = 0; z < height; z++) {
        const idx = (z * width + x) * 4;
        const curH = chosenH[z];
        const row = rows[z];

        if (row.transparent) {
            outputData[idx] = 0; outputData[idx + 1] = 0; outputData[idx + 2] = 0; outputData[idx + 3] = 0;
            brightnessMap[z][x] = Brightness.NORMAL;
            groupIdMap[z][x] = TRANSPARENT_GROUP_ID;
        } else {
            const opt: ColorOpt = curH > prevH ? row.high! : curH < prevH ? row.low! : row.same!;
            outputData[idx] = opt.r; outputData[idx + 1] = opt.g;
            outputData[idx + 2] = opt.b; outputData[idx + 3] = 255;
            brightnessMap[z][x] = opt.brightness;
            groupIdMap[z][x] = opt.groupId;
        }

        yMap[z][x] = curH - minH;
        if (!row.transparent) prevH = curH;
    }
}

export function applyMemoizedDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod,
    maxHeight: number,
    seed?: number,
): ProcessedImageResult {
    const sourceData = imageData.data;
    const outputData = new Uint8ClampedArray(sourceData.length);

    const brightnessMap: Brightness[][] = Array.from({ length: height }, () => new Array(width));
    const groupIdMap: number[][] = Array.from({ length: height }, () => new Array(width));
    const yMap: number[][] = Array.from({ length: height }, () => new Array(width));

    const rng = seed != null ? mulberry32(seed) : Math.random.bind(Math);

    // Precompute rows once (shared across all columns for this image)
    const rowsPerX: RowPrecomp[][] = [];
    for (let x = 0; x < width; x++) {
        const rows: RowPrecomp[] = new Array(height);
        for (let z = 0; z < height; z++) {
            rows[z] = precomputeRow((z * width + x) * 4, sourceData, enabledGroups, colorMethod);
        }
        rowsPerX.push(rows);
    }

    for (let x = 0; x < width; x++) {
        solveColumnWithSubdivision(x, sourceData, outputData, width, height, rowsPerX[x], maxHeight, brightnessMap, groupIdMap, yMap, rng);
    }

    return { imageData: new ImageData(outputData, width, height), brightnessMap, groupIdMap, yMap };
}
