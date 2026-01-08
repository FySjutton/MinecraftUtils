import { IconMessage, IconStar } from "@tabler/icons-react";
import { SmartBannerProps } from "./SmartBanner";

export type PoolEntry = SmartBannerProps & {
    weight: number;
};

export const bannerPool: PoolEntry[] = [
    {
        id: "discord",
        title: "Join our Discord community!",
        bgColor: "#7289da",
        textColor: "white",
        icon: IconMessage,
        actionLabel: "Join here!",
        actionUrl: "https://discord.gg/tqn38v6w7k",
        expireDays: 7,
        weight: 2,
    },
    {
        id: "support",
        title: "Enjoy this project? Want to support it? Star it on GitHub!",
        bgColor: "#fff838",
        textColor: "black",
        iconClassName: "bg-yellow-400 text-black p-2",
        icon: IconStar,
        actionLabel: "Star now",
        actionUrl: "https://github.com/FySjutton/MinecraftUtils",
        expireDays: 7,
        weight: 1,
    },
    {
        id: "suggestions",
        title: "Suggest new utilities on GitHub!",
        bgColor: "#3bb343",
        textColor: "white",
        iconClassName: "bg-green-400 text-white p-2",
        icon: IconStar,
        actionLabel: "Open",
        actionUrl: "https://github.com/FySjutton/MinecraftUtils/issues",
        expireDays: 7,
        weight: 1,
    }
];
