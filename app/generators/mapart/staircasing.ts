import { Brightness, StaircasingMode, Structure3D, Block3D, BlockSelection } from './utils';
import { BLOCK_GROUPS } from './utils';

export function calculate3DStructure(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    blockSelection: BlockSelection,
    mode: StaircasingMode,
    addSupportBlocks: boolean,
    supportBlock: string = 'netherrack'
): Structure3D {
    const height = brightnessMap.length; // Z dimension
    const width = brightnessMap[0].length; // X dimension

    // Calculate Y-levels based on brightness
    const yLevels = calculateYLevels(brightnessMap, mode);

    // Build block list
    const blocks: Block3D[] = [];

    const supportBlockName = supportBlock.includes(':') ? supportBlock : `minecraft:${supportBlock}`;

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            const calculatedY = yLevels[z][x];

            // Get selected block for this color group
            const selectedBlockName = blockSelection[groupId] || BLOCK_GROUPS[groupId]?.[0] || 'stone';
            const fullBlockName = selectedBlockName.includes(':') ? selectedBlockName : `minecraft:${selectedBlockName}`;

            if (addSupportBlocks) {
                // Support block at calculated Y
                blocks.push({
                    x,
                    y: calculatedY,
                    z,
                    blockName: supportBlockName
                });
                // Colored block one above support
                blocks.push({
                    x,
                    y: calculatedY + 1,
                    z,
                    blockName: fullBlockName
                });
            } else {
                // Just the colored block
                blocks.push({
                    x,
                    y: calculatedY,
                    z,
                    blockName: fullBlockName
                });
            }
        }
    }

    // Calculate structure dimensions
    const minY = Math.min(...blocks.map(b => b.y));
    const maxY = Math.max(...blocks.map(b => b.y));
    const depth = maxY - minY + 1;

    return {
        width,
        height,
        depth,
        blocks
    };
}

function calculateYLevels(
    brightnessMap: Brightness[][],
    mode: StaircasingMode
): number[][] {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;
    const yLevels: number[][] = [];

    if (mode === StaircasingMode.NONE) {
        // Flat: all at Y=0
        for (let z = 0; z < height; z++) {
            yLevels[z] = new Array(width).fill(0);
        }
        return yLevels;
    }

    // Staircasing: use relative heights
    const baseY = getBaseYForMode(mode);
    let minY = baseY;
    let maxY = baseY;

    // Process from north to south (Z=0 to Z=height-1)
    for (let z = 0; z < height; z++) {
        yLevels[z] = [];
        for (let x = 0; x < width; x++) {
            const brightness = brightnessMap[z][x];

            if (z === 0) {
                // First row: base height
                yLevels[z][x] = baseY;
            } else {
                // Calculate based on north neighbor
                const northY = yLevels[z - 1][x];
                yLevels[z][x] = calculateYForBrightness(northY, brightness, mode);
            }

            // Track min/max
            if (yLevels[z][x] < minY) minY = yLevels[z][x];
            if (yLevels[z][x] > maxY) maxY = yLevels[z][x];
        }
    }

    // Normalize: shift so minimum is 0
    if (minY < 0) {
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                yLevels[z][x] -= minY;
            }
        }
    }

    return yLevels;
}

function getBaseYForMode(mode: StaircasingMode): number {
    switch (mode) {
        case StaircasingMode.STANDARD:
            return 0;
        case StaircasingMode.VALLEY:
            return 2;
        case StaircasingMode.VALLEY_3_LEVEL:
            return 2;
        default:
            return 0;
    }
}

function calculateYForBrightness(
    northY: number,
    desiredBrightness: Brightness,
    mode: StaircasingMode
): number {
    let targetY = northY;

    switch (desiredBrightness) {
        case Brightness.HIGH:
            targetY = northY + 1;
            break;
        case Brightness.NORMAL:
            targetY = northY;
            break;
        case Brightness.LOW:
            targetY = northY - 1;
            break;
    }

    // Apply mode constraints
    if (mode === StaircasingMode.VALLEY) {
        // Only descend or stay same
        if (targetY > northY) {
            targetY = northY;
        }
    } else if (mode === StaircasingMode.VALLEY_3_LEVEL) {
        // Limit to 3 levels
        targetY = Math.max(0, Math.min(2, targetY));
    }

    return targetY;
}