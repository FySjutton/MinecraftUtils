import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";

function pointInPolygon(px: number, py: number, poly: [number, number][]) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];

        const intersect =
            (yi > py) !== (yj > py) &&
            px <= ((xj - xi) * (py - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }
    return inside;
}

function regularPolygonVerts(sides: number, radiusX: number, radiusY: number) {
    const verts: [number, number][] = [];
    const step = (Math.PI * 2) / sides;
    const start = -Math.PI / 2; // point up

    for (let i = 0; i < sides; i++) {
        const a = start + i * step;
        verts.push([
            Math.cos(a) * radiusX,
            Math.sin(a) * radiusY,
        ]);
    }

    return verts;
}

export const PolygonGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const sides =
            opts.shape === "Hexagon"
                ? 6
                : Math.max(3, Math.floor(opts.sides ?? 6));

        const cx = x - (opts.width - 1) / 2;
        const cy = y - (opts.height - 1) / 2;

        if (opts.width <= 1 || opts.height <= 1) {
            return Math.abs(cx) < 0.5 && Math.abs(cy) < 0.5;
        }

        const rx = opts.width / 2;
        const ry = opts.height / 2;

        const verts = regularPolygonVerts(sides, rx, ry);

        // sample at pixel centers
        const inside = pointInPolygon(cx + 0.5, cy + 0.5, verts);
        if (!inside) return false;

        const insideAt = (ox: number, oy: number) =>
            pointInPolygon(cx + ox + 0.5, cy + oy + 0.5, verts);

        if (opts.mode === "filled") {
            return true;
        }

        if (opts.mode === "thin") {
            const up = insideAt(0, -1);
            const down = insideAt(0, 1);
            const left = insideAt(-1, 0);
            const right = insideAt(1, 0);
            return !(up && down && left && right);
        }

        if (opts.mode === "thick") {
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
