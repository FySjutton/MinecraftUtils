import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";
import { degToRad, pointInPolygon } from "@/app/generators/shape-generator/generators/utils";

function regularPolygonVerts(
    sides: number,
    size: number,
    rotationDeg = 0
): [number, number][] {
    const verts: [number, number][] = [];
    let startAngle = -Math.PI / 2; // pointy up
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

    // scale to requested size
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of rotated) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;
    const scale = Math.min(size / currentWidth, size / currentHeight);

    rotated = rotated.map(([x, y]) => [x * scale, y * scale] as [number, number]);

    // recenter
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
        const size = opts.width;
        if (size <= 1) return Math.abs(x) < 0.5 && Math.abs(y) < 0.5;

        const verts = regularPolygonVerts(opts.sides, size, opts.rotation ?? 0);

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

                    if (!insideAt(dx, dy)) {
                        return true;
                    }
                }
            }
            return false;
        }

        return false;
    },

    getSize: (opts) => ({
        width: opts.width,
        height: opts.height,
    }),
};

