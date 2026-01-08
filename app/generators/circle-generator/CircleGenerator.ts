export type CircleMode = "filled" | "thin" | "thick";

export interface CircleOptions {
    width: number;
    height: number;
    mode: CircleMode;
}

function insideEllipse(
    x: number,
    y: number,
    rx: number,
    ry: number
) {
    return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
}

export function isCircleFilled(
    x: number,
    y: number,
    opts: CircleOptions
): boolean {
    const cx = x - (opts.width - 1) / 2;
    const cy = y - (opts.height - 1) / 2;

    const rx = opts.width / 2;
    const ry = opts.height / 2;

    const inside = insideEllipse(cx, cy, rx, ry);
    if (!inside) return false;

    if (opts.mode === "filled") return true;

    const neighbors = [
        [1, 0], [-1, 0],
        [0, 1], [0, -1],
        [1, 1], [-1, -1],
        [1, -1], [-1, 1],
    ];

    const surrounded = neighbors.every(([dx, dy]) =>
        insideEllipse(cx + dx, cy + dy, rx, ry)
    );

    if (opts.mode === "thin") {
        return !surrounded;
    }

    // thick = one-block shell
    return inside && !surrounded;
}
