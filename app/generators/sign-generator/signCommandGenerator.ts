import {minecraftTextToComponent} from "@/lib/converters/minecraftTextToComponent";
import {MinecraftText} from "@/lib/MinecraftText";

export interface SignSide {
    lines: MinecraftText[][]
    color: string | null
    glowing: boolean
    waxed: boolean
}

export interface SignData {
    front: SignSide
    back: SignSide
}

function normalizeLines(lines: MinecraftText[][]): MinecraftText[][] {
    const out = lines.slice(0, 4)
    while (out.length < 4) out.push([])
    return out
}

function signSideToNBT(side: SignSide): string {
    const lines = normalizeLines(side.lines)

    const messages = lines
        .map(line => `${minecraftTextToComponent([line])}`)
        .join(',')

    const color = side.color ?? 'black'

    return `{messages:[${messages}],color:"${color}",has_glowing_text:${side.glowing}}`
}

function signDataToNBT(sign: SignData): string {
    const waxed = sign.front.waxed || sign.back.waxed

    return `{is_waxed:${waxed},front_text:${signSideToNBT(sign.front)},back_text:${signSideToNBT(sign.back)}}`
}

export function generateSignCommand(
    x: string | number,
    y: string | number,
    z: string | number,
    blockId: string,
    signData: SignData
): string {
    const nbt = signDataToNBT(signData)
    return `/setblock ${x} ${y} ${z} ${blockId}${nbt}`
}
