import {createParser} from "nuqs";

export function checksParser(width: number, height: number) {
    return createParser<string[]>({
        serialize(coords) {
            if (!coords || coords.length === 0) return '';

            const minX = -Math.floor(width / 2);
            const minY = -Math.floor(height / 2);

            const byRow = new Map<number, number[]>();
            for (const c of coords) {
                const [x, y] = c.split(',').map(Number);
                const arr = byRow.get(y) || [];
                arr.push(x);
                byRow.set(y, arr);
            }
            const ys = Array.from(byRow.keys()).sort((a, b) => a - b);

            const u32s: number[] = [];
            let prevY = minY - 1;
            for (const y of ys) {
                const xs = (byRow.get(y) || []).sort((a, b) => a - b);
                if (xs.length === 0) continue;

                const deltaY = y - prevY - 1;
                prevY = y;
                u32s.push(deltaY);

                const runs: Array<[number, number]> = [];
                let runStart = xs[0];
                let runPrev = xs[0];
                for (let i = 1; i < xs.length; i++) {
                    if (xs[i] === runPrev + 1) {
                        runPrev = xs[i];
                        continue;
                    }
                    runs.push([runStart, runPrev - runStart + 1]);
                    runStart = xs[i];
                    runPrev = xs[i];
                }
                runs.push([runStart, runPrev - runStart + 1]);

                u32s.push(runs.length);
                for (const [startX, runLen] of runs) {
                    const startOffset = startX - minX;
                    u32s.push(startOffset);
                    u32s.push(runLen - 1);
                }
            }

            const bytes: number[] = [];
            for (let n of u32s) {
                while (n >= 0x80) {
                    bytes.push((n % 128) | 0x80);
                    n = Math.floor(n / 128);
                }
                bytes.push(n);
            }

            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);

            let b64: string;
            if (typeof btoa === 'function') {
                b64 = btoa(bin);
            } else if (typeof Buffer !== 'undefined') {
                b64 = Buffer.from(bin, 'binary').toString('base64');
            } else {
                throw new Error('No base64 encoder available');
            }

            return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
        },

        parse(str) {
            if (!str) return [];

            const minX = -Math.floor(width / 2);
            const minY = -Math.floor(height / 2);

            let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4 !== 0) b64 += '=';
            let bin: string;
            if (typeof atob === 'function') {
                bin = atob(b64);
            } else if (typeof Buffer !== 'undefined') {
                bin = Buffer.from(b64, 'base64').toString('binary');
            } else {
                throw new Error('No base64 decoder available');
            }

            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

            const u32s: number[] = [];
            let i = 0;
            while (i < bytes.length) {
                let value = 0;
                let mul = 1;
                while (true) {
                    const b = bytes[i++];
                    value += (b & 0x7f) * mul;
                    if ((b & 0x80) === 0) break;
                    mul *= 128;
                }
                u32s.push(value);
            }

            const coords: string[] = [];
            let p = 0;
            let prevY = minY - 1;
            while (p < u32s.length) {
                const deltaY = u32s[p++];
                const y = prevY + 1 + deltaY;
                prevY = y;

                const runCount = u32s[p++];
                for (let r = 0; r < runCount; r++) {
                    const startOffset = u32s[p++];
                    const lenMinusOne = u32s[p++];
                    const runLen = lenMinusOne + 1;
                    const startX = startOffset + minX;
                    for (let k = 0; k < runLen; k++) {
                        coords.push(`${startX + k},${y}`);
                    }
                }
            }

            return coords;
        }
    });
}
