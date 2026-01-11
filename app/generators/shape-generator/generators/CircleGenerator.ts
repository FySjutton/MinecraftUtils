import {ShapeGenerator} from "@/app/generators/shape-generator/ShapeGenerator";

function insideEllipse(x: number, y: number, rx: number, ry: number) {
    return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
}

export const CircleGenerator: ShapeGenerator = {
    isFilled: (x, y, opts) => {
        const cx = x - (opts.width - 1) / 2;
        const cy = y - (opts.height - 1) / 2;
        const rx = opts.width / 2;
        const ry = opts.height / 2;

        if (opts.mode === "filled") {
            return insideEllipse(cx, cy, rx, ry);
        }

        if (opts.mode === "thin") {
            const up = insideEllipse(cx, cy - 1, rx, ry);
            const down = insideEllipse(cx, cy + 1, rx, ry);
            const left = insideEllipse(cx - 1, cy, rx, ry);
            const right = insideEllipse(cx + 1, cy, rx, ry);

            return insideEllipse(cx, cy, rx, ry) && !(up && down && left && right);
        }

        if (opts.mode === "thick") {
            const t = Math.max(1, Math.floor(opts.thickness ?? 1));
            const maxR = Math.max(rx, ry);
            const distNorm = Math.sqrt((cx * cx) / (rx * rx) + (cy * cy) / (ry * ry));
            const inwardPx = (1 - distNorm) * maxR;
            return inwardPx >= 0 && inwardPx < t;
        }

        return false;
    },
};
