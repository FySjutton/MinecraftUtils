import { Dispatch, SetStateAction } from "react";

type StateTuple<T> = [T, Dispatch<SetStateAction<T>>];

type Entry<T> = {
    ref: { current: T };
    set: Dispatch<SetStateAction<T>>;
    serialize: (v: T) => string;
    deserialize: (s: string) => T | null;
    defaultValue?: T;
    equals: (a: T, b: T) => boolean;
};

export class ShareManager {
    private entries = new Map<string, Entry<any>>();
    private hydrated = false;
    private notifyFn: (() => void) | null = null;

    private scheduleNotify() {
        Promise.resolve().then(() => {
            this.notifyFn?.();
        });
    }

    private registerInternal<T>(
        key: string,
        tuple: StateTuple<T>,
        serialize: (v: T) => string,
        deserialize: (s: string) => T | null,
        options?: {
            defaultValue?: T;
            equals?: (a: T, b: T) => boolean;
            autoSync?: boolean;
        }
    ) {
        const [value, set] = tuple;

        const entry: Entry<T> = {ref: { current: value }, set, serialize, deserialize, defaultValue: options?.defaultValue, equals: options?.equals ?? Object.is,};

        this.entries.set(key, entry);

        if (options?.autoSync !== false) {
            this.scheduleNotify();
        }
    }

    register<T>(
        key: string,
        tuple: StateTuple<T>,
        serialize: (v: T) => string,
        deserialize: (s: string) => T | null,
        options?: {
            defaultValue?: T;
            equals?: (a: T, b: T) => boolean;
            autoSync?: boolean;
        }
    ) {
        this.registerInternal(key, tuple, serialize, deserialize, options);
    }

    registerString(key: string, tuple: StateTuple<string>, options?: { defaultValue?: string; autoSync?: boolean }) {
        this.registerInternal(key, tuple, v => v, s => s, options);
    }

    registerNumber(
        key: string,
        tuple: StateTuple<number>,
        options?: { defaultValue?: number; autoSync?: boolean }
    ) {
        this.registerInternal(
            key,
            tuple,
            v => String(v),
            s => {
                const n = Number(s);
                return Number.isFinite(n) ? n : null;
            },
            options
        );
    }

    registerBoolean(
        key: string,
        tuple: StateTuple<boolean>,
        options?: { defaultValue?: boolean; autoSync?: boolean }
    ) {
        this.registerInternal(
            key,
            tuple,
            v => (v ? "1" : "0"),
            s => (s === "1" ? true : s === "0" ? false : null),
            options
        );
    }

    registerEnum<T extends string>(
        key: string,
        tuple: StateTuple<T>,
        allowed: readonly T[],
        options?: { defaultValue?: T; autoSync?: boolean }
    ) {
        this.registerInternal(
            key,
            tuple,
            v => v,
            s => (allowed.includes(s as T) ? (s as T) : options?.defaultValue ?? null),
            options
        );
    }

    toQueryString(): string {
        const params = new URLSearchParams();

        for (const [key, entry] of this.entries) {
            const value = entry.ref.current;

            if (
                entry.defaultValue !== undefined &&
                entry.equals(value, entry.defaultValue)
            ) {
                continue;
            }

            const serialized = entry.serialize(value);

            if (!serialized) continue;

            params.set(key, serialized);
        }

        const qs = params.toString();
        return qs ? `?${qs}` : "";
    }

    hydrate(search = window.location.search) {
        if (this.hydrated) return;
        this.hydrated = true;

        const params = new URLSearchParams(search);

        for (const [key, entry] of this.entries) {
            const raw = params.get(key);
            if (raw == null) continue;

            const value = entry.deserialize(raw);
            if (value != null) entry.set(value);
        }
    }

    startAutoUrlSync(options?: { debounceMs?: number; replace?: boolean }) {
        const debounceMs = options?.debounceMs ?? 300;
        const replace = options?.replace ?? true;
        let timeout: number | null = null;

        const update = () => {
            const url = window.location.pathname + this.toQueryString();
            if (replace) history.replaceState(null, "", url);
            else history.pushState(null, "", url);
            window.dispatchEvent(new Event("share-url-updated"));
        };

        const schedule = () => {
            if (timeout !== null) clearTimeout(timeout);
            timeout = window.setTimeout(update, debounceMs);
        };

        this.notifyFn = schedule;
        schedule();

        return () => {
            if (timeout !== null) clearTimeout(timeout);
            this.notifyFn = null;
        };
    }
}
