import { useEffect } from "react";
import { ShareManager } from "./ShareManager";

export function useShareSync<T>(
    manager: ShareManager,
    key: string,
    value: T
) {
    useEffect(() => {
        manager.updateRef(key, value);
        manager.notifyChange();
    }, [manager, key, value]);
}
