"use client"

import * as React from "react"
import {AppSidebar} from "@/components/AppSidebar";
import InProgressBanner from "@/components/banners/InProgressBanner";
import Footer from "@/components/SiteFooter";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {ReactNode} from "react";
import DiscordBanner from "@/components/banners/DiscordBanner";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {usePathname} from "next/navigation";

function toTitleCase(str: string) {
    return str.toLowerCase().split(' ').map((word: string) => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean).map((value) => toTitleCase(value.replaceAll("_", " ")));

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-auto">
                    <SidebarInset>
                        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {segments.map((segment, i) => {
                                        const href = "/" + segments.slice(0, i + 1).join("/")
                                        const isLast = i === segments.length - 1

                                        return (
                                            <React.Fragment key={href}>
                                                <BreadcrumbItem>
                                                    {isLast ? (
                                                        <BreadcrumbPage>{segment}</BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>

                                                {!isLast && <BreadcrumbSeparator />}
                                            </React.Fragment>
                                        )
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 p-4">
                            <InProgressBanner />
                            <DiscordBanner />
                            {children}
                        </div>
                    </SidebarInset>
                    <Footer></Footer>
                </main>
            </div>
        </SidebarProvider>
    )
}
