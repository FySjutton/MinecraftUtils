import { ITEM_ASSETS, MinecraftItemId } from './itemAssets'

export function getImageAsset(item: MinecraftItemId): string {
    return ITEM_ASSETS[item]
}

export function findImageAsset(item: string, namespace?: string): string {
    if (item in ITEM_ASSETS) {
        return ITEM_ASSETS[item as MinecraftItemId]
    }

    if (namespace) {
        const namespacedKey = `${namespace}_${item}`
        if (namespacedKey in ITEM_ASSETS) {
            return ITEM_ASSETS[namespacedKey as MinecraftItemId]
        }
    }

    console.warn(`Missing asset: ${item}${namespace ? ` (tried ${namespace}_${item})` : ''}`)
    return '/assets/missing.png'
}