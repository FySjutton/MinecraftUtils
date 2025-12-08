'use client';

import React from "react";
import {
    Banner,
    BannerIcon,
    BannerTitle,
    BannerClose,
    BannerAction,
} from "@/components/ui/banner";
import { TablerIcon } from "@tabler/icons-react";

export type SmartBannerProps = {
    id: string;
    title: string;
    bgColor?: string;
    textColor?: string;
    icon?: TablerIcon;
    actionLabel?: string;
    actionUrl?: string;
    expireDays?: number;
};

export default function SmartBanner({
                                        id,
                                        title,
                                        icon: IconComp,
                                        bgColor = "#333",
                                        textColor = "white",
                                        actionLabel,
                                        actionUrl,
                                        expireDays = 30,
                                    }: SmartBannerProps) {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const key = `banner:${id}`;
        const raw = localStorage.getItem(key);
        if (!raw) {
            requestAnimationFrame(() => setShow(true));
            return;
        }
        const ts = Number(raw);
        const cooldown = (expireDays ?? 30) * 86400000;
        if (Date.now() - ts > cooldown) requestAnimationFrame(() => setShow(true));
    }, [id, expireDays]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShow(false);
        localStorage.setItem(`banner:${id}`, String(Date.now()));
    };

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (actionUrl) window.open(actionUrl, "_blank");
    };

    if (!show) return null;

    return (
        <Banner
            variant="secondary"
            inset
            className="cursor-pointer"
            onClick={actionUrl ? handleAction : undefined}
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            {IconComp && <BannerIcon icon={IconComp} className="bg-white/20 text-white" />}
            <BannerTitle>{title}</BannerTitle>
            {actionLabel && actionUrl && (
                <BannerAction variant="default" onClick={handleAction}>
                    {actionLabel}
                </BannerAction>
            )}
            <BannerClose onClick={handleClose} />
        </Banner>
    );
}
