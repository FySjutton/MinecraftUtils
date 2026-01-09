import { Dispatch, SetStateAction } from "react";

type StateTuple<T> = [T, Dispatch<SetStateAction<T>>];

type Entry<T> = {
    ref: { current: T };
    set: Dispatch<SetStateAction<T>>;
    serialize: (v: T) => string;
    deserialize: (s: string) => T | null;
};

export class ShareManager {
    private entries = new Map<string, Entry<any>>();
    private hydrated = false;
    private notifyFn: (() => void) | null = null;

    private scheduleNotify() {
        Promise.resolve().then(() => {
            if (this.notifyFn) this.notifyFn();
        });
    }

    private registerInternal<T>(
        key: string,
        tuple: StateTuple<T>,
        serialize: (v: T) => string,
        deserialize: (s: string) => T | null,
        autoSync = true
    ) {
        const [value, set] = tuple;
        const existing = this.entries.get(key) as Entry<T> | undefined;
        if (existing) {
            existing.ref.current = value;
            existing.set = set;
            existing.serialize = serialize;
            existing.deserialize = deserialize;
        } else {
            this.entries.set(key, { ref: { current: value }, set, serialize, deserialize });
        }
        if (autoSync) this.scheduleNotify();
    }

    private notifyChange() {
        this.notifyFn?.();
    }

    register<T>(
        key: string,
        tuple: StateTuple<T>,
        serialize: (v: T) => string,
        deserialize: (s: string) => T | null,
        autoSync = true
    ) {
        this.registerInternal(key, tuple, serialize, deserialize, autoSync);
    }

    registerString(key: string, tuple: StateTuple<string>, autoSync = true) {
        this.registerInternal(key, tuple, v => v, s => s, autoSync);
    }

    registerNumber(key: string, tuple: StateTuple<number>, autoSync = true) {
        this.registerInternal(
            key,
            tuple,
            v => String(v),
            s => {
                const n = Number(s);
                return Number.isFinite(n) ? n : null;
            },
            autoSync
        );
    }

    registerBoolean(key: string, tuple: StateTuple<boolean>, autoSync = true) {
        this.registerInternal(
            key,
            tuple,
            v => (v ? "1" : "0"),
            s => (s === "1" ? true : s === "0" ? false : null),
            autoSync
        );
    }

    registerEnum<T extends string>(key: string, tuple: StateTuple<T>, allowed: readonly T[], autoSync = true) {
        this.registerInternal(
            key,
            tuple,
            v => v,
            s => (allowed.includes(s as T) ? (s as T) : tuple[0]),
            autoSync
        );
    }

    registerWithoutSync<T>(
        key: string,
        tuple: StateTuple<T>,
        serialize: (v: T) => string,
        deserialize: (s: string) => T | null
    ) {
        this.registerInternal(key, tuple, serialize, deserialize, false);
    }

    useShareSync<T>(key: string, value: T, overwrite = false) {
        const entry = this.entries.get(key);
        if (!entry) throw new Error(`Key ${key} not registered`);
        entry.ref.current = value;
        if (overwrite) entry.set(entry.ref.current);
        this.notifyChange();
        return [entry.ref.current, entry.set] as StateTuple<T>;
    }

    toQueryString(): string {
        const params = new URLSearchParams();
        for (const [key, entry] of this.entries) {
            params.set(key, entry.serialize(entry.ref.current));
        }
        return params.toString() ? `?${params.toString()}` : "";
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
