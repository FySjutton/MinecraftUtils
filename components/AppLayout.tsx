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
import {getCurrentPage} from "@/app/_structure/StructureUtils";
import {Banner, BannerAction, BannerIcon, BannerTitle} from "./ui/banner";
import {IconAlertOctagon} from "@tabler/icons-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {toTitleCase} from "@/lib/StringUtils";
import {Button} from "@/components/ui/button";
import Link from "next/link";

export default function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .map((value) => toTitleCase(value, true));

    const currentPage = getCurrentPage(pathname);

    return (
        <NuqsAdapter>
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto">
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
                                        <BannerTitle className="flex flex-col">
                                            <span>Warning! This utility is in the alpha phase, and is not meant for public usage! It is only here in order for developers/testers to test it publicly!</span>
                                            <span>For more information about the development of this tool, consider checking the roadmap, link can be found on the right or in the footer.</span>
                                        </BannerTitle>
                                        <BannerAction variant="default" onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            window.open("https://minecraftutils.com/roadmap");
                                        }} className="cursor-pointer ml-auto max-[610px]:ml-0">Roadmap</BannerAction>
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
