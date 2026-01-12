import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";

function degToRad(deg: number) {
    return (deg * Math.PI) / 180;
}

function pointInPolygon(px: number, py: number, poly: [number, number][]) {
    let inside = false;
    const EPS = 1e-9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const intersectsY = (yi <= py && py < yj) || (yj <= py && py < yi);
        if (!intersectsY) continue;
        const xIntersect = xi + ((xj - xi) * (py - yi)) / (yj - yi);
        if (px < xIntersect - EPS) inside = !inside;
    }
    return inside;
}

function regularPolygonVerts(
    sides: number,
    width: number,
    height: number,
    rotationDeg = 0
): [number, number][] {
    const verts: [number, number][] = [];
    let startAngle = -Math.PI / 2; // default pointy up
    if (sides % 2 === 0) startAngle = -Math.PI / sides; // flat bottom

    for (let i = 0; i < sides; i++) {
        const angle = startAngle + (i * 2 * Math.PI) / sides;
        verts.push([Math.cos(angle), Math.sin(angle)]);
    }

    const rot = degToRad(rotationDeg);
    let rotated = verts.map(([x, y]) => [
        x * Math.cos(rot) - y * Math.sin(rot),
        x * Math.sin(rot) + y * Math.cos(rot),
    ] as [number, number]);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of rotated) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;

    const scale = Math.min(width / currentWidth, height / currentHeight);

    rotated = rotated.map(([x, y]) => [x * scale, y * scale] as [number, number]);

    minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
    for (const [x, y] of rotated) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const offsetX = (minX + maxX) / 2;
    const offsetY = (minY + maxY) / 2;

    return rotated.map(([x, y]) => [x - offsetX, y - offsetY] as [number, number]);
}

export const PolygonGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const sides = opts.shape === "Hexagon" ? 6 : Math.max(3, Math.floor(opts.sides ?? 6));

        const px = x + 0.5 - opts.width / 2;
        const py = y + 0.5 - opts.height / 2;

        if (opts.width <= 1 || opts.height <= 1) return Math.abs(px) < 0.5 && Math.abs(py) < 0.5;
        const verts = regularPolygonVerts(sides, opts.width, opts.height, opts.rotation ?? 0);

        if (!pointInPolygon(px, py, verts)) return false;

        const insideAt = (ox: number, oy: number) => pointInPolygon(px + ox, py + oy, verts);
        if (opts.mode === "filled") return true;
        if (opts.mode === "thin") return !(insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0));
        if (opts.mode === "thick") {
            const core = insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0);
            if (!core) return true;
            return !(insideAt(-1, -1) && insideAt(1, -1) && insideAt(-1, 1) && insideAt(1, 1));
        }
        return false;
    },
};
