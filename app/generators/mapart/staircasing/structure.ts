import { Block3D, BlockSelection, Brightness, Structure3D, SupportBlockMode, StaircasingMode } from '../utils/types';
import { BLOCK_GROUPS, TRANSPARENT_GROUP_ID } from '../utils/constants';

function nooblineY(brightness: Brightness, imageY: number): number {
    if (brightness === Brightness.HIGH) return imageY - 1;
    if (brightness === Brightness.LOW) return imageY + 1;
    return imageY;
}

export function calculate3DStructure(
    brightnessMap: Brightness[][],
    groupIdMap: number[][],
    yMap: number[][],
    blockSelection: BlockSelection,
    supportMode: SupportBlockMode,
    supportBlock = 'netherrack',
    noobLine: boolean,
    staircasingMode: StaircasingMode = StaircasingMode.STANDARD,
): Structure3D {
    const height = brightnessMap.length;
    const width = brightnessMap[0].length;

    const fmtBlock = (name: string) => name.includes(':') ? name : `minecraft:${name}`;
    const supportBlockName = fmtBlock(supportBlock);

    const isSouth = staircasingMode === StaircasingMode.SOUTHLINE;

    let minY = Infinity;
    for (let z = 0; z < height; z++)
        for (let x = 0; x < width; x++) {
            if (groupIdMap[z][x] === TRANSPARENT_GROUP_ID) continue;
            if (yMap[z][x] < minY) minY = yMap[z][x];
        }

    if (noobLine) {
        const noobZ = isSouth ? height - 1 : 0;
        for (let x = 0; x < width; x++) {
            if (groupIdMap[noobZ][x] === TRANSPARENT_GROUP_ID) continue;
            const fillerY = nooblineY(brightnessMap[noobZ][x], yMap[noobZ][x]);
            if (fillerY < minY) minY = fillerY;
        }
    }

    if (!isFinite(minY)) minY = 0;

    const yOffset = -minY;
    const blocks: Block3D[] = [];

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const groupId = groupIdMap[z][x];
            if (groupId === TRANSPARENT_GROUP_ID) continue;

            const y = yMap[z][x] + yOffset;
            const zPos = noobLine && !isSouth ? z + 1 : z;

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

    if (noobLine) {
        const noobZ = isSouth ? height - 1 : 0;
        const noobZPos = isSouth ? height : 0;

        for (let x = 0; x < width; x++) {
            if (groupIdMap[noobZ][x] === TRANSPARENT_GROUP_ID) continue;

            const fillerY = nooblineY(brightnessMap[noobZ][x], yMap[noobZ][x]) + yOffset;

            if (supportMode === SupportBlockMode.HEAVY) {
                for (let sy = Math.max(0, fillerY - 1); sy <= fillerY; sy++)
                    blocks.push({ x, y: sy, z: noobZPos, blockName: supportBlockName });
            } else {
                blocks.push({ x, y: fillerY, z: noobZPos, blockName: supportBlockName });
            }
        }
    }

    const finalMinY = blocks.reduce((m, b) => Math.min(m, b.y), Infinity);
    const finalMaxY = blocks.reduce((m, b) => Math.max(m, b.y), -Infinity);

    return {
        width,
        height: noobLine ? height + 1 : height,
        depth: isFinite(finalMaxY) ? finalMaxY - (isFinite(finalMinY) ? finalMinY : 0) + 1 : 0,
        blocks,
    };
}
