import {
    BASE_COLORS,
    Brightness,
    ColorDistanceMethod,
    getAllowedBrightnesses,
    rgbToHex,
    scaleRGB
} from "@/app/generators/mapart/utils/utils";

const labCache = new Map<number, [number, number, number]>();

function rgb2lab(r: number, g: number, b: number): [number, number, number] {
    const val = (r << 16) + (g << 8) + b;

    if (labCache.has(val)) {
        return labCache.get(val)!;
    }

    let r1 = r / 255.0;
    let g1 = g / 255.0;
    let b1 = b / 255.0;

    r1 = r1 <= 0.04045 ? r1 / 12.0 : Math.pow((r1 + 0.055) / 1.055, 2.4);
    g1 = g1 <= 0.04045 ? g1 / 12.0 : Math.pow((g1 + 0.055) / 1.055, 2.4);
    b1 = b1 <= 0.04045 ? b1 / 12.0 : Math.pow((b1 + 0.055) / 1.055, 2.4);

    const f = (0.43605202 * r1 + 0.3850816 * g1 + 0.14308742 * b1) / 0.964221;
    const h = 0.22249159 * r1 + 0.71688604 * g1 + 0.060621485 * b1;
    const k = (0.013929122 * r1 + 0.097097 * g1 + 0.7141855 * b1) / 0.825211;

    const l = h > 0.008856452 ? Math.pow(h, 1 / 3) : (903.2963 * h + 16.0) / 116.0;
    const m = 500.0 * ((f > 0.008856452 ? Math.pow(f, 1 / 3) : (903.2963 * f + 16.0) / 116.0) - l);
    const n = 200.0 * (l - (k > 0.008856452 ? Math.pow(k, 1 / 3) : (903.2963 * k + 16.0) / 116.0));

    const result: [number, number, number] = [
        2.55 * (116.0 * l - 16.0) + 0.5,
        m + 0.5,
        n + 0.5
    ];

    labCache.set(val, result);
    return result;
}

function squaredEuclideanDistance(
    c1: [number, number, number],
    c2: [number, number, number]
): number {
    const d0 = c1[0] - c2[0];
    const d1 = c1[1] - c2[1];
    const d2 = c1[2] - c2[2];
    return d0 * d0 + d1 * d1 + d2 * d2;
}

function weightedRGBDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number
): number {
    const rMean = (r1 + r2) / 2;
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;

    const weightR = 2 + rMean / 256;
    const weightG = 4.0;
    const weightB = 2 + (255 - rMean) / 256;

    return Math.sqrt(weightR * dr * dr + weightG * dg * dg + weightB * db * db);
}

function calculateDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
    method: ColorDistanceMethod
): number {
    if (method === ColorDistanceMethod.WEIGHTED_RGB) {
        return weightedRGBDistance(r1, g1, b1, r2, g2, b2);
    } else if (method === ColorDistanceMethod.DELTA_E_2000) {
        const lab1 = rgb2lab(r1, g1, b1);
        const lab2 = rgb2lab(r2, g2, b2);
        return squaredEuclideanDistance(lab1, lab2);
    } else {
        return squaredEuclideanDistance([r1, g1, b1], [r2, g2, b2]);
    }
}

export { calculateDistance };

export function getColorWithBrightness(
    mapColorId: number,
    brightness: Brightness,
): number {
    if (mapColorId < 0 || mapColorId >= BASE_COLORS.length) {
        console.error(`Invalid mapColorId: ${mapColorId}`);
        return 0;
    }
    const color = BASE_COLORS[mapColorId];
    return scaleRGB(color, brightness);
}

export function numberToHex(color: number): string {
    const rgb = numberToRGB(color);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function numberToRGB(color: number): { r: number; g: number; b: number } {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

export function findNearestMapColor(
    r: number,
    g: number,
    b: number,
    enabledGroups: Set<number>,
    useStaircasing: boolean,
    method: ColorDistanceMethod
): { groupId: number; brightness: Brightness; color: number } {
    if (enabledGroups.size === 0) {
        return { groupId: 0, brightness: Brightness.NORMAL, color: 0 };
    }

    let minDistance = Infinity;
    let bestGroupId = 0;
    let bestBrightness = Brightness.NORMAL;

    for (const groupId of enabledGroups) {
        const brightnesses = useStaircasing
            ? getAllowedBrightnesses(groupId)
            : [Brightness.NORMAL];

        for (const brightness of brightnesses) {
            const colorNum = getColorWithBrightness(groupId, brightness);
            const rgb = numberToRGB(colorNum);

            const distance = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);

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