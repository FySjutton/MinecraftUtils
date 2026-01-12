import {ShapeGenerator, ShapeOptions} from "@/app/generators/shape-generator/ShapeGenerator";
import { pointInPolygon, degToRad } from "./utils";

export interface QuadrilateralOptions extends ShapeOptions {
    topWidth: number;
    bottomWidth: number;
    skew?: number;
}

export const QuadrilateralGenerator = (): ShapeGenerator<QuadrilateralOptions> => ({
    isFilled: (x, y, opts: QuadrilateralOptions & { width: number; height: number }) => {
        const { topWidth, bottomWidth, height, skew = 0, rotation = 0, mode, thickness = 1 } = opts;

        // center pixel coordinates
        const px = x + 0.5 - opts.width / 2;
        const py = y + 0.5 - opts.height / 2;

        // compute vertices
        let verts: [number, number][] = [
            [-bottomWidth / 2,  height / 2],             // bl
            [ bottomWidth / 2,  height / 2],             // br
            [ topWidth / 2 + skew, -height / 2],         // tr
            [-topWidth / 2 + skew, -height / 2],         // tl
        ];

        // apply rotation
        const rot = degToRad(rotation);
        verts = verts.map(([vx, vy]) => [
            vx * Math.cos(rot) - vy * Math.sin(rot),
            vx * Math.sin(rot) + vy * Math.cos(rot),
        ]);

        const inside = pointInPolygon(px, py, verts);
        if (mode === "filled") return inside;

        const insideAt = (ox: number, oy: number) => pointInPolygon(px + ox, py + oy, verts);

        if (mode === "thin") return !(insideAt(0, -1) && insideAt(0, 1) && insideAt(-1, 0) && insideAt(1, 0));

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
});
