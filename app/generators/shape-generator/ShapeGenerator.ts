import {CircleGenerator} from "@/app/generators/shape-generator/generators/CircleGenerator";
import {PolygonGenerator} from "@/app/generators/shape-generator/generators/PolygonGenerator";

export type ShapeMode = "filled" | "thin" | "thick";

export const shapes: string[] = ["Circle", "Hexagon", "Polygon"];
export type Shape = (typeof shapes)[number];

export interface ShapeOptions {
    shape: Shape
    width: number;
    height: number;
    mode: ShapeMode;
    thickness?: number;
    sides?: number;
}

export interface ShapeGenerator {
    isFilled: (x: number, y: number, options: ShapeOptions) => boolean;
}

const generators: Record<Shape, ShapeGenerator> = {
    Circle: CircleGenerator,
    Hexagon: PolygonGenerator,
    Polygon: PolygonGenerator,
};

export function isShapeFilled(x: number, y: number, opts: ShapeOptions & { shape: Shape }) {
    return generators[opts.shape].isFilled(x, y, opts);
}
