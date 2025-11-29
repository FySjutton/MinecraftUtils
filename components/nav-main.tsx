"use client"

import Link from "next/link"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import React from "react";
import {PageItem, renderIcon} from "@/app/AppStructure";

export function NavMain({items, activeCategory}: {
    items: PageItem[]
    activeCategory?: string
}) {
    
    return (
        <SidebarMenu>
            {items.map((item) => {
                const isActive = activeCategory === item.url.replace("/", "")
                return (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                                href={item.url}
                                className={`flex items-center gap-2 ${
                                    isActive ? "font-bold text-sidebar-accent" : "font-normal"
                                }`}
                            >
                                {renderIcon(item.icon)}
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}
