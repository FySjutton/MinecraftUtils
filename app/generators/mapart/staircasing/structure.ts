import { Block3D, BlockSelection, Brightness, StaircasingMode, Structure3D, SupportBlockMode } from '../utils/types';
import { BLOCK_GROUPS } from '../utils/constants';

function referenceRowY(brightness: Brightness, imageY: number): number {
    if (brightness === Brightness.HIGH) return imageY - 1;
    if (brightness === Brightness.LOW) return imageY + 1;
    return imageY;
}

export function calculate3DStructure(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    blockSelection: BlockSelection,
    mode: StaircasingMode,
    supportMode: SupportBlockMode,
    supportBlock = 'netherrack',
): Structure3D {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    const fmtBlock = (name: string) => name.includes(':') ? name : `minecraft:${name}`;
    const supportBlockName = fmtBlock(supportBlock);

    const useReferenceRow = mode !== StaircasingMode.NONE;

    let minY = Infinity;
    for (let z = 0; z < height; z++)
        for (let x = 0; x < width; x++)
            if (yMap[z][x] < minY) minY = yMap[z][x];

    if (useReferenceRow) {
        for (let x = 0; x < width; x++) {
            const refY = referenceRowY(brightnessMap[0][x], yMap[0][x]);
            if (refY < minY) minY = refY;
        }
    }

    const yOffset = -minY;
    const blocks: Block3D[] = [];

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            const y = yMap[z][x] + yOffset;
            const zPos = useReferenceRow ? z + 1 : z;

            const selectedName = blockSelection[groupId] || BLOCK_GROUPS[groupId]?.[0] || 'stone';
            const fullName = fmtBlock(selectedName);

            if (supportMode === SupportBlockMode.NONE) {
                blocks.push({ x, y, z: zPos, blockName: fullName });
            } else if (supportMode === SupportBlockMode.THIN) {
                if (y - 1 >= 0) blocks.push({ x, y: y - 1, z: zPos, blockName: supportBlockName });
                blocks.push({ x, y, z: zPos, blockName: fullName });
            } else {
                for (let sy = Math.max(0, y - 2); sy < y; sy++)
                    blocks.push({ x, y: sy, z: zPos, blockName: supportBlockName });
                blocks.push({ x, y, z: zPos, blockName: fullName });
            }
        }
    }

    if (useReferenceRow) {
        for (let x = 0; x < width; x++) {
            const refY = referenceRowY(brightnessMap[0][x], yMap[0][x]) + yOffset;

            if (supportMode === SupportBlockMode.HEAVY) {
                for (let sy = Math.max(0, refY - 1); sy <= refY; sy++)
                    blocks.push({ x, y: sy, z: 0, blockName: supportBlockName });
            } else {
                blocks.push({ x, y: refY, z: 0, blockName: supportBlockName });
            }
        }
    }

    const finalMinY = blocks.reduce((m, b) => Math.min(m, b.y), Infinity);
    const finalMaxY = blocks.reduce((m, b) => Math.max(m, b.y), -Infinity);

    return {
        width,
        height: useReferenceRow ? height + 1 : height,
        depth: finalMaxY - finalMinY + 1,
        blocks,
    };
}