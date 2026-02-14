import { findNearestMapColor } from './colorMatching';
import blockGroupsData from './utils/blocks.json';
import baseColorsData from './utils/colors.json';
import aliasesData from './utils/aliases.json';

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

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
    LOW = 180, // Darkest: -1 block below north neighbor
    NORMAL = 220, // Normal: same height as north neighbor
    HIGH = 255, // Brightest: +1 block above north neighbor
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
    blockName: string; // e.g., "minecraft:stone" or "stone"
}

export function getMaterialList(
    canvas: HTMLCanvasElement,
    enabledGroups: Set<number>,
    useStaircasing: boolean,
    method: ColorDistanceMethod
): MaterialCount[] {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get material list - no canvas context');
        return [];
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Count blocks by group ID only
    const counts = new Map<number, number>();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const nearest = findNearestMapColor(r, g, b, enabledGroups, useStaircasing, method);
        const groupId = nearest.groupId;

        counts.set(groupId, (counts.get(groupId) || 0) + 1);
    }

    // Convert to array and sort by count
    return Array.from(counts.entries())
        .map(([groupId, count]) => ({
            groupId,
            brightness: Brightness.NORMAL,
            count,
        }))
        .sort((a, b) => b.count - a.count);
}

export { numberToRGB } from './colorMatching';
export { findNearestMapColor } from './colorMatching';