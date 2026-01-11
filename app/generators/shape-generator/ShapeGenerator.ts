import {HexagonGenerator} from "@/app/generators/shape-generator/generators/HexagonGenerator";
import {CircleGenerator} from "@/app/generators/shape-generator/generators/CircleGenerator";

export type ShapeMode = "filled" | "thin" | "thick";

export const shapes: string[] = ["Circle", "Hexagon"];
export type Shape = (typeof shapes)[number];

export interface ShapeOptions {
    shape: Shape
    width: number;
    height: number;
    mode: ShapeMode;
    thickness?: number;
}

export interface ShapeGenerator {
    isFilled: (x: number, y: number, options: ShapeOptions) => boolean;
}

const generators: Record<Shape, ShapeGenerator> = {
    Circle: CircleGenerator,
    Hexagon: HexagonGenerator,
};

export function isShapeFilled(x: number, y: number, opts: ShapeOptions & { shape: Shape }) {
    return generators[opts.shape].isFilled(x, y, opts);
}
