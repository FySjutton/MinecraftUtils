import { BlockSelection, ColorDistanceMethod, StaircasingMode, SupportBlockMode } from './types';
import type { DitheringMethodName } from '../dithering/types';

export interface AreaOverrides {
    blockSelection?: BlockSelection;
    ditheringMethod?: DitheringMethodName;
    colorDistanceMethod?: ColorDistanceMethod;
    staircasingMode?: StaircasingMode;
    maxHeight?: number;
    supportMode?: SupportBlockMode;
    supportBlockName?: string;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    fillColor?: string;
    pixelArt?: boolean;
}

export interface MapArea {
    id: string;
    name: string;
    color: string;
    chunkX: number;
    chunkY: number;
    chunkWidth: number;
    chunkHeight: number;
    overrides: AreaOverrides;
}

export function areasOverlap(a: MapArea, b: MapArea): boolean {
    return !(
        a.chunkX + a.chunkWidth <= b.chunkX ||
        b.chunkX + b.chunkWidth <= a.chunkX ||
        a.chunkY + a.chunkHeight <= b.chunkY ||
        b.chunkY + b.chunkHeight <= a.chunkY
    );
}

export const AREA_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
];
