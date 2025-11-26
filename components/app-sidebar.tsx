"use client"

import * as React from "react"
import {usePathname} from "next/navigation"
import {
    Calculator,
    Hammer,
    Home, Microwave, ReplaceAll, Square,
} from "lucide-react"

import {NavMain} from "@/components/nav-main"
import {NavTools} from "@/components/nav-tools"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link";

const data = {
    navMain: [{title: "Home", url: "/", icon: Home}],
    tools: [
        {
            name: "Calculators",
            icon: <Calculator />,
            url: "/calculators",
            defaultOpen: true,
            pages: [
                {name: "Unit Calculator", url: "units", emoji: <ReplaceAll />},
                {name: "Furnace Calculator", url: "furnace", emoji: <Microwave />},
                {name: "Nether Calculator", url: "nether", emoji: <Square />},
            ],
        },
    ],
}

export function AppSidebar() {
    const pathname = usePathname()

    let activeCategory: string = ""
    let activePage: string = ""

    for (const tool of data.tools) {
        if (pathname.startsWith(tool.url)) {
            activeCategory = tool.name

            const segments = pathname.replace(tool.url, "").split("/").filter(Boolean)
            const pageUrl = segments[0]
            if (pageUrl) {
                const match = tool.pages.find((p) => p.url === pageUrl)
                if (match) activePage = match.url.replace("/", "")
            }
        }
    }

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div
                                    className="bg-sidebar-accent text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Hammer className="size-4"/>
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-medium">Tools for Minecraft</span>
                                    <span>Useful tools for minecraft</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavMain items={data.navMain} activeCategory={activeCategory}/>
            </SidebarHeader>

            <SidebarContent>
                <NavTools
                    tools={data.tools}
                    activeCategory={activeCategory}
                    activePage={activePage}
                />
            </SidebarContent>

            <SidebarRail/>
        </Sidebar>
    )
}
