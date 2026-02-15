import { Brightness, StaircasingMode, Structure3D, Block3D, BlockSelection } from './utils';
import { BLOCK_GROUPS } from './utils';

export function calculate3DStructure(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    blockSelection: BlockSelection,
    mode: StaircasingMode,
    addSupportBlocks: boolean,
    supportBlock: string = 'netherrack'
): Structure3D {
    const height = brightnessMap.length; // Z dimension
    const width = brightnessMap[0].length; // X dimension

    const blocks: Block3D[] = [];
    const supportBlockName = supportBlock.includes(':') ? supportBlock : `minecraft:${supportBlock}`;

    // Find min/max Y
    let minY = Infinity;
    let maxY = -Infinity;

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const y = yMap[z][x];
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    // Normalize Y to start at 0
    const yOffset = -minY;

    // Build blocks
    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            const y = yMap[z][x] + yOffset;

            const selectedBlockName = blockSelection[groupId] || BLOCK_GROUPS[groupId]?.[0] || 'stone';
            const fullBlockName = selectedBlockName.includes(':') ? selectedBlockName : `minecraft:${selectedBlockName}`;

            if (addSupportBlocks && mode !== StaircasingMode.NONE) {
                // Support block below
                blocks.push({
                    x,
                    y,
                    z,
                    blockName: supportBlockName
                });
                // Colored block on top
                blocks.push({
                    x,
                    y: y + 1,
                    z,
                    blockName: fullBlockName
                });
            } else {
                // Just the colored block
                blocks.push({
                    x,
                    y,
                    z,
                    blockName: fullBlockName
                });
            }
        }
    }

    // Calculate structure dimensions
    const finalMinY = Math.min(...blocks.map(b => b.y));
    const finalMaxY = Math.max(...blocks.map(b => b.y));
    const depth = finalMaxY - finalMinY + 1;

    return {
        width,
        height,
        depth,
        blocks
    };
}