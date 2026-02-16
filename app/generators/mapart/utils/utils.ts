import { getColorWithBrightness, numberToRGB } from './colorMatching';
import blockGroupsData from '../inputs/blocks.json';
import baseColorsData from '../inputs/colors.json';
import aliasesData from '../inputs/aliases.json';
import presetsData from '../inputs/presets.json';
import ditheringMethods from "@/app/generators/mapart/inputs/dithering.json";
import {DitheringMethodName} from "@/app/generators/mapart/utils/dithering";

export const BLOCK_GROUPS: string[][] = blockGroupsData as string[][];
export const BASE_COLORS: number[] = baseColorsData as number[];
export const ALIASES: Record<string, string> = aliasesData as Record<string, string>;

export function getDefaultBlockSelection(): BlockSelection {
    const selection: BlockSelection = {};
    if (!BLOCK_GROUPS) {
        return selection;
    }

    BLOCK_GROUPS.forEach((group, groupId) => {
        if (group && group.length > 0) {
            selection[groupId] = group[0];
        }
    });

    return selection;
}

export function getAllowedBrightnesses(groupId: number): Brightness[] {
    if (groupId === 11) return [Brightness.HIGH];
    return [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH];
}

export type Preset = keyof typeof presetsData;
export const Presets = Object.keys(presetsData) as string[];

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function scaleRGB(color: number, brightness: Brightness): number {
    const r = ((color >> 16) & 0xff) * brightness / 255;
    const g = ((color >> 8) & 0xff) * brightness / 255;
    const b = (color & 0xff) * brightness / 255;

    return ((Math.floor(r) & 0xff) << 16) | ((Math.floor(g) & 0xff) << 8) | (Math.floor(b) & 0xff);
}

export interface ProcessingStats {
    width: number;
    height: number;
    totalBlocks: number;
    uniqueBlocks: number;
}

export interface BlockSelection {
    [groupId: number]: string | null;
}

export enum Brightness {
    LOW = 180,
    NORMAL = 220,
    HIGH = 255,
}

export interface MaterialCount {
    groupId: number;
    brightness: Brightness;
    count: number;
}

export enum ColorDistanceMethod {
    EUCLIDEAN = 'euclidean',
    WEIGHTED_RGB = 'weighted_rgb',
    DELTA_E_2000 = 'delta_e_2000',
}

export enum StaircasingMode {
    NONE = 'none',
    STANDARD = 'standard',
    VALLEY = 'valley',
    VALLEY_3_LEVEL = 'valley_3_level',
}

export interface Structure3D {
    width: number;
    height: number;
    depth: number;
    blocks: Block3D[];
}

export interface Block3D {
    x: number;
    y: number;
    z: number;
    blockName: string;
}

export function getMaterialList(
    brightnessMap: Brightness[][],
    groupIdMap: number[][]
): MaterialCount[] {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    // Count materials by groupId
    const materialCounts = new Map<number, number>();

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            materialCounts.set(groupId, (materialCounts.get(groupId) || 0) + 1);
        }
    }

    // Convert to array and sort by count
    return Array.from(materialCounts.entries())
        .map(([groupId, count]) => ({
            groupId,
            brightness: Brightness.NORMAL,
            count,
        }))
        .sort((a, b) => b.count - a.count);
}

export { numberToRGB } from './colorMatching';
export { getColorWithBrightness } from './colorMatching';