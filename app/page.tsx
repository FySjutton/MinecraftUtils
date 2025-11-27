import { Metadata } from "next";

// TODO: Add images, icons, etc
export const metadata: Metadata = {
    title: "Tools for Minecraft",
    description: "Tools for Minecraft has useful tools for minecraft users.",
    themeColor: "#42fcff",
    icons: {
        icon: "/favicon.ico",
    },
    openGraph: {
        title: "Tools for Minecraft",
        description: "Tools for Minecraft has useful tools for minecraft users.",
        url: "https://minecraftutils.com",
        type: "website",
        siteName: "MinecraftUtils",
        locale: "en_US",
    },
    twitter: {
        card: "summary",
        title: "Tools for Minecraft",
        description: "Tools for Minecraft has useful tools for minecraft users.",
    },
};

export default function HomePage() {
    return (
        <div>This is the homepage.</div>
    )
}
