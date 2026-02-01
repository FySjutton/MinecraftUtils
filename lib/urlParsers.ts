import {createParser, SingleParser} from "nuqs";
import {useEffect} from "react";

const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const toB62 = (n: number) => BASE62_CHARS[n] ?? "0";
const fromB62 = (char: string) => BASE62_CHARS.indexOf(char);

function encodeString(str: string): string {
    return encodeURIComponent(str);
}

function decodeString(str: string): string {
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
}

export function useUrlUpdateEmitter() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const dispatchUpdate = () => {
            // defer to next tick to let nuqs hydrate first
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("share-url-updated"));
            }, 0);
        };

        const origPush = history.pushState;
        history.pushState = function (data: any, unused: string, url?: string | URL | null) {
            origPush.call(this, data, unused, url);
            dispatchUpdate();
            return;
        };

        const origReplace = history.replaceState;
        history.replaceState = function (data: any, unused: string, url?: string | URL | null) {
            origReplace.call(this, data, unused, url);
            dispatchUpdate();
            return;
        };

        window.addEventListener("popstate", dispatchUpdate);

        return () => {
            history.pushState = origPush;
            history.replaceState = origReplace;
            window.removeEventListener("popstate", dispatchUpdate);
        };
    }, []);
}

export const numberParser = createParser<number>({
    serialize: (n) => n.toString(),
    parse: (s) => {
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : null;
    },
});

export const boolParser = createParser<boolean>({
    serialize(v) {
        return v ? "1" : "0";
    },
    parse(v) {
        if (v === "1") return true;
        if (v === "0") return false;
        return null;
    },
});

export function enumParser<T extends string>(values: readonly T[]) {
    const index = Object.fromEntries(values.map((v, i) => [v, i])) as Record<T, number>;
    return createParser<T>({
        serialize(value) {
            return toB62(index[value]);
        },
        parse(value) {
            const i = fromB62(value);
            return i !== -1 && values[i] ? values[i] : null;
        },
    });
}

export function enumArrayParser<T extends string>(
    values: readonly T[],
    options?: { reverse?: boolean } // reverse here means store unselected items
) {
    const single = enumParser(values);

    return createParser<T[]>({
        serialize(arr) {
            let toStore = arr;
            if (options?.reverse) {
                const selected = new Set(arr);
                toStore = values.filter(v => !selected.has(v)); // store unselected items
            }
            return toStore.map(single.serialize).join("");
        },
        parse(s) {
            const parsed = s.split("").map(c => single.parse(c)).filter(Boolean) as T[];
            if (options?.reverse) {
                const parsedSet = new Set(parsed);
                return values.filter(v => !parsedSet.has(v)); // return selected items
            }
            return parsed;
        },
    });
}

type FieldDef<T> =
    T extends boolean ? "bool" | { type: "bool"; default?: boolean } | { type: SingleParser<boolean>; default?: boolean } :
        T extends number ? "number" | { type: "number"; default?: number } | { type: SingleParser<number>; default?: number } :
            T extends string ? "string" | { type: "string"; default?: string } | readonly string[] | { type: SingleParser<string>; default?: string } :
                SingleParser<T> | { type: SingleParser<T>; default?: T };

export type Schema<T> = {
    [K in keyof T]?: FieldDef<T[K]> | SingleParser<T[K]>;
};

function isParser<T>(obj: any): obj is SingleParser<T> {
    return obj && typeof obj.parse === "function" && typeof obj.serialize === "function";
}

function helper(value: string, pos: number): [end: number, token: string] | null {
    const colonPos = value.indexOf(":", pos);
    if (colonPos === -1) return null;

    const lenStr = value.substring(pos, colonPos);
    if (!/^\d+$/.test(lenStr)) return null;
    const len = parseInt(lenStr, 10);

    const start = colonPos + 1;
    const end = start + len;
    if (end > value.length) return null;

    const token = value.substring(start, end);
    return [end, token];
}

// ---- Shared helper for key-value serialization ----
function serializeKV<T>(
    obj: Record<string, T>,
    serializeValue: (val: T, key?: string) => string
) {
    let result = "";
    for (const key in obj) {
        const val = obj[key];
        const keyToken = `${key.length}:${key}`;
        const valueToken = serializeValue(val, key);
        result += keyToken + `${valueToken.length}:${valueToken}`;
    }
    return result;
}

function parseKV<T>(
    str: string,
    parseValue: (val: string, key?: string) => T | null
): Record<string, T> | null {
    const obj: Record<string, T> = {};
    let pos = 0;

    while (pos < str.length) {
        const keyRes = helper(str, pos);
        if (!keyRes) return null;
        const [keyEnd, key] = keyRes;
        pos = keyEnd;

        const valRes = helper(str, pos);
        if (!valRes) return null;
        const [valEnd, valToken] = valRes;
        const parsed = parseValue(valToken, key);
        if (parsed === null) return null;

        obj[key] = parsed;
        pos = valEnd;
    }

    return obj;
}

function asStringParser<T>(
    parser?: SingleParser<T>,
    enumValues?: readonly string[]
): SingleParser<T> {
    if (enumValues) return enumParser(enumValues) as SingleParser<T>;
    if (!parser) throw new Error("Missing parser");
    return parser;
}

// --- mask encode/decode helpers (numbers only, no BigInt)
function encodeMask(bits: boolean[]): string {
    let n = 0;
    for (let i = 0; i < bits.length; i++) {
        n = n * 2 + (bits[i] ? 1 : 0);
    }
    if (n === 0) return "";
    let out = "";
    while (n > 0) {
        const idx = n % 62;
        out = BASE62_CHARS[idx] + out;
        n = Math.floor(n / 62);
    }
    return out;
}

function decodeMask(s: string, length: number): boolean[] {
    if (!s) return new Array(length).fill(false);
    let n = 0;
    for (const ch of s) {
        const idx = BASE62_CHARS.indexOf(ch);
        if (idx === -1) throw new Error("invalid mask char");
        n = n * 62 + idx;
    }
    const bits: boolean[] = new Array(length).fill(false);
    for (let i = length - 1; i >= 0; i--) {
        bits[i] = (n % 2) === 1;
        n = Math.floor(n / 2);
    }
    return bits;
}

export function recordParser<T extends Record<string, any>>(options: {
    valueParser?: SingleParser<any>;
    keyValues?: readonly string[];
    valueValues?: readonly string[];
}) {
    const keyParser = options.keyValues
        ? enumParser(options.keyValues)
        : null;

    const valueParser = asStringParser(
        options.valueParser ?? numberParser,
        options.valueValues
    );

    return createParser<T>({
        serialize(obj) {
            const mapped: Record<string, any> = {};

            for (const k in obj) {
                const key = keyParser ? keyParser.serialize(k) : k;
                mapped[key] = obj[k];
            }

            return serializeKV(mapped, (v) => {
                if (valueParser.serialize == null) throw new Error("Error")
                const tmp = valueParser.serialize(v);
                if (tmp == null) throw new Error("Serialize returned null");
                return tmp;
            });
        },

        parse(str) {
            const parsed = parseKV(str, (v) => valueParser.parse(v));
            if (!parsed) return null;

            if (!keyParser) return parsed as T;

            const out: Record<string, any> = {};
            for (const k in parsed) {
                const key = keyParser.parse(k);
                if (!key) return null;
                out[key] = parsed[k];
            }
            return out as T;
        },
    });
}

export function objectParser<T extends Record<string, any>>(schema: Schema<T>) {
    const keys = Object.keys(schema) as (keyof T)[];
    const enumData: Record<keyof T, { index: Record<string, number>; values: string[] } | null> = {} as any;
    const defaults: Partial<T> = {};

    // detect enums and defaults
    for (const k of keys) {
        const def = schema[k];
        if (Array.isArray(def)) {
            enumData[k] = { index: Object.fromEntries(def.map((v, i) => [v, i])), values: def };
        } else {
            enumData[k] = null;
        }

        if (typeof def === "object" && def !== null && "default" in def) {
            (defaults as any)[k] = (def as any).default;
        }
    }

    const defaultsUsed = Object.keys(defaults).length > 0;

    return createParser<T>({
        serialize(obj) {
            const getParser = (def: any) => isParser(def) ? def : (def && def.type && isParser(def.type)) ? def.type : null;
            const serializeValue = (key: keyof T, v: any) => {
                const def = schema[key];
                const parser = getParser(def);
                if (parser) {
                    if (parser.serialize == null) throw new Error("Serialize returned null");
                    return parser.serialize(v);
                }
                if (def === "bool" || (def as any)?.type === "bool") return v ? "1" : "0";
                if (def === "number" || (def as any)?.type === "number") return `${v}`;
                if (Array.isArray(def)) {
                    const idx = enumData[key]!.index[v as string];
                    return toB62(idx ?? 0);
                }
                return encodeString(v as string);
            };

            if (!defaultsUsed) {
                return keys.map(key => {
                    const v = (obj as any)[key];
                    const token = serializeValue(key, v);
                    return `${token.length}:${token}`;
                }).join("");
            } else {
                const bits: boolean[] = [];
                const vals: string[] = [];

                for (const key of keys) {
                    const v = (obj as any)[key];
                    const hasDefault = (defaults as any)[key] !== undefined;
                    const isDifferent = !hasDefault || (defaults as any)[key] !== v;
                    bits.push(isDifferent);

                    if (isDifferent) {
                        const token = serializeValue(key, v);
                        vals.push(`${token.length}:${token}`);
                    }
                }

                const mask = encodeMask(bits);
                return `${mask.length}:${mask}` + vals.join("");
            }
        },

        parse(str) {
            const getParser = (def: any) => isParser(def) ? def : (def && def.type && isParser(def.type)) ? def.type : null;
            const parseValue = (key: keyof T, token: string | null) => {
                const def = schema[key];
                const parser = getParser(def);
                let parsed: any = null;

                if (token != null) {
                    if (parser) parsed = parser.parse(token);
                    else if (def === "bool" || (def as any)?.type === "bool") parsed = token === "1" ? true : token === "0" ? false : null;
                    else if (def === "number" || (def as any)?.type === "number") parsed = Number.isFinite(parseFloat(token)) ? parseFloat(token) : null;
                    else if (Array.isArray(def)) {
                        const idx = fromB62(token);
                        const values = enumData[key]!.values;
                        parsed = idx !== -1 && values[idx] ? values[idx] : values[0];
                    } else parsed = decodeString(token);
                }

                if ((parsed === null || parsed === undefined) && (defaults as any)[key] !== undefined) parsed = (defaults as any)[key];
                return parsed;
            };

            const out: any = {};
            let pos = 0;
            let bits: boolean[] = new Array(keys.length).fill(true);

            if (defaultsUsed) {
                const maskRes = helper(str, pos);
                if (maskRes) {
                    pos = maskRes[0];
                    bits = decodeMask(maskRes[1], keys.length);
                }
            }

            for (let i = 0; i < keys.length; ++i) {
                const key = keys[i];
                let token: string | null = null;

                if (!defaultsUsed || bits[i]) {
                    const valRes = helper(str, pos);
                    if (valRes) {
                        token = valRes[1];
                        pos = valRes[0];
                    }
                }

                out[key as string] = parseValue(key, token);
            }

            return out as T;
        },
    });
}

export function arrayObjectParser<T extends Record<string, any>>(schema: Schema<T>): ReturnType<typeof createParser<T[]>> {
    const singleParser = objectParser<T>(schema);

    return createParser<T[]>({
        serialize(items) {
            if (!items.length) return "";
            return items.map(item => {
                const serialized = singleParser.serialize(item);
                return `${serialized.length}:${serialized}`;
            }).join("");
        },

        parse(value) {
            if (!value) return [];
            const result: T[] = [];
            let pos = 0;

            while (pos < value.length) {
                const helperResult = helper(value, pos);
                if (!helperResult) return null;
                const [end, token] = helperResult;
                const parsed = singleParser.parse(token);
                if (parsed === null) return null;

                result.push(parsed);
                pos = end;
            }

            return result;
        },
    });
}

export const rgbParser = createParser<[number, number, number]>({
    serialize([r, g, b]) {
        return ((r << 16) | (g << 8) | b).toString(36);
    },
    parse(s) {
        const n = parseInt(s, 36);
        if (!Number.isFinite(n)) return [0, 0, 0];
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
});

export const rgbArrayParser = createParser<[number, number, number][]>({
    serialize(arr) {
        return arr.map(rgb => {
            const serialized = rgbParser.serialize(rgb);
            return `${serialized.length}:${serialized}`;
        }).join("");
    },
    parse(s) {
        if (!s) return null;
        const result: [number, number, number][] = [];
        let pos = 0;

        while (pos < s.length) {
            const helperResult = helper(s, pos);
            if (!helperResult) return null;
            const [end, token] = helperResult;
            const rgb = rgbParser.parse(token);
            if (!rgb) return null;

            result.push(rgb);
            pos = end;
        }

        return result;
    },
});
