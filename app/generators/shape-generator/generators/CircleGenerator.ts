import { ShapeGenerator } from "@/app/generators/shape-generator/ShapeGenerator";

function insideEllipse(x: number, y: number, rx: number, ry: number) {
    return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
}

export const CircleGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const rx = opts.width / 2;
        const ry = opts.height / 2;

        const inside = insideEllipse(x, y, rx, ry);

        if (opts.mode === "filled") {
            return inside;
        }

        if (opts.mode === "thin") {
            const up = insideEllipse(x, y - 1, rx, ry);
            const down = insideEllipse(x, y + 1, rx, ry);
            const left = insideEllipse(x - 1, y, rx, ry);
            const right = insideEllipse(x + 1, y, rx, ry);

            return inside && !(up && down && left && right);
        }

        if (opts.mode === "thick") {
            const t = opts.thickness ?? 1;

            const neighbors: [number, number][] = [];
            for (let dx = -t; dx <= t; dx++) {
                for (let dy = -t; dy <= t; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    neighbors.push([dx, dy]);
                }
            }

            const surrounded = neighbors.every(([dx, dy]) =>
                insideEllipse(x + dx, y + dy, rx, ry)
            );

            return inside && !surrounded;
        }

        return false;
    },

    getSize: (opts) => {
        return {
            width: opts.width,
            height: opts.height,
        };
    },
};
