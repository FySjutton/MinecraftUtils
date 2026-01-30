"use client"

import * as React from "react"
import {AppSidebar} from "@/components/AppSidebar";
import Footer from "@/components/SiteFooter";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {ReactNode} from "react";
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
import RandomBanner from "@/components/banners/RandomBanner";
import {getCurrentPage} from "@/app/AppStructure";
import {Banner, BannerAction, BannerIcon, BannerTitle} from "./ui/banner";
import {IconAlertOctagon} from "@tabler/icons-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function toTitleCase(str: string) {
    return str.toLowerCase().split(' ').map((word: string) => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .map((value) => toTitleCase(value.replaceAll(/[-_]/g, " ")));

    const currentPage = getCurrentPage(pathname);

    return (
        <NuqsAdapter>
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col overflow-auto">
                        <SidebarInset>
                            <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 h-4" />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        {segments.map((segment, i) => {
                                            const href = "/" + segments.slice(0, i + 1).join("/").toLowerCase();
                                            const isLast = i === segments.length - 1;

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
                                            );
                                        })}
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </header>

                            <div className="flex flex-1 flex-col gap-4 p-4 relative z-0">
                                <RandomBanner />

                                {/* Render beta/alpha badge */}
                                {currentPage?.type == "alpha" && (
                                    <Banner
                                        variant="secondary"
                                        inset
                                        style={{ backgroundColor: "#ba2727", color: "#FFFFFF" }}
                                    >
                                        <BannerIcon icon={IconAlertOctagon} className={"bg-white/20 text-white"} />
                                        <BannerTitle>WARNING! | This utility is in the alpha phase! Avoid using it, it is only here in order for testers/developers to test it publicly!</BannerTitle>
                                    </Banner>
                                )}
                                {currentPage?.type == "beta" && (
                                    <Banner
                                        variant="secondary"
                                        inset
                                        style={{ backgroundColor: "#2773ba", color: "#FFFFFF" }}
                                    >
                                        <BannerIcon icon={IconAlertOctagon} className={"bg-white/20 text-white"} />
                                        <BannerTitle>This utility is in beta, please report any bugs on github!</BannerTitle>
                                        <BannerAction variant="default" onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            window.open("https://github.com/FySjutton/MinecraftUtils/issues", "_blank");
                                        }} className="cursor-pointer ml-auto max-[610px]:ml-0">
                                            Report
                                        </BannerAction>
                                    </Banner>
                                )}

                                {children}
                            </div>
                        </SidebarInset>
                        <Footer />
                    </main>
                </div>
            </SidebarProvider>
        </NuqsAdapter>
    );
}
