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

export function getEverythingBlockSelection(): BlockSelection {
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
    STANDARD_CUSTOM = 'standard_custom',
    VALLEY = 'valley',
    VALLEY_CUSTOM = 'valley_custom',
}

export const StaircasingModes: Record<StaircasingMode, { title: string; description: string }> = {
    [StaircasingMode.NONE]: {
        title: 'Flat Map (2d)',
        description: 'Completely flat map, less accurate',
    },
    [StaircasingMode.STANDARD]: {
        title: 'Classic',
        description: 'Full 3d map, fully accurate',
    },
    [StaircasingMode.STANDARD_CUSTOM]: {
        title: 'Classic Limited Height (%s)',
        description: 'Limited 3d map, mostly accurate, easier to build',
    },
    [StaircasingMode.VALLEY]: {
        title: 'Valley',
        description: 'Valley map, fully accurate, easier to build',
    },
    [StaircasingMode.VALLEY_CUSTOM]: {
        title: 'Valley Limited Height (%s)',
        description: 'Limited valley map, mostly accurate, even easier to build',
    },
};

export enum SupportBlockMode {
    NONE = 'None',
    THIN = 'All (Thin)',
    HEAVY = 'All (Heavy)',
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
    groupIdMap: number[][],
    yMap: number[][],
    supportMode: SupportBlockMode,
    mapWidth: number
): MaterialCount[] {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    const materialCounts = new Map<number, number>();
    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            materialCounts.set(groupId, (materialCounts.get(groupId) || 0) + 1);
        }
    }

    const sorted = Array.from(materialCounts.entries())
        .map(([groupId, count]) => ({ groupId, brightness: Brightness.NORMAL, count }))
        .sort((a, b) => b.count - a.count);

    let supportCount = mapWidth * 128;
    if (supportMode != SupportBlockMode.NONE) {
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                const y = yMap[z][x];
                if (supportMode === SupportBlockMode.THIN) {
                    if (y - 1 >= 0) supportCount++;
                } else if (supportMode === SupportBlockMode.HEAVY) {
                    supportCount += y - Math.max(0, y - 2);
                }
            }
        }
    }

    const supportEntry = {
        groupId: -1,
        brightness: Brightness.NORMAL,
        count: supportCount,
    };

    return [supportEntry, ...sorted];
}

export { numberToRGB } from './colorMatching';
export { getColorWithBrightness } from './colorMatching';