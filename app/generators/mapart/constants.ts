import blockGroupsData from './utils/blocks.json';
import baseColorsData from './utils/colors.json';
import aliasesData from './utils/aliases.json';
import { BlockSelection } from './types';

export const BLOCK_GROUPS: string[][] = blockGroupsData as string[][];
export const BASE_COLORS: number[] = baseColorsData as number[];
export const ALIASES: Record<string, string> = aliasesData as Record<string, string>;

if (!BLOCK_GROUPS || BLOCK_GROUPS.length === 0) {
    console.error('BLOCK_GROUPS failed to load! Check that @/utils/blocks.json exists and is valid.');
}

if (!BASE_COLORS || BASE_COLORS.length === 0) {
    console.error('BASE_COLORS failed to load! Check that @/utils/colors.json exists and is valid.');
}

console.log(`Loaded ${BLOCK_GROUPS?.length || 0} block groups and ${BASE_COLORS?.length || 0} base colors`);

export function getDefaultBlockSelection(): BlockSelection {
    const selection: BlockSelection = {};
    if (!BLOCK_GROUPS) {
        console.error('Cannot create default selection - BLOCK_GROUPS not loaded');
        return selection;
    }

    BLOCK_GROUPS.forEach((group, groupId) => {
        if (group && group.length > 0) {
            selection[groupId] = group[0];
        }
    });

    console.log(`Created default selection with ${Object.keys(selection).length} blocks selected`);
    return selection;
}