import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
} from "@/components/ui/sidebar";
import React from "react";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";
import {renderIcon, ToolCategory} from "@/app/AppStructure";
import {IconChevronRight, IconExternalLink} from "@tabler/icons-react";

export function NavTools({tools, activeCategory, activePage, title}: {
    tools: ToolCategory[];
    activeCategory?: string;
    activePage?: string;
    title?: string;
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
    );

    const toggleCategory = (cat: string) => {
        setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {tools.map((tool) => {
                        const isCategoryBold =
                            activeCategory === tool.name && !tool.external &&
                            !tool.pages.some((p) => p.url === activePage);

                        const isOpen = openCategories[tool.name] ?? false;

                        return (
                            <SidebarMenuItem key={tool.name}>
                                <Collapsible open={isOpen} onOpenChange={() => toggleCategory(tool.name)}>
                                    <div className="flex items-center">
                                        <SidebarMenuButton asChild isActive={isCategoryBold}>
                                            <Link
                                                href={tool.external ? "#" : tool.url}
                                                className={`flex items-center gap-2 flex-1 ${tool.external ? "cursor-default" : ""}`}
                                                onClick={() => {
                                                        setOpenCategories((prev) => ({ ...prev, [tool.name]: true }));
                                                }}
                                            >
                                                {renderIcon(tool.icon)}
                                                <span className={isCategoryBold ? "font-bold" : "font-normal"}>{tool.name}</span>
                                                {tool.external && <Badge variant="secondary">External</Badge>}
                                            </Link>
                                        </SidebarMenuButton>

                                        {tool.pages.length > 0 && (
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuAction
                                                    className="data-[state=open]:rotate-90"
                                                    showOnHover
                                                >
                                                    <IconChevronRight />
                                                </SidebarMenuAction>
                                            </CollapsibleTrigger>
                                        )}
                                    </div>

                                    {tool.pages.length > 0 && (
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {tool.pages
                                                    .slice()
                                                    .sort((a, b) => {
                                                        const order = { undefined: 0, released: 0, beta: 1, alpha: 2 };
                                                        return (order[a.type as keyof typeof order] ?? 0) - (order[b.type as keyof typeof order] ?? 0);
                                                    }).map((page) => {
                                                        const isPageActive = activePage === page.url;
                                                        const url = tool.external ? page.url : `${tool.url}/${page.url}`;

                                                        return (
                                                            <SidebarMenuSubItem key={page.url}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isPageActive}
                                                                    className="!h-auto py-1"
                                                                >
                                                                    <Link
                                                                        href={url}
                                                                        target={tool.external ? "_blank" : undefined}
                                                                        rel={tool.external ? "noopener noreferrer" : undefined}
                                                                        className="flex items-center gap-2 flex-1 whitespace-normal leading-snug"
                                                                    >
                                                                        {renderIcon(page.icon)}
                                                                        <span className="flex-1">{page.name}</span>
                                                                        {page.type == "beta" && (
                                                                            <Badge variant="secondary" className="bg-blue-500">Beta</Badge>
                                                                        )}
                                                                        {page.type == "alpha" && (
                                                                            <Badge variant="destructive">Alpha</Badge>
                                                                        )}
                                                                        {tool.external && (
                                                                            <IconExternalLink className="w-4 h-4 shrink-0 ml-auto" />
                                                                        )}
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                })}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
