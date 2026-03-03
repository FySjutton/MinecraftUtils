import blockGroupsData from '../inputs/blocks.json';
import baseColorsData from '../inputs/colors.json';
import aliasesData from '../inputs/aliases.json';
import presetsData from '../inputs/presets.json';

import { Brightness, BlockSelection, PaletteConfig, PaletteGroup } from './types';

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
    // Water only supports HIGH as of now
    if (groupId === 11) return [Brightness.HIGH];
    return [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH];
}

export function getEverythingBlockSelection(): BlockSelection {
    const selection: BlockSelection = {};
    BLOCK_GROUPS.forEach((group, groupId) => {
        if (group && group.length > 0) {
            selection[groupId] = group[0];
        }
    });
    return selection;
}

export function getEverythingBlockSelectionFromPalette(palette: PaletteConfig): BlockSelection {
    const selection: BlockSelection = {};
    for (const group of palette.groups) {
        if (group.blocks.length > 0) {
            selection[group.groupId] = group.blocks[0].name;
        }
    }
    return selection;
}

export function buildDefaultPalette(): PaletteConfig {
    return {
        groups: BLOCK_GROUPS.map((blocks, index) => ({
            groupId: index,
            color: BASE_COLORS[index] ?? 0,
            blocks: blocks.map(name => ({ name })),
            brightness: index === 11
                ? [Brightness.HIGH]
                : [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH],
            isCustom: false,
        })).filter(g => g.blocks.length > 0),
    };
}

let _workerColorMap: Map<number, number> | null = null;
let _workerBrightnessMap: Map<number, Brightness[]> | null = null;

export function setWorkerColorMap(map: Map<number, number> | null): void {
    _workerColorMap = map;
}

export function setWorkerBrightnessMap(map: Map<number, Brightness[]> | null): void {
    _workerBrightnessMap = map;
}

export function getWorkerAllowedBrightnesses(groupId: number): Brightness[] {
    return _workerBrightnessMap?.get(groupId) ?? getAllowedBrightnesses(groupId);
}

export function getWorkerBaseColor(groupId: number): number | undefined {
    return _workerColorMap?.get(groupId) ?? BASE_COLORS[groupId];
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
    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const g = groupIdMap[z][x];
            if (g === TRANSPARENT_GROUP_ID) {
                continue;
            }
            counts.set(g, (counts.get(g) ?? 0) + 1);
        }
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
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                if (groupIdMap[z][x] === TRANSPARENT_GROUP_ID) {
                    continue;
                }
                const y = yMap[z][x];
                if (supportMode === SupportBlockMode.THIN) {
                    if (y - 1 >= 0) {
                        supportCount++;
                    }
                } else {
                    supportCount += y - Math.max(0, y - 2);
                }
            }
        }
    }

    if (supportCount === 0) {
        return sorted;
    }
    return [{ groupId: -1, brightness: Brightness.NORMAL, count: supportCount }, ...sorted];
}