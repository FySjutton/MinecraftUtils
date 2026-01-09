import { ShareManager } from "./ShareManager";

const pool = new Map<string, ShareManager>();

export function getShareManager(key: string): ShareManager {
    if (!pool.has(key)) {
        pool.set(key, new ShareManager());
    }
    return pool.get(key)!;
}

export function resetShareManager(key: string) {
    pool.delete(key);
}

// reset all on page unload
// if (typeof window !== "undefined") {
//     window.addEventListener("beforeunload", () => {
//         pool.clear();
//     });
// }
