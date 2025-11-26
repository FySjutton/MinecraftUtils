"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
                                            children,
                                            activeCategory,
                                        }: {
    children: ReactNode
    activeCategory?: string
}) {
    const pathname = usePathname()
    const segments = pathname.split("/").filter(Boolean)

    return (
        <SidebarProvider>
            <AppSidebar activeCategory={activeCategory} />
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
                                    <BreadcrumbItem key={href}>
                                        {isLast ? (
                                            <BreadcrumbPage>{segment}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
                                        )}
                                        {!isLast && <BreadcrumbSeparator />}
                                    </BreadcrumbItem>
                                )
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
