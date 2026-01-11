export const enum NBTType {
    End = 0,
    Byte = 1,
    Short = 2,
    Int = 3,
    Long = 4,
    ByteArray = 7,
    String = 8,
    List = 9,
    Compound = 10
}

export type NBTValue =
    | number
    | string
    | bigint
    | Uint8Array
    | NBTList
    | NBTCompound;

export type NBTCompound = { [key: string]: NBTValue };

export interface NBTList {
    type: NBTType;
    value: NBTValue[];
}

export const NBT = {
    long: (v: number | bigint): bigint => BigInt(v),
    byteArray: (v: Uint8Array): Uint8Array => v,
    list: (type: NBTType, value: NBTValue[]): NBTList => ({ type, value })
};

export class NBTWriter {
    private parts: Uint8Array[] = [];

    private push(b: Uint8Array): void {
        this.parts.push(b);
    }

    private writeU8(v: number): void {
        this.push(new Uint8Array([v & 0xff]));
    }

    private writeI16(v: number): void {
        const b = new Uint8Array(2);
        new DataView(b.buffer).setInt16(0, v, false);
        this.push(b);
    }

    private writeI32(v: number): void {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setInt32(0, v, false);
        this.push(b);
    }

    private writeI64(v: bigint): void {
        const b = new Uint8Array(8);
        new DataView(b.buffer).setBigInt64(0, v, false);
        this.push(b);
    }

    private writeString(s: string): void {
        const bytes = new TextEncoder().encode(s);
        this.writeI16(bytes.length);
        this.push(bytes);
    }

    private writeBytes(b: Uint8Array): void {
        this.push(b);
    }

    public writeRoot(value: NBTCompound): void {
        this.writeU8(NBTType.Compound);
        this.writeString('');
        this.writeCompound(value);
    }

    private writeCompound(obj: NBTCompound): void {
        for (const key in obj) {
            this.writeNamedTag(key, obj[key]);
        }
        this.writeU8(NBTType.End);
    }

    private writeNamedTag(name: string, value: NBTValue): void {
        const tag = this.detectType(value);
        this.writeU8(tag);
        this.writeString(name);
        this.writePayload(tag, value);
    }

    private writePayload(type: NBTType, value: NBTValue): void {
        switch (type) {
            case NBTType.Int:
                this.writeI32(value as number);
                break;

            case NBTType.Long:
                this.writeI64(value as bigint);
                break;

            case NBTType.String:
                this.writeString(value as string);
                break;

            case NBTType.ByteArray: {
                const arr = value as Uint8Array;
                this.writeI32(arr.length);
                this.writeBytes(arr);
                break;
            }

            case NBTType.List: {
                const list = value as NBTList;
                this.writeU8(list.type);
                this.writeI32(list.value.length);
                for (const v of list.value) {
                    this.writePayload(list.type, v);
                }
                break;
            }

            case NBTType.Compound:
                this.writeCompound(value as NBTCompound);
                break;
        }
    }

    private detectType(value: NBTValue): NBTType {
        if (typeof value === 'number') return NBTType.Int;
        if (typeof value === 'bigint') return NBTType.Long;
        if (typeof value === 'string') return NBTType.String;
        if (value instanceof Uint8Array) return NBTType.ByteArray;
        if (this.isNBTList(value)) return NBTType.List;
        return NBTType.Compound;
    }

    private isNBTList(v: NBTValue): v is NBTList {
        return typeof v === 'object' && v !== null && 'type' in v && 'value' in v;
    }

    public concat(): Uint8Array {
        const size = this.parts.reduce((n, p) => n + p.length, 0);
        const out = new Uint8Array(size);
        let offset = 0;
        for (const p of this.parts) {
            out.set(p, offset);
            offset += p.length;
        }
        return out;
    }
}

export function writeNBT(root: NBTCompound): Uint8Array {
    const writer = new NBTWriter();
    writer.writeRoot(root);
    return writer.concat();
}
