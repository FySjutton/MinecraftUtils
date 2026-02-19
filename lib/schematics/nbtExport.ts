import pako from 'pako';
import {NBT, NBTCompound, NBTType, NBTValue, writeNBT} from "@/lib/schematics/nbtWriter";
import {Structure3D} from "@/app/generators/mapart/utils/utils";

function buildNBTStructure(structure: Structure3D): NBTCompound {
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
    return {
        blocks: NBT.list(NBTType.Compound, nbtBlocks),
        entities: NBT.list(NBTType.Compound, []),
        palette: NBT.list(NBTType.Compound, paletteBlocks),
        size: NBT.list(NBTType.Int, [structure.width, structure.depth, structure.height]),
        author: 'MinecraftUtils',
        DataVersion: 2865 // Minecraft 1.18.2
    };
}

export function exportStructureNBT(structure: Structure3D, filename: string = 'structure.nbt'): void {
    const root = buildNBTStructure(structure);

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

export function exportStructureNBTToBlob(structure: Structure3D): Blob {
    const root = buildNBTStructure(structure);

    // Write and compress
    const nbt = writeNBT(root);
    const compressed = pako.gzip(nbt);

    return new Blob([compressed], { type: 'application/octet-stream' });
}