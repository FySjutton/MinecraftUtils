'use client';

import { Banner, BannerAction, BannerClose, BannerIcon, BannerTitle } from '@/components/ui/banner';
import React from 'react';
import {IconMessage} from "@tabler/icons-react";

export default function DiscordBanner() {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('discordBannerDismissed');
    const showInitially = !dismissed;

    const [show, setShow] = React.useState(showInitially);

    const handleClose = () => {
        setShow(false);
        localStorage.setItem('discordBannerDismissed', 'true');
    };

    const handleClick = () => {
        window.open('https://discord.gg/tqn38v6w7k', '_blank');
    };

    if (!show) return null;

    return (
        <Banner
            variant="secondary"
            inset
            className="bg-[#7289da] text-white cursor-pointer"
            onClick={handleClick}
        >
            <BannerIcon icon={IconMessage} className="bg-white/20 text-white" />
            <BannerTitle>Join our Discord community!</BannerTitle>

            {/* Not needed, just because it looks nice! */}
            <BannerAction
                variant="default"
                onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://discord.gg/tqn38v6w7k', '_blank');
                }}
            >
                Join here!
            </BannerAction>

            <BannerClose
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
            />
        </Banner>
    );
}
