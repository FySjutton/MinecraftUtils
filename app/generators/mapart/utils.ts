import { Brightness, MaterialCount, ColorDistanceMethod } from './types';
import { findNearestMapColor, numberToRGB } from './colorMatching';

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function getMaterialList(
    canvas: HTMLCanvasElement,
    enabledGroups: Set<number>,
    useStaircasing: boolean,
    method: ColorDistanceMethod
): MaterialCount[] {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get material list - no canvas context');
        return [];
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const counts = new Map<string, MaterialCount>();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const nearest = findNearestMapColor(r, g, b, enabledGroups, useStaircasing, method);
        const groupId = nearest.groupId;
        const brightness = nearest.brightness;

        const key = `${groupId}-${brightness}`;

        if (counts.has(key)) {
            counts.get(key)!.count++;
        } else {
            counts.set(key, {
                groupId: groupId,
                brightness: brightness,
                count: 1,
            });
        }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export { numberToRGB } from './colorMatching';
export { findNearestMapColor } from './colorMatching';