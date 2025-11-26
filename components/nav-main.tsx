"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
                            items,
                            activeCategory,
                        }: {
    items: {
        title: string
        url: string
        icon: LucideIcon
    }[]
    activeCategory?: string
}) {
    return (
        <SidebarMenu>
            {items.map((item) => {
                const isActive = activeCategory === item.url.replace("/", "")
                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                                href={item.url}
                                className={`flex items-center gap-2 ${
                                    isActive ? "font-bold text-sidebar-accent" : "font-normal"
                                }`}
                            >
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}
