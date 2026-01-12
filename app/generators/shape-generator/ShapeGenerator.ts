import {
    PolygonOptions,
    ShapeOptions
} from "@/app/generators/shape-generator/generators/ShapeGeneratorTypes";
import {PolygonGenerator} from "@/app/generators/shape-generator/generators/PolygonGenerator";
import {CircleGenerator} from "@/app/generators/shape-generator/generators/CircleGenerator";

export type ShapeMode = "filled" | "thin" | "thick";

export const polygons = [
    { name: "Triangle", sides: 3 },
    { name: "Square", sides: 4 },
    { name: "Pentagon", sides: 5 },
    { name: "Hexagon", sides: 6 },
    { name: "Heptagon", sides: 7 },
    { name: "Octagon", sides: 8 },
    { name: "Nonagon", sides: 9 },
    { name: "Decagon", sides: 10 },
] as const;

type PolygonShape = typeof polygons[number]["name"];

export const primitiveShapes = ["Circle", "Polygon"] as const;

export const shapes: string[] = [
    ...primitiveShapes,
    ...polygons.map(p => p.name),
] as const;
export type Shape = typeof shapes[number];

export interface ShapeGenerator<Opts = ShapeOptions> {
    isFilled: (x: number, y: number, options: Opts) => boolean;
}

const polygonGenerators: Record<PolygonShape, ShapeGenerator<PolygonOptions>> = Object.fromEntries(
    polygons.map(p => [p.name, PolygonGenerator])
) as Record<PolygonShape, ShapeGenerator<PolygonOptions>>;

export const generators: Record<Shape, ShapeGenerator<any>> = {
    Circle: CircleGenerator,
    Polygon: PolygonGenerator,
    ...polygonGenerators,
};

export const isPolygon = (name: string) => polygons.some(p => p.name === name);
export const getPolygon = (name: string): { name: string; sides: number } =>
    polygons.find(p => p.name === name) as { name: string; sides: number };

export function isShapeFilled(x: number, y: number, shape: Shape, opts: ShapeOptions) {
    return generators[shape].isFilled(x, y, opts);
}
