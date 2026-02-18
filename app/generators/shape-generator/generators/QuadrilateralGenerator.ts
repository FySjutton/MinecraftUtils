import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";
import {degToRad, handleEdge, pointInPolygon} from "@/app/generators/shape-generator/generators/utils";

function quadVerts(
    topWidth: number,
    bottomWidth: number,
    height: number,
    skew = 0,
    rotationDeg = 0
): [number, number][] {
    let verts: [number, number][] = [
        [-bottomWidth / 2, height / 2],
        [ bottomWidth / 2, height / 2],
        [ topWidth / 2 + skew, -height / 2],
        [-topWidth / 2 + skew, -height / 2],
    ];

    if (rotationDeg !== 0) {
        const rot = degToRad(rotationDeg);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        verts = verts.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos] as [number, number]);
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of verts) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const offsetX = (minX + maxX) / 2;
    const offsetY = (minY + maxY) / 2;

    return verts.map(([x, y]) => [x - offsetX, y - offsetY] as [number, number]);
}

export const QuadrilateralGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const verts = quadVerts(
            opts.topWidth,
            opts.bottomWidth,
            opts.height,
            opts.skew ?? 0,
            opts.rotation ?? 0
        );

        return handleEdge(x, y, verts, opts)
    },

    getSize: (opts) => {
        const verts = quadVerts(
            opts.topWidth,
            opts.bottomWidth,
            opts.height,
            opts.skew ?? 0,
            opts.rotation ?? 0
        );

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [x, y] of verts) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        const minXi = Math.ceil(minX);
        const maxXi = Math.floor(maxX);
        const minYi = Math.ceil(minY);
        const maxYi = Math.floor(maxY);

        const width = (maxXi - minXi + 1) + 2;
        const height = (maxYi - minYi + 1) + 2;

        return { width, height };
    }
};
