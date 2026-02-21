import { ColorDistanceMethod } from '../utils/types';

function linearize(v: number): number {
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearizeChannel(c: number): number {
    return linearize(c / 255);
}

// Each cache stores a [A, B, C] tuple for a given packed RGB key.
const labD65Cache = new Map<number, [number, number, number]>();
const labD50Cache = new Map<number, [number, number, number]>();
const oklabCache = new Map<number, [number, number, number]>();
const cluvD65Cache = new Map<number, [number, number, number]>();

function packRGB(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
}

// XYZ helpers

function xyzToLab(fx: number, fy: number, fz: number): [number, number, number] {
    const f = (t: number) => t > 0.008856452 ? Math.cbrt(t) : (903.2962962 * t + 16) / 116;
    const lf = f(fy);
    const L = 116 * lf - 16;
    const a = 500 * (f(fx) - lf);
    const b = 200 * (lf - f(fz));
    return [L, a, b];
}

// D65 Lab

// sRGB -> XYZ (D65 illuminant, IEC 61966-2-1)
// White point: Xn=0.95047 Yn=1.00000 Zn=1.08883
function rgb2labD65(r: number, g: number, b: number): [number, number, number] {
    const key = packRGB(r, g, b);
    const hit = labD65Cache.get(key);
    if (hit) return hit;

    const rl = linearizeChannel(r);
    const gl = linearizeChannel(g);
    const bl = linearizeChannel(b);

    const X = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / 0.95047;
    const Y = (0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl); // / 1.0
    const Z = (0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl) / 1.08883;

    const result = xyzToLab(X, Y, Z);
    labD65Cache.set(key, result);
    return result;
}

// D50 Lab 

// sRGB → XYZ (D50 illuminant, Bradford chromatic adaptation from D65)
// White point: Xn=0.96422 Yn=1.00000 Zn=0.82521
function rgb2labD50(r: number, g: number, b: number): [number, number, number] {
    const key = packRGB(r, g, b);
    const hit = labD50Cache.get(key);
    if (hit) return hit;

    const rl = linearizeChannel(r);
    const gl = linearizeChannel(g);
    const bl = linearizeChannel(b);

    const X = (0.4360747 * rl + 0.3850649 * gl + 0.1430804 * bl) / 0.96422;
    const Y = (0.2225045 * rl + 0.7168786 * gl + 0.0606169 * bl); // / 1.0
    const Z = (0.0139322 * rl + 0.0971045 * gl + 0.7141733 * bl) / 0.82521;

    const result = xyzToLab(X, Y, Z);
    labD50Cache.set(key, result);
    return result;
}

// OKLab 

// Björn Ottosson's OKLab (2020), perceptually uniform, Euclidean-friendly.
// https://bottosson.github.io/posts/oklab/
function rgb2oklab(r: number, g: number, b: number): [number, number, number] {
    const key = packRGB(r, g, b);
    const hit = oklabCache.get(key);
    if (hit) return hit;

    const rl = linearizeChannel(r);
    const gl = linearizeChannel(g);
    const bl = linearizeChannel(b);

    // linear sRGB → LMS (Ottosson's matrix)
    const lms_l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
    const lms_m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
    const lms_s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

    const l_ = Math.cbrt(lms_l);
    const m_ = Math.cbrt(lms_m);
    const s_ = Math.cbrt(lms_s);

    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    const result: [number, number, number] = [L, a, bv];
    oklabCache.set(key, result);
    return result;
}

// CIELUV D65 

// D65 reference u'n, v'n
const UN_D65 = 0.19783000664283; // 4 * Xn / (Xn + 15*Yn + 3*Zn)
const VN_D65 = 0.46831999493879; // 9 * Yn / (Xn + 15*Yn + 3*Zn)

function rgb2cluv(r: number, g: number, b: number): [number, number, number] {
    const key = packRGB(r, g, b);
    const hit = cluvD65Cache.get(key);
    if (hit) return hit;

    const rl = linearizeChannel(r);
    const gl = linearizeChannel(g);
    const bl = linearizeChannel(b);

    // sRGB → XYZ D65 (not normalised here — we need raw X, Y, Z)
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

    const denom = X + 15 * Y + 3 * Z;
    const Lstar = Y > 0.008856452 ? 116 * Math.cbrt(Y) - 16 : 903.2962962 * Y;

    let ustar = 0, vstar = 0;
    if (denom > 1e-10) {
        const up = 4 * X / denom;
        const vp = 9 * Y / denom;
        ustar = 13 * Lstar * (up - UN_D65);
        vstar = 13 * Lstar * (vp - VN_D65);
    }

    const result: [number, number, number] = [Lstar, ustar, vstar];
    cluvD65Cache.set(key, result);
    return result;
}

// CIE94 helpers
function cie94(L1: number, a1: number, b1: number, L2: number, a2: number, b2: number,): number {
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);

    const dL = L1 - L2;
    const dC = C1 - C2;
    const da = a1 - a2, db = b1 - b2;
    const dH2 = Math.max(0, da * da + db * db - dC * dC);

    const SC = 1 + 0.045 * C1;
    const SH = 1 + 0.015 * C1;

    return Math.sqrt(dL * dL + (dC / SC) * (dC / SC) + dH2 / (SH * SH));
}

// CIEDE2000
function ciede2000(
    L1: number, a1: number, b1: number,
    L2: number, a2: number, b2: number,
): number {
    const TAU = 2 * Math.PI;
    const deg = (rad: number) => rad * 180 / Math.PI;
    const rad = (d: number) => d * Math.PI / 180;

    const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
    const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
    const Cbar7 = Math.pow((C1ab + C2ab) / 2, 7);
    const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 6103515625))); // 25^7

    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    const rawH1 = deg(Math.atan2(b1, a1p));
    const rawH2 = deg(Math.atan2(b2, a2p));
    const h1p = rawH1 < 0 ? rawH1 + 360 : rawH1;
    const h2p = rawH2 < 0 ? rawH2 + 360 : rawH2;

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp: number;
    if (C1p * C2p === 0) {
        dhp = 0;
    } else {
        const diff = h2p - h1p;
        if (Math.abs(diff) <= 180) dhp = diff;
        else if (diff > 180) dhp = diff - 360;
        else dhp = diff + 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;
    const Cbarp7 = Math.pow(Cbarp, 7);

    let hbarp: number;
    if (C1p * C2p === 0) {
        hbarp = h1p + h2p;
    } else {
        const hsum = h1p + h2p;
        if (Math.abs(h1p - h2p) <= 180) hbarp = hsum / 2;
        else if (hsum < 360) hbarp = (hsum + 360) / 2;
        else hbarp = (hsum - 360) / 2;
    }

    const T = 1
        - 0.17 * Math.cos(rad(hbarp - 30))
        + 0.24 * Math.cos(rad(2 * hbarp))
        + 0.32 * Math.cos(rad(3 * hbarp + 6))
        - 0.20 * Math.cos(rad(4 * hbarp - 63));

    const SL = 1 + 0.015 * (Lbarp - 50) * (Lbarp - 50) / Math.sqrt(20 + (Lbarp - 50) * (Lbarp - 50));
    const SC = 1 + 0.045 * Cbarp;
    const SH = 1 + 0.015 * Cbarp * T;

    const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 6103515625));
    const dTheta = 30 * Math.exp(-((hbarp - 275) / 25) * ((hbarp - 275) / 25));
    const RT = -Math.sin(rad(2 * dTheta)) * RC;

    return Math.sqrt(
        (dLp / SL) * (dLp / SL) +
        (dCp / SC) * (dCp / SC) +
        (dHp / SH) * (dHp / SH) +
        RT * (dCp / SC) * (dHp / SH),
    );
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
        4.0 * dg * dg +
        (2 + (255 - rMean) / 256) * db * db,
    );
}

export function cie76D65Distance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2labD65(r1, g1, b1);
    const [L2, a2, b2_] = rgb2labD65(r2, g2, b2);
    const dl = L1 - L2, da = a1 - a2, db = b1_ - b2_;
    return Math.sqrt(dl * dl + da * da + db * db);
}

export function cie76D50Distance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2labD50(r1, g1, b1);
    const [L2, a2, b2_] = rgb2labD50(r2, g2, b2);
    const dl = L1 - L2, da = a1 - a2, db = b1_ - b2_;
    return Math.sqrt(dl * dl + da * da + db * db);
}

export function cie94D65Distance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2labD65(r1, g1, b1);
    const [L2, a2, b2_] = rgb2labD65(r2, g2, b2);
    return cie94(L1, a1, b1_, L2, a2, b2_);
}

export function ciede2000D65Distance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2labD65(r1, g1, b1);
    const [L2, a2, b2_] = rgb2labD65(r2, g2, b2);
    return ciede2000(L1, a1, b1_, L2, a2, b2_);
}

export function ciede2000D50Distance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2labD50(r1, g1, b1);
    const [L2, a2, b2_] = rgb2labD50(r2, g2, b2);
    return ciede2000(L1, a1, b1_, L2, a2, b2_);
}

export function oklabDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, a1, b1_] = rgb2oklab(r1, g1, b1);
    const [L2, a2, b2_] = rgb2oklab(r2, g2, b2);
    const dl = L1 - L2, da = a1 - a2, db = b1_ - b2_;
    return Math.sqrt(dl * dl + da * da + db * db);
}

export function hsluvDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
): number {
    const [L1, u1, v1] = rgb2cluv(r1, g1, b1);
    const [L2, u2, v2] = rgb2cluv(r2, g2, b2);
    const dl = L1 - L2, du = u1 - u2, dv = v1 - v2;
    return Math.sqrt(dl * dl + du * du + dv * dv);
}

// Unified dispatcher
export function calculateDistance(
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
    method: ColorDistanceMethod,
): number {
    switch (method) {
        case ColorDistanceMethod.WEIGHTED_RGB: return weightedRGBDistance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.CIE76_D65: return cie76D65Distance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.CIE76_D50: return cie76D50Distance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.CIE94_D65: return cie94D65Distance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.CIEDE2000_D65: return ciede2000D65Distance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.CIEDE2000_D50: return ciede2000D50Distance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.OKLAB: return oklabDistance(r1, g1, b1, r2, g2, b2);
        case ColorDistanceMethod.HSLUV: return hsluvDistance(r1, g1, b1, r2, g2, b2);
        default: return euclideanDistance(r1, g1, b1, r2, g2, b2);
    }
}