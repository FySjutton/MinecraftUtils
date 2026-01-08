'use client'

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavTools } from "@/components/nav-tools"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

import { navMain, tools, externals } from "@/app/AppStructure"
import Image from "next/image";

export function AppSidebar() {
    const pathname = usePathname()

    let activeCategory: string = ""
    let activePage: string = ""

    for (const tool of tools) {
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
                        <div className="text-sm rounded-md p-2 bg-muted">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="relative flex w-8 h-8 items-center justify-center rounded-lg">
                                    <Image
                                        src="/logo_high.png"
                                        alt="Logo"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-medium">MinecraftUtils</span>
                                    <span>Useful utilities for minecraft</span>
                                </div>
                            </Link>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavMain items={navMain} activeCategory={activeCategory}/>
            </SidebarHeader>

            <SidebarContent>
                <NavTools
                    tools={tools}
                    activeCategory={activeCategory}
                    activePage={activePage}
                    title="Utilities"
                />
                <NavTools
                    tools={externals}
                    activeCategory={activeCategory}
                    activePage={activePage}
                    title="External Utilities"
                />
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}
