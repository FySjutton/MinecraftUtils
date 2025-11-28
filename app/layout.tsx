"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import "./globals.css";
import React from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import Footer from "./components/SiteFooter";
import dynamic from "next/dynamic";
const DiscordBanner = dynamic(() => import('@/app/components/DiscordBanner'), {
    ssr: false,
});

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-auto">
                    <DashboardLayout>
                        <DiscordBanner />
                        {children}
                    </DashboardLayout>
                    <Footer></Footer>
                </main>
            </div>
        </SidebarProvider>
        </body>
        </html>
    );
}
