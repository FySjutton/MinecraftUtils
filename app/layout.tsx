import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import {Metadata, Viewport} from "next";
import AppLayout from "@/components/AppLayout";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <AppLayout>{children}</AppLayout>
            <Analytics />
            <SpeedInsights/>
        </body>
        </html>
    );
}

export const metadata: Metadata = {
    title: "Minecraft Utils",
    description: "Useful Minecraft utilities, calculators, and generators for players, admins, and creators alike.",
    icons: {
        icon: "/icon.ico",
        shortcut: "/favicon-32x32.png",
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        title: "Minecraft Utils",
        description: "Useful Minecraft utilities, calculators, and generators for players, admins, and creators alike.",
        type: "website",
        locale: "en-US",
    }
};

export const viewport: Viewport = {
    themeColor: "#1cffca",
};