"use client"

import * as React from "react"
import {AppSidebar} from "@/components/AppSidebar";
import DashboardLayout from "@/components/DashboardLayout";
import InProgressBanner from "@/components/banners/InProgressBanner";
import Footer from "@/components/SiteFooter";
import {SidebarProvider} from "@/components/ui/sidebar";
import {ReactNode} from "react";
import DiscordBanner from "@/components/banners/DiscordBanner";

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-auto">
                    <DashboardLayout>
                        <InProgressBanner />
                        <DiscordBanner />
                        {children}
                    </DashboardLayout>
                    <Footer></Footer>
                </main>
            </div>
        </SidebarProvider>
    )
}
