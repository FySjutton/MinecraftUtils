"use client";

export type CircleMode = "filled" | "thin" | "thick";

export interface CircleOptions {
    width: number;
    height: number;
    mode: CircleMode;
    thickness?: number;
}

function insideEllipse(x: number, y: number, rx: number, ry: number) {
    return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
}

export function isCircleFilled(x: number, y: number, opts: CircleOptions): boolean {
    const cx = x - (opts.width - 1) / 2;
    const cy = y - (opts.height - 1) / 2;

    const rx = opts.width / 2;
    const ry = opts.height / 2;

    const inside = insideEllipse(cx, cy, rx, ry);
    if (!inside) return false;

    if (opts.mode === "filled") return true;

    if (opts.mode === "thin") {
        const up = insideEllipse(cx, cy - 1, rx, ry);
        const down = insideEllipse(cx, cy + 1, rx, ry);
        const left = insideEllipse(cx - 1, cy, rx, ry);
        const right = insideEllipse(cx + 1, cy, rx, ry);

        const fullySurrounded = up && down && left && right;
        return inside && !fullySurrounded;
    }

    if (opts.mode === "thick") {
        const t = Math.max(1, Math.floor(opts.thickness ?? 1));
        const maxR = Math.max(rx, ry);

        const distNorm = Math.sqrt((cx * cx) / (rx * rx) + (cy * cy) / (ry * ry));
        if (distNorm > 1) return false;

        const inwardPx = (1 - distNorm) * maxR;
        return inwardPx >= 0 && inwardPx < t;
    }

    return false;
}
