import { degToRad, pointInPolygon } from "./utils";
import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";

function getAlignedVerts(opts: {
    topWidth: number;
    bottomWidth: number;
    height: number;
    skew?: number;
    rotation?: number;
}): [number, number][] {
    const { topWidth, bottomWidth, height, skew = 0, rotation = 0 } = opts;

    let verts: [number, number][] = [
        [-bottomWidth / 2,  height / 2],
        [ bottomWidth / 2,  height / 2],
        [ topWidth / 2 + skew, -height / 2],
        [-topWidth / 2 + skew, -height / 2],
    ];

    const rot = degToRad(rotation);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    verts = verts.map(([x, y]) => [
        x * cos - y * sin,
        x * sin + y * cos,
    ]);

    // recenter verts around (0,0)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of verts) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return verts.map(([x, y]) => [x - cx, y - cy]);
}

export const QuadrilateralGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const { mode, thickness = 1 } = opts;

        // x, y are **already centered** — no offsets
        const px = x;
        const py = y;

        const verts = getAlignedVerts(opts);

        const inside = pointInPolygon(px, py, verts);
        if (mode === "filled") return inside;

        const insideAt = (ox: number, oy: number) => pointInPolygon(px + ox, py + oy, verts);

        if (mode === "thin") {
            return !(insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0));
        }

        if (mode === "thick") {
            const neighbors: [number, number][] = [];
            for (let dx = -thickness; dx <= thickness; dx++)
                for (let dy = -thickness; dy <= thickness; dy++)
                    if (dx !== 0 || dy !== 0) neighbors.push([dx, dy]);

            const surrounded = neighbors.every(([dx, dy]) => insideAt(dx, dy));
            return inside && !surrounded;
        }

        return false;
    },

    getSize: (opts) => {
        const { thickness = 1 } = opts;

        const verts = getAlignedVerts(opts);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [x, y] of verts) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        return {
            width: Math.ceil(maxX - minX) + thickness * 2,
            height: Math.ceil(maxY - minY) + thickness * 2,
        };
    },
};
