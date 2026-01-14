'use client'

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { NavTools } from "@/components/nav-tools"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

import { tools, externals } from "@/app/AppStructure"
import Image from "next/image";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group";
import {Search} from "lucide-react";
import {useState} from "react";
import {Switch} from "@/components/ui/switch";
import {Separator} from "@/components/ui/separator";

export function AppSidebar() {
    const pathname = usePathname()

    let activeCategory: string = ""
    let activePage: string = ""

    const [search, setSearch] = useState("");
    const [filterAlpha, setFilterAlpha] = useState(true);
    let hasAlphaTool = false;

    for (const tool of tools) {
        for (const page of tool.pages) {
            if (page.type == "alpha") {
                hasAlphaTool = true;
            }
        }
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
                        <div className="text-sm rounded-md p-2">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="relative flex w-8 h-8 items-center justify-center rounded-lg">
                                    <Image
                                        src="/logo_high.png"
                                        alt="Logo"
                                        width={128}
                                        height={128}
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

                <InputGroup>
                    <InputGroupInput placeholder="Search..." className="outline-none" onChange={(e) => setSearch(e.target.value)}/>
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                </InputGroup>
            </SidebarHeader>

            <SidebarContent>
                <NavTools
                    tools={tools}
                    search={search}
                    activeCategory={activeCategory}
                    activePage={activePage}
                    title="Utilities"
                    filterAlpha={filterAlpha}
                />
                <NavTools
                    tools={externals}
                    search={search}
                    activeCategory={activeCategory}
                    activePage={activePage}
                    title="External Utilities"
                    filterAlpha={filterAlpha}
                />
                {hasAlphaTool && (
                    <div className="mx-2 mt-auto">
                        <Separator />
                        <div className="flex flex-wrap justify-center text-center mt-4 mb-5">
                            <p className="w-full mb-2 text-gray-200">Show Experimental</p>
                            <Switch checked={!filterAlpha} onCheckedChange={() => setFilterAlpha(!filterAlpha)} />
                        </div>
                    </div>
                )}
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}
