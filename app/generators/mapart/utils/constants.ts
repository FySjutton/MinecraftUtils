import blockGroupsData from '../inputs/blocks.json';
import baseColorsData from '../inputs/colors.json';
import aliasesData from '../inputs/aliases.json';
import presetsData from '../inputs/presets.json';

import { Brightness, BlockSelection } from './types';

export const BLOCK_GROUPS: string[][] = blockGroupsData as string[][];
export const BASE_COLORS: number[] = baseColorsData as number[];
export const ALIASES: Record<string, string> = aliasesData as Record<string, string>;

export type Preset = keyof typeof presetsData;
export const Presets = Object.keys(presetsData) as string[];

export const TRANSPARENT_GROUP_ID = -2;

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export function scaleRGB(color: number, brightness: Brightness): number {
    const r = Math.floor(((color >> 16) & 0xff) * brightness / 255);
    const g = Math.floor(((color >> 8) & 0xff) * brightness / 255);
    const b = Math.floor(( color & 0xff) * brightness / 255);
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function getAllowedBrightnesses(groupId: number): Brightness[] {
    if (groupId === 11) return [Brightness.HIGH];
    return [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH];
}

export function getEverythingBlockSelection(): BlockSelection {
    const selection: BlockSelection = {};
    BLOCK_GROUPS.forEach((group, groupId) => {
        if (group && group.length > 0) selection[groupId] = group[0];
    });
    return selection;
}

import type { MaterialCount } from './types';
import { SupportBlockMode } from './types';

export function getMaterialList(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    supportMode: SupportBlockMode,
    noobLine: boolean,
): MaterialCount[] {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    const counts = new Map<number, number>();
    for (let z = 0; z < height; z++)
        for (let x = 0; x < width; x++) {
            const g = groupIdMap[z][x];
            if (g === TRANSPARENT_GROUP_ID) continue;
            counts.set(g, (counts.get(g) ?? 0) + 1);
        }

    const sorted = Array.from(counts.entries())
        .map(([groupId, count]) => ({ groupId, brightness: Brightness.NORMAL, count }))
        .sort((a, b) => b.count - a.count);

    let noobLineCount = 0;
    if (noobLine) {
        for (let x = 0; x < width; x++) {
            if (groupIdMap[0][x] !== TRANSPARENT_GROUP_ID) noobLineCount++;
        }
    }

    let supportCount = noobLineCount;
    if (supportMode !== SupportBlockMode.NONE) {
        for (let z = 0; z < height; z++)
            for (let x = 0; x < width; x++) {
                if (groupIdMap[z][x] === TRANSPARENT_GROUP_ID) continue;
                const y = yMap[z][x];
                if (supportMode === SupportBlockMode.THIN) {
                    if (y - 1 >= 0) supportCount++;
                } else {
                    supportCount += y - Math.max(0, y - 2);
                }
            }
    }

    if (supportCount === 0) return sorted;
    return [{ groupId: -1, brightness: Brightness.NORMAL, count: supportCount }, ...sorted];
}