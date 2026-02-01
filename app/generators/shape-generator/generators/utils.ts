import {ShapeOptions} from "@/app/generators/shape-generator/ShapeGenerator";

export function degToRad(deg: number) {
    return (deg * Math.PI) / 180;
}

export function pointInPolygon(px: number, py: number, poly: [number, number][]) {
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

export function handleEdge(x: number, y: number, verts: [number, number][], opts: ShapeOptions) {
    if (!pointInPolygon(x, y, verts)) return false;

    const insideAt = (ox: number, oy: number) => pointInPolygon(x + ox, y + oy, verts);

    if (opts.mode === "filled") return true;
    if (opts.mode === "thin") {
        return !(insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0));
    }

    if (opts.mode === "thick") {
        const t = opts.thickness ?? 1;

        if (t === 1) {
            const core = insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0);
            if (!core) return true;
            return !(insideAt(-1, -1) && insideAt(1, -1) && insideAt(-1, 1) && insideAt(1, 1));
        }

        for (let dx = -t; dx <= t; dx++) {
            for (let dy = -t; dy <= t; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (Math.sqrt(dx * dx + dy * dy) > t) continue;

                if (!insideAt(dx, dy)) return true;
            }
        }

        return false;
    }

    return false;
}