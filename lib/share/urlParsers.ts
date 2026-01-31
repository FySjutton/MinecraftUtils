import { createParser, SingleParser } from "nuqs";
import { useEffect } from "react";

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

        const dispatchUpdate = () => window.dispatchEvent(new CustomEvent("share-url-updated"));

        const origPush = history.pushState;
        history.pushState = function (data: any, unused: string, url?: string | URL | null) {
            origPush.call(this, data, unused, url);
            window.dispatchEvent(new CustomEvent("share-url-updated"));
            return;
        };

        const origReplace = history.replaceState;
        history.replaceState = function (data: any, unused: string, url?: string | URL | null) {
            origReplace.call(this, data, unused, url);
            window.dispatchEvent(new CustomEvent("share-url-updated"));
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
    T extends boolean ? "bool" :
        T extends number ? "number" :
            T extends string ? "string" | string[] :
                SingleParser<T>;

type Schema<T> = {
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

export function recordParser<T extends Record<string, any>>(options: {
    valueParser?: SingleParser<any>;
    keyValues?: readonly string[];
    valueValues?: readonly string[];
}) {
    const valueParser = options.valueParser ?? numberParser;
    const keyParser = options.keyValues ? enumParser(options.keyValues) : null;
    const valEnumParser = options.valueValues ? enumParser(options.valueValues) : null;

    return createParser<T>({
        serialize(obj) {
            return serializeKV(obj, (v, key) => {
                const keyStr = keyParser && key ? keyParser.serialize(key) : key!;

                let valueStr: string;
                if (valEnumParser) valueStr = valEnumParser.serialize(v);
                if (typeof valueParser.serialize !== "function") throw new Error("Unknown Error");
                else valueStr = valueParser.serialize(v);

                return keyStr.length + ":" + keyStr + valueStr.length + ":" + valueStr;
            });
        },
        parse(str) {
            return parseKV(str, (v, key) => {
                let parsedKey = key;
                if (keyParser && key) {
                    parsedKey = keyParser.parse(key) as string;
                    if (!parsedKey) return null;
                }

                let parsedValue;
                if (valEnumParser) parsedValue = valEnumParser.parse(v);
                else parsedValue = valueParser.parse(v);

                return parsedValue;
            }) as T | null;
        },
    });
}

export function objectParser<T extends Record<string, any>>(schema: Schema<T>) {
    const keys = Object.keys(schema) as (keyof T)[];
    const enumData: Record<keyof T, { index: Record<string, number>; values: string[] } | null> = {} as any;

    for (const k of keys) {
        const def = schema[k];
        if (Array.isArray(def)) {
            enumData[k] = { index: Object.fromEntries(def.map((v, i) => [v, i])), values: def };
        } else {
            enumData[k] = null;
        }
    }

    return createParser<T>({
        serialize(obj) {
            return serializeKV(obj, (v, key) => {
                const def = schema[key as keyof T];
                if (isParser(def)) {
                    if (typeof def.serialize !== "function") throw new Error("Unknown Error");
                    return def.serialize(v);
                }
                if (def === "bool") return v ? "1" : "0";
                if (def === "number") return `${v}`;
                if (Array.isArray(def)) {
                    const idx = enumData[key as keyof T]!.index[v as string];
                    return toB62(idx ?? 0);
                }
                const encoded = encodeString(v as string);
                return encoded;
            });
        },
        parse(str) {
            return parseKV(str, (val, key) => {
                const def = schema[key as keyof T];
                if (!def) return null;

                if (isParser(def)) return def.parse(val);
                if (def === "bool") return val === "1" ? true : val === "0" ? false : null;
                if (def === "number") {
                    const n = parseFloat(val);
                    return Number.isFinite(n) ? n : null;
                }
                if (Array.isArray(def)) {
                    const idx = fromB62(val);
                    const values = enumData[key as keyof T]!.values;
                    return idx !== -1 && values[idx] ? values[idx] : values[0];
                }
                return decodeString(val);
            }) as T | null;
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
