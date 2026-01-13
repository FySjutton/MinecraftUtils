import {
    getPolygon,
    isPolygon,
    isPolygonLikeShape,
    Shape,
    ShapeMode
} from "@/app/generators/shape-generator/ShapeGenerator";

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
        sides,
    };
};

