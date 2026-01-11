import pako from 'pako';
import { writeNBT, NBT, NBTType, NBTCompound } from './nbtWriter';

function encodeVarInt(v: number): Uint8Array {
    const out: number[] = [];
    let value = v >>> 0;
    while ((value & ~0x7f) !== 0) {
        out.push((value & 0x7f) | 0x80);
        value >>>= 7;
    }
    out.push(value);
    return new Uint8Array(out);
}

export function download2DSchematic(
    shape: boolean[][],
    filename = 'shape.schem'
): void {
    const height = 1;
    const length = shape.length;
    const width = shape[0]?.length ?? 0;

    if (!width || !length) {
        throw new Error('Shape must be non-empty');
    }

    const data: number[] = [];
    for (let z = 0; z < length; z++) {
        for (let x = 0; x < width; x++) {
            data.push(shape[z][x] ? 0 : 1);
        }
    }

    const varInts = new Uint8Array(
        data.flatMap(v => [...encodeVarInt(v)])
    );

    const schematic: NBTCompound = {
        Schematic: {
            Version: 3,
            DataVersion: 2865,
            Width: width,
            Height: height,
            Length: length,

            Metadata: {
                Name: '2D Shape',
                Author: 'minecraftutils.com',
                Date: NBT.long(Date.now()),
                RequiredMods: NBT.list(NBTType.String, [])
            },

            Blocks: {
                Palette: {
                    'minecraft:stone': 0,
                    'minecraft:air': 1
                },
                Data: NBT.byteArray(varInts),
                BlockEntities: NBT.list(NBTType.Compound, [])
            }
        }
    };

    const nbt = writeNBT(schematic);
    const gz = pako.gzip(nbt);

    const blob = new Blob([gz], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
