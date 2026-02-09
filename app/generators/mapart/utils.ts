import { Brightness, MaterialCount } from './types';
import { BASE_COLORS } from './constants';

export function scaleRGB(color: number, brightness: Brightness): number {
    const r = ((color >> 16) & 0xff) * brightness / 255;
    const g = ((color >> 8) & 0xff) * brightness / 255;
    const b = (color & 0xff) * brightness / 255;

    return ((Math.floor(r) & 0xff) << 16) | ((Math.floor(g) & 0xff) << 8) | (Math.floor(b) & 0xff);
}

export function getColorWithBrightness(
    mapColorId: number,
    brightness: Brightness,
): number {
    if (mapColorId < 0 || mapColorId >= BASE_COLORS.length) {
        console.error(`Invalid mapColorId: ${mapColorId}, max is ${BASE_COLORS.length - 1}`);
        return 0;
    }
    const color = BASE_COLORS[mapColorId];
    if (color === undefined || color === null) {
        console.error(`No color found for mapColorId: ${mapColorId}`);
        return 0;
    }
    return scaleRGB(color, brightness);
}

export function numberToRGB(color: number): { r: number; g: number; b: number } {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function findNearestMapColor(
    r: number,
    g: number,
    b: number,
    enabledGroups: Set<number>,
    useStaircasing: boolean
): { groupId: number; brightness: Brightness; color: number } {
    if (enabledGroups.size === 0) {
        console.error('No enabled groups for color matching!');
        return { groupId: 0, brightness: Brightness.NORMAL, color: 0 };
    }

    let minDistance = Infinity;
    let bestGroupId = 0;
    let bestBrightness = Brightness.NORMAL;

    const brightnesses = useStaircasing
        ? [Brightness.LOWEST, Brightness.LOW, Brightness.NORMAL, Brightness.HIGH]
        : [Brightness.NORMAL];

    for (const groupId of enabledGroups) {
        for (const brightness of brightnesses) {
            const colorNum = getColorWithBrightness(groupId, brightness);
            const rgb = numberToRGB(colorNum);
            const distance = colorDistance({ r, g, b }, rgb);

            if (distance < minDistance) {
                minDistance = distance;
                bestGroupId = groupId;
                bestBrightness = brightness;
            }
        }
    }

    const finalColor = getColorWithBrightness(bestGroupId, bestBrightness);

    return {
        groupId: bestGroupId,
        brightness: bestBrightness,
        color: finalColor,
    };
}

export function applyDithering(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    useStaircasing: boolean
): ImageData {
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const oldR = data[idx];
            const oldG = data[idx + 1];
            const oldB = data[idx + 2];

            const nearest = findNearestMapColor(oldR, oldG, oldB, enabledGroups, useStaircasing);
            const rgb = numberToRGB(nearest.color);

            data[idx] = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;

            const errR = oldR - rgb.r;
            const errG = oldG - rgb.g;
            const errB = oldB - rgb.b;

            const distributeError = (xOffset: number, yOffset: number, factor: number) => {
                const newX = x + xOffset;
                const newY = y + yOffset;
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                    const newIdx = (newY * width + newX) * 4;
                    data[newIdx] = Math.max(0, Math.min(255, data[newIdx] + errR * factor));
                    data[newIdx + 1] = Math.max(0, Math.min(255, data[newIdx + 1] + errG * factor));
                    data[newIdx + 2] = Math.max(0, Math.min(255, data[newIdx + 2] + errB * factor));
                }
            };

            distributeError(1, 0, 7/16);
            distributeError(-1, 1, 3/16);
            distributeError(0, 1, 5/16);
            distributeError(1, 1, 1/16);
        }
    }

    return imageData;
}

export function getMaterialList(
    canvas: HTMLCanvasElement,
    enabledGroups: Set<number>,
    useStaircasing: boolean
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

        const nearest = findNearestMapColor(r, g, b, enabledGroups, useStaircasing);
        const key = `${nearest.groupId}-${nearest.brightness}`;

        if (counts.has(key)) {
            counts.get(key)!.count++;
        } else {
            counts.set(key, {
                groupId: nearest.groupId,
                brightness: nearest.brightness,
                count: 1,
            });
        }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}