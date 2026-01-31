import {createParser} from "nuqs";
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
            window.dispatchEvent(new CustomEvent("share-url-updated"));
        };

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
        const n = parseInt(s);
        return Number.isFinite(n) ? n : null;
    },
});

export const stringParser = createParser<string>({
    serialize: (s) => s,
    parse: (s) => (s || null),
});

export const boolParser = createParser<boolean>({
    serialize(v) {
        return v ? "1" : "0";
    },
    parse(v) {
        if (v === "1") return true;
        if (v === "0") return false;
        return null;
    }
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
        }
    });
}

type FieldDef<T> =
    T extends boolean ? "bool" :
        T extends number ? "number" :
            T extends string ? string[] | "string" :
                never;

type Schema<T> = {
    [K in keyof T]?: FieldDef<T[K]>
};

export function objectParser<T extends Record<string, any>>(
    schema: Schema<T>
): ReturnType<typeof createParser<T>> {
    const keys = Object.keys(schema) as (keyof T)[];

    const enumData: Record<keyof T, { index: Record<string, number>, values: string[] } | null> = {} as any;

    for (const k of keys) {
        const def = schema[k];
        if (Array.isArray(def)) {
            enumData[k] = {
                index: Object.fromEntries(def.map((v, i) => [v, i])),
                values: def
            };
        } else {
            enumData[k] = null;
        }
    }

    return createParser<T>({
        serialize(obj) {
            let result = "";

            for (const k of keys) {
                const def = schema[k];
                const v = obj[k];

                if (def === "bool") {
                    result += v ? "1" : "0";
                } else if (def === "number") {
                    result += `#${v}#`;
                } else if (Array.isArray(def)) {
                    // enum
                    const idx = enumData[k]!.index[v as string];
                    result += toB62(idx ?? 0);
                } else {
                    // string (default)
                    result += `~${encodeString(v as string)}~`;
                }
            }

            return result;
        },

        parse(value) {
            if (!value) return null;

            try {
                const obj: any = {};
                let pos = 0;

                for (const k of keys) {
                    const def = schema[k];

                    if (def === "bool") {
                        obj[k] = value[pos] === "1";
                        pos += 1;
                    } else if (def === "number") {
                        if (value[pos] !== "#") return null;
                        const endPos = value.indexOf("#", pos + 1);
                        if (endPos === -1) return null;
                        const num = parseFloat(value.substring(pos + 1, endPos));
                        obj[k] = Number.isFinite(num) ? num : 0;
                        pos = endPos + 1;
                    } else if (Array.isArray(def)) {
                        // enum
                        const char = value[pos];
                        const idx = fromB62(char);
                        const values = enumData[k]!.values;
                        obj[k] = idx !== -1 && values[idx] ? values[idx] : values[0];
                        pos += 1;
                    } else {
                        // string (default)
                        if (value[pos] !== "~") return null;
                        const endPos = value.indexOf("~", pos + 1);
                        if (endPos === -1) return null;
                        obj[k] = decodeString(value.substring(pos + 1, endPos));
                        pos = endPos + 1;
                    }
                }

                return obj as T;
            } catch {
                return null;
            }
        }
    });
}

export function arrayObjectParser<T extends Record<string, any>>(
    schema: Schema<T>
): ReturnType<typeof createParser<T[]>> {
    const singleParser = objectParser<T>(schema);

    return createParser<T[]>({
        serialize(items) {
            if (!items.length) return "";
            return items.map(item => singleParser.serialize(item)).join(".");
        },

        parse(value) {
            if (!value) return [];

            try {
                const chunks = value.split(".");
                const result: T[] = [];

                for (const chunk of chunks) {
                    const parsed = singleParser.parse(chunk);
                    if (parsed === null) return null;
                    result.push(parsed);
                }

                return result;
            } catch {
                return null;
            }
        }
    });
}