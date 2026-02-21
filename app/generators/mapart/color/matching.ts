import { Brightness, ColorDistanceMethod } from '../utils/types';
import { BASE_COLORS, scaleRGB, rgbToHex } from '../utils/constants';
import { calculateDistance } from './distance';

export function numberToRGB(color: number): { r: number; g: number; b: number } {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

export function numberToHex(color: number): string {
    const { r, g, b } = numberToRGB(color);
    return rgbToHex(r, g, b);
}

export function getColorWithBrightness(mapColorId: number, brightness: Brightness): number {
    if (mapColorId < 0 || mapColorId >= BASE_COLORS.length) {
        console.error(`Invalid mapColorId: ${mapColorId}`);
        return 0;
    }
    return scaleRGB(BASE_COLORS[mapColorId], brightness);
}

export interface ColorCandidate {
    groupId: number;
    brightness: Brightness;
}

export interface BestColorResult {
    groupId: number;
    brightness: Brightness;
    color: number;
}

export function findBestColorInSet(
    r: number, g: number, b: number,
    candidates: ColorCandidate[],
    method: ColorDistanceMethod,
): BestColorResult {
    let minDist = Infinity;
    let best: ColorCandidate = candidates[0] ?? { groupId: 0, brightness: Brightness.NORMAL };

    for (const candidate of candidates) {
        const colorNum = getColorWithBrightness(candidate.groupId, candidate.brightness);
        const rgb = numberToRGB(colorNum);
        const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);
        if (dist < minDist) {
            minDist = dist;
            best = candidate;
        }
    }

    return {
        groupId: best.groupId,
        brightness: best.brightness,
        color: getColorWithBrightness(best.groupId, best.brightness),
    };
}

export function buildCandidates(
    enabledGroups: Set<number>,
    brightnessesFor: (groupId: number) => Brightness[],
): ColorCandidate[] {
    const candidates: ColorCandidate[] = [];
    for (const groupId of enabledGroups)
        for (const brightness of brightnessesFor(groupId))
            candidates.push({ groupId, brightness });
    return candidates;
}
