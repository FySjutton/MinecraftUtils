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

    const t = opts.thickness ?? 1;

    if (opts.mode === "thin") {
        const surrounded =
            Array.from({ length: t }, (_, i) => i + 1).every(d =>
                insideEllipse(cx + d, cy, rx, ry) && insideEllipse(cx - d, cy, rx, ry)
            ) &&
            Array.from({ length: t }, (_, i) => i + 1).every(d =>
                insideEllipse(cx, cy + d, rx, ry) && insideEllipse(cx, cy - d, rx, ry)
            );
        return inside && !surrounded;
    }

    if (opts.mode === "thick") {
        const neighbors: [number, number][] = [];
        for (let dx = -t; dx <= t; dx++) {
            for (let dy = -t; dy <= t; dy++) {
                if (dx === 0 && dy === 0) continue;
                neighbors.push([dx, dy]);
            }
        }
        const surrounded = neighbors.every(([dx, dy]) => insideEllipse(cx + dx, cy + dy, rx, ry));
        return inside && !surrounded;
    }

    return false;
}
