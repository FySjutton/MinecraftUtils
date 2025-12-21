export type RGB = [number, number, number];

export const GLASS_COLORS: Record<string, RGB> = {
    white_stained_glass: [249, 255, 254],
    orange_stained_glass: [249, 128, 29],
    magenta_stained_glass: [199, 78, 189],
    light_blue_stained_glass: [58, 179, 218],
    yellow_stained_glass: [254, 216, 61],
    lime_stained_glass: [128, 199, 31],
    pink_stained_glass: [243, 139, 170],
    gray_stained_glass: [71, 79, 82],
    light_gray_stained_glass: [157, 157, 151],
    cyan_stained_glass: [22, 156, 156],
    purple_stained_glass: [137, 50, 184],
    blue_stained_glass: [60, 68, 170],
    brown_stained_glass: [131, 84, 50],
    green_stained_glass: [94, 124, 22],
    red_stained_glass: [176, 46, 38],
    black_stained_glass: [29, 29, 33],
};

export function hexToRgb(hex: string): RGB {
    const h = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b];
}

export function beaconColor(stack: RGB[]): RGB {
    if (stack.length === 0) return [0, 0, 0];
    let [r, g, b] = stack[0].map((c) => Math.round(c)) as RGB;
    for (let i = 1; i < stack.length; i++) {
        const [nr, ng, nb] = stack[i].map((c) => Math.round(c));
        r = Math.round((r + nr) / 2);
        g = Math.round((g + ng) / 2);
        b = Math.round((b + nb) / 2);
    }
    return [r, g, b];
}

function srgbToLinearChannel(v: number) {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToXyz(rgb: RGB) {
    const r = srgbToLinearChannel(rgb[0]);
    const g = srgbToLinearChannel(rgb[1]);
    const b = srgbToLinearChannel(rgb[2]);
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
    return [x * 100, y * 100, z * 100];
}

function f_xyz_to_lab(t: number) {
    const delta = 6 / 29;
    return t > Math.pow(delta, 3) ? Math.cbrt(t) : (t / (3 * delta * delta)) + (4 / 29);
}

export function rgbToLab(rgb: RGB): [number, number, number] {
    const [x, y, z] = rgbToXyz(rgb);
    const Xn = 95.047;
    const Yn = 100.0;
    const Zn = 108.883;
    const fx = f_xyz_to_lab(x / Xn);
    const fy = f_xyz_to_lab(y / Yn);
    const fz = f_xyz_to_lab(z / Zn);
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return [L, a, b];
}

export function deltaE2000(lab1: [number, number, number], lab2: [number, number, number]) {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const avgC = (C1 + C2) / 2.0;
    const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);
    const avgCp = (C1p + C2p) / 2.0;
    function hp_f(x: number, y: number) {
        if (x === 0 && y === 0) return 0;
        const h = Math.atan2(y, x) * (180 / Math.PI);
        return h >= 0 ? h : h + 360;
    }
    const h1p = hp_f(a1p, b1);
    const h2p = hp_f(a2p, b2);
    let deltahp: number;
    if (C1p * C2p === 0) deltahp = 0;
    else if (Math.abs(h2p - h1p) <= 180) deltahp = h2p - h1p;
    else if (h2p - h1p > 180) deltahp = h2p - h1p - 360;
    else deltahp = h2p - h1p + 360;
    const deltaLp = L2 - L1;
    const deltaCp = C2p - C1p;
    const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp * Math.PI) / 360.0);
    const avgL = (L1 + L2) / 2.0;
    const avghp = (function () {
        if (C1p * C2p === 0) return h1p + h2p;
        if (Math.abs(h1p - h2p) <= 180) return (h1p + h2p) / 2.0;
        if (h1p + h2p < 360) return (h1p + h2p + 360) / 2.0;
        return (h1p + h2p - 360) / 2.0;
    })();
    const T = 1 - 0.17 * Math.cos(((avghp - 30) * Math.PI) / 180.0) + 0.24 * Math.cos(((2 * avghp) * Math.PI) / 180.0) + 0.32 * Math.cos(((3 * avghp + 6) * Math.PI) / 180.0) - 0.20 * Math.cos(((4 * avghp - 63) * Math.PI) / 180.0);
    const deltaRo = 30 * Math.exp(-(( (avghp - 275) / 25) ** 2));
    const Rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
    const Sl = 1 + ((0.015 * ((avgL - 50) * (avgL - 50))) / Math.sqrt(20 + ((avgL - 50) * (avgL - 50))));
    const Sc = 1 + 0.045 * avgCp;
    const Sh = 1 + 0.015 * avgCp * T;
    const Rt = -Math.sin((2 * deltaRo * Math.PI) / 180.0) * Rc;
    const kl = 1.0, kc = 1.0, kh = 1.0;
    return Math.sqrt(
        Math.pow(deltaLp / (kl * Sl), 2) +
        Math.pow(deltaCp / (kc * Sc), 2) +
        Math.pow(deltaHp / (kh * Sh), 2) +
        Rt * (deltaCp / (kc * Sc)) * (deltaHp / (kh * Sh))
    );
}

export function deltaE_lab_rgb(c1: RGB, c2: RGB) {
    return deltaE2000(rgbToLab(c1), rgbToLab(c2));
}

export function calculateStackAccuracy(stack: RGB[], target: RGB) {
    const color = beaconColor(stack);
    const dist = deltaE_lab_rgb(target, color); // target first
    const maxDist = deltaE_lab_rgb([0, 0, 0], [255, 255, 255]);
    const accuracy = Math.max(0, 1 - dist / maxDist) * 100;
    return { color, dist, accuracy };
}