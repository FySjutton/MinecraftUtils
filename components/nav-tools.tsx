import {ChevronRight} from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuAction,
} from "@/components/ui/sidebar"
import React, {JSX} from "react";
import Link from "next/link";

export function NavTools({
                             tools,
                             activeCategory,
                             activePage,
                         }: {
    tools: {
        name: string
        icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
        url: string,
        defaultOpen?: boolean,
        pages: { name: string; emoji: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string; url: string }[]
    }[]
    activeCategory?: string
    activePage?: string
}) {
    const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(
        () =>
            tools.reduce(
                (acc, tool) => ({
                    ...acc,
                    [tool.name]: !!tool.defaultOpen,
                }),
                {}
            )
    )

    const toggleCategory = (cat: string) => {
        setOpenCategories((prev) => ({...prev, [cat]: !prev[cat]}))
    }

    const renderIcon = (icon: any) => {
        if (!icon) return null
        if (typeof icon === "string") return <span>{icon}</span>
        if (React.isValidElement(icon)) return icon
        if (typeof icon === "function") return React.createElement(icon, { className: "size-4" })
        return null
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {tools.map((tool) => {
                        const categoryHasActivePage = tool.pages.some((p) => p.url === activePage)
                        const isCategoryBold = activeCategory === tool.name && !categoryHasActivePage

                        const isOpen = openCategories[tool.name] ?? false

                        return (
                            <SidebarMenuItem key={tool.name}>
                                <Collapsible open={isOpen} onOpenChange={() => toggleCategory(tool.name)}>
                                    <div className="flex items-center">
                                        <SidebarMenuButton asChild isActive={isCategoryBold}>
                                            <Link
                                                href={tool.url}
                                                className="flex items-center gap-2 flex-1"
                                                onClick={() => setOpenCategories((prev) => ({
                                                    ...prev,
                                                    [tool.name]: true
                                                }))}
                                            >
                                                {renderIcon(tool.icon)}
                                                <span className={isCategoryBold ? "font-bold" : "font-normal"}>{tool.name}</span>
                                            </Link>
                                        </SidebarMenuButton>

                                        {tool.pages.length > 0 && (
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuAction
                                                    className="data-[state=open]:rotate-90"
                                                    showOnHover
                                                >
                                                    <ChevronRight/>
                                                </SidebarMenuAction>
                                            </CollapsibleTrigger>
                                        )}
                                    </div>

                                    {tool.pages.length > 0 && (
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {tool.pages.map((page) => {
                                                    const isPageActive = activePage === page.url
                                                    return (
                                                        <SidebarMenuSubItem key={page.url}>
                                                            <SidebarMenuSubButton asChild isActive={isPageActive}>
                                                                <Link
                                                                    href={`${tool.url}/${page.url}`}
                                                                    className={`flex items-center gap-2 ${
                                                                        isPageActive ? "font-bold text-sidebar-accent" : "font-normal"
                                                                    }`}
                                                                >
                                                                    {renderIcon(page.emoji)}
                                                                    <span>{page.name}</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    )
                                                })}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
