import {createParser} from "nuqs";
import {useEffect} from "react";

const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const toB62 = (n: number) => BASE62_CHARS[n] ?? "0";  // assume n < 62
const fromB62 = (char: string) => BASE62_CHARS.indexOf(char);


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

export function enumParser<T extends string>(values: readonly T[]) {
    const index = Object.fromEntries(values.map((v, i) => [v, i])) as Record<T, number>;

    return createParser<T>({
        serialize(value) {
            return toB62(index[value]);
        },
        parse(value) {
            const i = fromB62(value);
            return i !== null && values[i] ? values[i] : null;
        }
    });
}

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

type FieldSchema =
    | readonly string[] // enum
    | "bool";

export function arrayObjectParser<T extends Record<string, any>>(
    schema: Record<keyof T, FieldSchema>
) {
    const keys = Object.keys(schema) as (keyof T)[];

    const enumIndexes = Object.fromEntries(
        keys.map(k => {
            const s = schema[k];
            if (Array.isArray(s)) {
                return [k, Object.fromEntries(s.map((v, i) => [v, i]))];
            }
            return [k, null];
        })
    ) as Record<keyof T, Record<string, number> | null>;

    return createParser<T[]>({
        serialize(items) {
            if (!items.length) return "";

            return items
                .map(item =>
                    keys
                        .map(k => {
                            const def = schema[k];
                            const v = item[k];

                            if (def === "bool") {
                                return v ? "1" : "0";
                            }

                            const idx = enumIndexes[k]![v];
                            return toB62(idx);
                        })
                        .join("")
                )
                .join(".");
        },

        parse(value) {
            if (!value) return [];

            try {
                return value.split(".").map(chunk => {
                    const obj: any = {};
                    keys.forEach((k, i) => {
                        const def = schema[k];
                        const char = chunk[i];

                        if (def === "bool") {
                            obj[k] = char === "1";
                        } else {
                            const idx = fromB62(char);
                            obj[k] = idx !== null ? def[idx] : null;
                        }
                    });
                    return obj as T;
                });
            } catch {
                return null;
            }
        }
    });
}
