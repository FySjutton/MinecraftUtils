import { ColorDistanceMethod } from '../utils/types';

const labCache = new Map<number, [number, number, number]>();

function rgb2lab(r: number, g: number, b: number): [number, number, number] {
    const key = (r << 16) | (g << 8) | b;
    const cached = labCache.get(key);
    if (cached) return cached;

    let r1 = r / 255, g1 = g / 255, b1 = b / 255;

    r1 = r1 <= 0.04045 ? r1 / 12.0 : Math.pow((r1 + 0.055) / 1.055, 2.4);
    g1 = g1 <= 0.04045 ? g1 / 12.0 : Math.pow((g1 + 0.055) / 1.055, 2.4);
    b1 = b1 <= 0.04045 ? b1 / 12.0 : Math.pow((b1 + 0.055) / 1.055, 2.4);

    const f = (0.43605202 * r1 + 0.3850816 * g1 + 0.14308742 * b1) / 0.964221;
    const h = 0.22249159 * r1 + 0.71688604 * g1 + 0.060621485 * b1;
    const k = (0.013929122 * r1 + 0.097097 * g1 + 0.7141855 * b1) / 0.825211;

    const cbrt = (v: number) => v > 0.008856452 ? Math.pow(v, 1 / 3) : (903.2963 * v + 16) / 116;

    const L = cbrt(h);
    const result: [number, number, number] = [
        2.55 * (116 * L - 16) + 0.5,
        500 * (cbrt(f) - L) + 0.5,
        200 * (L - cbrt(k)) + 0.5,
    ];

    labCache.set(key, result);
    return result;
}

export function euclideanDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return dr * dr + dg * dg + db * db;
}

export function weightedRGBDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const rMean = (r1 + r2) / 2;
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return Math.sqrt(
        (2 + rMean / 256) * dr * dr +
        4.0       * dg * dg +
        (2 + (255 - rMean) / 256) * db * db,
    );
}

export function deltaEDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [l1, a1, b1_] = rgb2lab(r1, g1, b1);
    const [l2, a2, b2_] = rgb2lab(r2, g2, b2);
    const dl = l1 - l2, da = a1 - a2, db = b1_ - b2_;
    return dl * dl + da * da + db * db;
}

export function calculateDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
    method: ColorDistanceMethod,
): number {
    switch (method) {
        case ColorDistanceMethod.WEIGHTED_RGB: return weightedRGBDistance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.DELTA_E_2000: return deltaEDistance(r1, g1, b1, r2, g2, b2);
        default:                  return euclideanDistance(r1, g1, b1, r2, g2, b2);
    }
}