import pako from 'pako';
import { Structure3D } from './utils';
import { NBT, NBTCompound, NBTType, NBTValue, writeNBT } from "@/lib/schematics/nbtWriter";

export function exportStructureNBT(structure: Structure3D, filename: string = 'structure.nbt'): void {
    // Build palette: map block names to indices
    const paletteMap = new Map<string, number>();
    const paletteBlocks: NBTValue[] = [];

    const getPaletteId = (blockName: string): number => {
        if (paletteMap.has(blockName)) {
            return paletteMap.get(blockName)!;
        }
        const id = paletteBlocks.length;
        paletteMap.set(blockName, id);
        paletteBlocks.push({ Name: blockName });
        return id;
    };

    // Convert blocks to NBT format
    const nbtBlocks: NBTValue[] = structure.blocks.map(block => {
        const paletteId = getPaletteId(block.blockName);
        return {
            pos: NBT.list(NBTType.Int, [block.x, block.y, block.z]),
            state: paletteId
        };
    });

    // Build NBT root structure
    const root: NBTCompound = {
        blocks: NBT.list(NBTType.Compound, nbtBlocks),
        entities: NBT.list(NBTType.Compound, []),
        palette: NBT.list(NBTType.Compound, paletteBlocks),
        size: NBT.list(NBTType.Int, [structure.width, structure.depth, structure.height]),
        author: 'Map Art Generator',
        DataVersion: 2865 // Minecraft 1.18.2
    };

    // Write and compress
    const nbt = writeNBT(root);
    const compressed = pako.gzip(nbt);

    // Download
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.nbt') ? filename : `${filename}.nbt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}