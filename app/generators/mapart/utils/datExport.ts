const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_INT = 3;
const TAG_BYTE_ARRAY = 7;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;

class NBTWriter {
    private parts: Uint8Array[] = [];

    private u8(v: number) { this.parts.push(new Uint8Array([v & 0xff])); }
    private i16(v: number) { const b = new Uint8Array(2); new DataView(b.buffer).setInt16(0, v, false); this.parts.push(b); }
    private i32(v: number) { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, v, false); this.parts.push(b); }
    private str(s: string) { const e = new TextEncoder().encode(s); this.i16(e.length); this.parts.push(e); }

    private header(type: number, name: string) { this.u8(type); this.str(name); }

    tagByte(name: string, v: number) { this.header(TAG_BYTE, name); this.u8(v); }
    tagInt(name: string, v: number) { this.header(TAG_INT, name); this.i32(v); }
    tagString(name: string, v: string) { this.header(TAG_STRING, name); this.str(v); }
    tagByteArray(name: string, d: Uint8Array) {
        this.header(TAG_BYTE_ARRAY, name);
        this.i32(d.length);
        this.parts.push(d);
    }
    tagEmptyList(name: string) {
        this.header(TAG_LIST, name);
        this.u8(TAG_END);
        this.i32(0);
    }
    beginCompound(name: string) { this.header(TAG_COMPOUND, name); }
    endCompound() { this.u8(TAG_END); }

    concat(): Uint8Array {
        const size = this.parts.reduce((n, p) => n + p.length, 0);
        const out = new Uint8Array(size);
        let off = 0;
        for (const p of this.parts) { out.set(p, off); off += p.length; }
        return out;
    }
}

function buildMapNBT(colorBytes: Uint8Array): Uint8Array {
    const w = new NBTWriter();
    w.beginCompound('');
    w.beginCompound('data');
    w.tagByte('scale', 0);
    w.tagString('dimension', 'minecraft:overworld');
    w.tagByte('trackingPosition', 1);
    w.tagByte('unlimitedTracking', 0);
    w.tagByte('locked', 1);
    w.tagInt('xCenter', 0);
    w.tagInt('zCenter', 0);
    w.tagEmptyList('banners');
    w.tagEmptyList('frames');
    w.tagByteArray('colors', colorBytes);
    w.endCompound();
    w.tagInt('DataVersion', 3953);
    w.endCompound();
    return w.concat();
}

async function gzipBytes(data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
    const cs = new CompressionStream('gzip');

    const responsePromise = new Response(cs.readable).arrayBuffer();

    const writer = cs.writable.getWriter();
    await writer.write(data.slice(0));
    await writer.close();

    const result = new Uint8Array(await responsePromise);
    return result as Uint8Array<ArrayBuffer>;
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function splitColorBytesIntoTiles(
    colorBytes: Uint8Array,
    totalWidth: number,
    mapWidth: number,
    mapHeight: number
): Uint8Array[] {
    const tiles: Uint8Array[] = [];
    for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
            const tile = new Uint8Array(128 * 128);
            for (let z = 0; z < 128; z++) {
                for (let x = 0; x < 128; x++) {
                    tile[x + z * 128] = colorBytes[(col * 128 + x) + (row * 128 + z) * totalWidth];
                }
            }
            tiles.push(tile);
        }
    }
    return tiles;
}

export async function exportMapDat(
    colorBytes: Uint8Array,
    totalWidth: number,
    mapWidth: number,
    mapHeight: number
): Promise<void> {
    if (!colorBytes || colorBytes.length === 0) {
        return;
    }

    const tiles = splitColorBytesIntoTiles(colorBytes, totalWidth, mapWidth, mapHeight);

    if (tiles.length === 1) {
        const raw = buildMapNBT(tiles[0]);
        const gzipped = await gzipBytes(raw as Uint8Array<ArrayBuffer>);
        downloadBlob(new Blob([gzipped], { type: 'application/octet-stream' }), 'map_0.dat');
        return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let i = 0; i < tiles.length; i++) {
        const raw = buildMapNBT(tiles[i]);
        const gzipped = await gzipBytes(raw as Uint8Array<ArrayBuffer>);
        zip.file(`map_${i}.dat`, gzipped);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'minecraft-mapart-dat.zip');
}