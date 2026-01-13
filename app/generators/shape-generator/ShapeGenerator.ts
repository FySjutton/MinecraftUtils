
import {PolygonGenerator} from "@/app/generators/shape-generator/generators/PolygonGenerator";
import {CircleGenerator} from "@/app/generators/shape-generator/generators/CircleGenerator";
import {QuadrilateralGenerator} from "@/app/generators/shape-generator/generators/QuadrilateralGenerator";

export enum ShapeMode {
    Filled = "filled",
    Thin = "thin",
    Thick = "thick",
}

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

export const primitiveShapes = ["Circle", "Polygon", "Quadrilateral"] as const;

export interface ShapeOptions {
    shape: Shape;
    mode: ShapeMode;
    rotation: number;
    thickness: number;
    width: number;
    height: number;

    // Circle-specific
    lockRatio?: boolean;

    // Polygon-specific
    sides: number;

    // Quadrilateral-specific
    topWidth: number;
    bottomWidth: number;
    skew: number;
}

export const createDefaults = (shape: Shape): ShapeOptions => {
    const standardSize = isPolygonLikeShape(shape) ? 45 : 15;
    const sides = isPolygon(shape) ? getPolygon(shape).sides : 6;

    return {
        shape,
        mode: ShapeMode.Thick,
        rotation: 0,
        thickness: 1,
        width: standardSize,
        height: standardSize,

        // Circle-specific
        lockRatio: true,

        // Polygon-specific
        sides: sides,

        // Quadrilateral-specific
        topWidth: 20,
        bottomWidth: 10,
        skew: 0,
    };
};

const shapeCache = new Map<string, ShapeOptions>();
export function getShapeOptions(shape: Shape): ShapeOptions {
    if (!shapeCache.has(shape)) {
        shapeCache.set(shape, createDefaults(shape));
    }
    return <ShapeOptions>shapeCache.get(shape);
}

export const shapes: string[] = [
    ...primitiveShapes,
    ...polygons.map(p => p.name),
] as const;
export type Shape = typeof shapes[number];

export interface ShapeGenerator {
    isFilled: (x: number, y: number, options: ShapeOptions) => boolean;
}

const polygonGenerators: Record<PolygonShape, ShapeGenerator> = Object.fromEntries(
    polygons.map(p => [p.name, PolygonGenerator])
) as Record<PolygonShape, ShapeGenerator>;

export const generators: Record<Shape, ShapeGenerator> = {
    Circle: CircleGenerator,
    Polygon: PolygonGenerator,
    Quadrilateral: QuadrilateralGenerator,
    ...polygonGenerators,
};

export const isPolygon = (name: string) => polygons.some(p => p.name === name);
export const getPolygon = (name: string): { name: string; sides: number } =>
    polygons.find(p => p.name === name) as { name: string; sides: number };

export function isShapeFilled(x: number, y: number, shape: Shape, opts: ShapeOptions) {
    return generators[shape].isFilled(x, y, opts);
}

export const isPolygonLikeShape = (shape: string): boolean =>
    shape === "Polygon" || polygons.some(p => p.name === shape);
