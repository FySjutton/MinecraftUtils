import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";

const SQRT3 = Math.sqrt(3);

const UNIT_VERTS: [number, number][] = [
    [ 1.0,  0.0 ],           // right
    [ 0.5,  SQRT3 / 2 ],     // bottom-right
    [-0.5,  SQRT3 / 2 ],     // bottom-left
    [-1.0,  0.0 ],           // left
    [-0.5, -SQRT3 / 2 ],     // top-left
    [ 0.5, -SQRT3 / 2 ],     // top-right
];

function pointInPolygon(px: number, py: number, poly: [number, number][]) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect =
            (yi > py) !== (yj > py) &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

export const HexagonGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const cx = x - (opts.width - 1) / 2;
        const cy = y - (opts.height - 1) / 2;

        if (opts.width <= 1 || opts.height <= 1) {
            return Math.abs(cx) < 0.5 && Math.abs(cy) < 0.5;
        }

        const scale = Math.min(opts.width / 2, opts.height / SQRT3);
        const verts = UNIT_VERTS.map(([vx, vy]) => [vx * scale, vy * scale] as [number, number]);

        const inside = pointInPolygon(cx, cy, verts);
        if (!inside) return false;

        const insideAt = (ox: number, oy: number) => pointInPolygon(cx + ox, cy + oy, verts);

        if (opts.mode === "filled") return true;

        if (opts.mode === "thin") {
            const up = insideAt(0, -1);
            const down = insideAt(0, 1);
            const left = insideAt(-1, 0);
            const right = insideAt(1, 0);
            return !(up && down && left && right);
        }

        if (opts.mode === "thick") {
            if (!inside) return false;

            const up = insideAt(0, -1);
            const down = insideAt(0, 1);
            const left = insideAt(-1, 0);
            const right = insideAt(1, 0);

            const isThin = !(up && down && left && right);
            if (isThin) return true;

            const upLeft = insideAt(-1, -1);
            const upRight = insideAt(1, -1);
            const downLeft = insideAt(-1, 1);
            const downRight = insideAt(1, 1);

            return !upLeft || !upRight || !downLeft || !downRight;
        }
        return false;
    },
};
