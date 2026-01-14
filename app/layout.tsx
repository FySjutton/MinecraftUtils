import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import React from "react";
import { Metadata, Viewport } from "next";
import AppLayout from "@/components/AppLayout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"],});
const geistMono = Geist_Mono({variable: "--font-geist-mono", subsets: ["latin"],});

export default function RootLayout({children}: { children: React.ReactNode; }) {
    return (
        <html lang="en" className="dark">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AppLayout>{children}</AppLayout>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

export const metadata: Metadata = {
    metadataBase: new URL("https://minecraftutils.com"),

    title: {
        default: "Minecraft Utils",
        template: "%s – Minecraft Utils",
    },

    description: "Free Minecraft utilities, calculators, generators, and tools for players, server admins, and creators.",
    applicationName: "Minecraft Utils",

    openGraph: {
        type: "website",
        siteName: "Minecraft Utils",
        locale: "en_US",
        images: [
            {
                url: "/og-banner.png",
                width: 1200,
                height: 630,
                alt: "Minecraft Utils",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        images: ["/og-banner.png"],
    },

    icons: undefined,
};


export const viewport: Viewport = {
    themeColor: "#1cffca",
};
