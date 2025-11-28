"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import React, {JSX} from "react";

export function NavMain({
                            items,
                            activeCategory,
                        }: {
    items: {
        title: string
        url: string
        icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    }[]
    activeCategory?: string
}) {
    const renderIcon = (icon: any) => {
        if (!icon) return null
        if (typeof icon === "string") return <span>{icon}</span>
        if (React.isValidElement(icon)) return icon
        if (typeof icon === "function") return React.createElement(icon, { className: "size-4" })
        return null
    }
    
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
                                {renderIcon(item.icon)}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}
