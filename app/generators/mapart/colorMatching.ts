import { Brightness, ColorDistanceMethod } from './types';
import { BASE_COLORS } from './constants';

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;

    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

    let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
    let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
    let z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

    x = x / 0.95047;
    y = y / 1.00000;
    z = z / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const bVal = 200 * (y - z);

    return { l, a, b: bVal };
}

function deltaE2000(
    lab1: { l: number; a: number; b: number },
    lab2: { l: number; a: number; b: number }
): number {
    const kL = 1;
    const kC = 1;
    const kH = 1;

    const L1 = lab1.l;
    const a1 = lab1.a;
    const b1 = lab1.b;
    const L2 = lab2.l;
    const a2 = lab2.a;
    const b2 = lab2.b;

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cavg = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cavg, 7) / (Math.pow(Cavg, 7) + Math.pow(25, 7))));

    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;

    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    const h1p = Math.abs(a1p) + Math.abs(b1) === 0 ? 0 : Math.atan2(b1, a1p) * 180 / Math.PI;
    const h2p = Math.abs(a2p) + Math.abs(b2) === 0 ? 0 : Math.atan2(b2, a2p) * 180 / Math.PI;

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp;
    if (C1p * C2p === 0) {
        dhp = 0;
    } else if (Math.abs(h2p - h1p) <= 180) {
        dhp = h2p - h1p;
    } else if (h2p - h1p > 180) {
        dhp = h2p - h1p - 360;
    } else {
        dhp = h2p - h1p + 360;
    }

    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

    const Lavg = (L1 + L2) / 2;
    const Cavgp = (C1p + C2p) / 2;

    let Havgp;
    if (C1p * C2p === 0) {
        Havgp = h1p + h2p;
    } else if (Math.abs(h1p - h2p) <= 180) {
        Havgp = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
        Havgp = (h1p + h2p + 360) / 2;
    } else {
        Havgp = (h1p + h2p - 360) / 2;
    }

    const T = 1 - 0.17 * Math.cos((Havgp - 30) * Math.PI / 180) +
        0.24 * Math.cos(2 * Havgp * Math.PI / 180) +
        0.32 * Math.cos((3 * Havgp + 6) * Math.PI / 180) -
        0.20 * Math.cos((4 * Havgp - 63) * Math.PI / 180);

    const dTheta = 30 * Math.exp(-Math.pow((Havgp - 275) / 25, 2));
    const RC = 2 * Math.sqrt(Math.pow(Cavgp, 7) / (Math.pow(Cavgp, 7) + Math.pow(25, 7)));
    const SL = 1 + (0.015 * Math.pow(Lavg - 50, 2)) / Math.sqrt(20 + Math.pow(Lavg - 50, 2));
    const SC = 1 + 0.045 * Cavgp;
    const SH = 1 + 0.015 * Cavgp * T;
    const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC;

    const dE = Math.sqrt(
        Math.pow(dLp / (kL * SL), 2) +
        Math.pow(dCp / (kC * SC), 2) +
        Math.pow(dHp / (kH * SH), 2) +
        RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
    );

    return dE;
}

function euclideanDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number
): number {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function colorDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
    method: ColorDistanceMethod
): number {
    if (method === ColorDistanceMethod.DELTA_E_2000) {
        const lab1 = rgbToLab(r1, g1, b1);
        const lab2 = rgbToLab(r2, g2, b2);
        return deltaE2000(lab1, lab2);
    } else {
        return euclideanDistance(r1, g1, b1, r2, g2, b2);
    }
}

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
        console.error(`Invalid mapColorId: ${mapColorId}`);
        return 0;
    }
    const color = BASE_COLORS[mapColorId];
    return scaleRGB(color, brightness);
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

    const brightnesses = useStaircasing
        ? [Brightness.LOWEST, Brightness.LOW, Brightness.NORMAL, Brightness.HIGH]
        : [Brightness.NORMAL];

    for (const groupId of enabledGroups) {
        for (const brightness of brightnesses) {
            const colorNum = getColorWithBrightness(groupId, brightness);
            const rgb = numberToRGB(colorNum);

            const distance = colorDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);

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