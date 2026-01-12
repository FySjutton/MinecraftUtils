import {Shape, ShapeMode} from "@/app/generators/shape-generator/ShapeGenerator";

export type ShapeOptions =
    | CircleOptions
    | PolygonOptions;

export interface CircleOptions {
    width: number;
    height: number;
    mode: ShapeMode;
    rotation: number;
    thickness: number;
    lockRatio: boolean;
}

export interface PolygonOptions {
    size: number;
    sides: number;
    mode: ShapeMode;
    rotation: number;
    thickness: number;
}

