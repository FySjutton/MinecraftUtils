'use client';

import { useEffect, useState } from "react";
import SmartBanner from "./SmartBanner";
import { bannerPool, PoolEntry } from "./banner-pool";

function onCooldown(banner: PoolEntry) {
    const raw = localStorage.getItem(`banner:${banner.id}`);
    if (!raw) return false;
    const ts = Number(raw);
    const cooldown = (banner.expireDays ?? 30) * 86400_000;
    return Date.now() - ts < cooldown;
}

function pickWeighted(banners: PoolEntry[]): PoolEntry | null {
    if (banners.length === 0) return null;
    const total = banners.reduce((sum, entry) => sum + entry.weight, 0);
    let randomNumber = Math.random() * total;
    for (const banner of banners) {
        randomNumber -= banner.weight;
        if (randomNumber <= 0) return banner;
    }
    return banners[0];
}

export default function RandomBanner() {
    const [banner, setBanner] = useState<PoolEntry | null>(null);

    useEffect(() => {
        const available = bannerPool.filter((entry) => !onCooldown(entry));
        const selected = pickWeighted(available);
        if (selected) requestAnimationFrame(() => setBanner(selected));
    }, []);

    if (!banner) return null;
    return <SmartBanner {...banner} />;
}
