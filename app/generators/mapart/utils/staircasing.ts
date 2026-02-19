import {
    Block3D,
    BLOCK_GROUPS,
    BlockSelection,
    Brightness,
    StaircasingMode,
    Structure3D,
    SupportBlockMode
} from './utils';

export function calculate3DStructure(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    blockSelection: BlockSelection,
    mode: StaircasingMode,
    supportMode: SupportBlockMode,
    supportBlock: string = 'netherrack'
): Structure3D {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    const blocks: Block3D[] = [];
    const supportBlockName = supportBlock.includes(':') ? supportBlock : `minecraft:${supportBlock}`;

    const useReferenceRow = mode !== StaircasingMode.NONE;
    const addSupport = supportMode !== SupportBlockMode.NONE;

    let minY = Infinity;
    let maxY = -Infinity;

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const y = yMap[z][x];
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    if (useReferenceRow) {
        for (let x = 0; x < width; x++) {
            const brightness = brightnessMap[0][x];
            const rawY = yMap[0][x];
            if (!addSupport && brightness === Brightness.HIGH) {
                const refRawY = rawY - 1;
                if (refRawY < minY) minY = refRawY;
            }
        }
    }

    const yOffset = -minY;

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            const y = yMap[z][x] + yOffset;
            const zPos = useReferenceRow ? z + 1 : z;

            const selectedBlockName = blockSelection[groupId] || BLOCK_GROUPS[groupId]?.[0] || 'stone';
            const fullBlockName = selectedBlockName.includes(':') ? selectedBlockName : `minecraft:${selectedBlockName}`;

            if (supportMode === SupportBlockMode.NONE) {
                blocks.push({ x, y, z: zPos, blockName: fullBlockName });

            } else if (supportMode === SupportBlockMode.THIN) {
                if (y - 1 >= 0) {
                    blocks.push({ x, y: y - 1, z: zPos, blockName: supportBlockName });
                }
                blocks.push({ x, y, z: zPos, blockName: fullBlockName });

            } else if (supportMode === SupportBlockMode.HEAVY) {
                for (let sy = Math.max(0, y - 2); sy < y; sy++) {
                    blocks.push({ x, y: sy, z: zPos, blockName: supportBlockName });
                }
                blocks.push({ x, y, z: zPos, blockName: fullBlockName });
            }
        }
    }

    if (useReferenceRow) {
        for (let x = 0; x < width; x++) {
            const brightness = brightnessMap[0][x];
            const surfaceY = yMap[0][x] + yOffset;

            let refBlockY: number;
            if (brightness === Brightness.HIGH) {
                refBlockY = surfaceY - 1;
            } else if (brightness === Brightness.NORMAL) {
                refBlockY = surfaceY;
            } else {
                refBlockY = surfaceY + 1;
            }

            if (supportMode === SupportBlockMode.HEAVY) {
                for (let sy = Math.max(0, refBlockY - 1); sy <= refBlockY; sy++) {
                    blocks.push({ x, y: sy, z: 0, blockName: supportBlockName });
                }
            } else {
                blocks.push({ x, y: refBlockY, z: 0, blockName: supportBlockName });
            }
        }
    }

    const finalMinY = Math.min(...blocks.map(b => b.y));
    const finalMaxY = Math.max(...blocks.map(b => b.y));
    const depth = finalMaxY - finalMinY + 1;
    const structureHeight = useReferenceRow ? height + 1 : height;

    return { width, height: structureHeight, depth, blocks };
}