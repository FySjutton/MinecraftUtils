import { ChevronRight } from "lucide-react"
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

export function NavTools({
                                  tools,
                                  activeCategory,
                              }: {
    tools: {
        name: string
        emoji: React.ReactNode
        href?: string,
        pages: {
            name: string
            emoji: React.ReactNode
            href?: string
        }[]
    }[]
    activeCategory?: string
}) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {tools.map((tool) => {
                        const isActive = tool.name === activeCategory

                        return (
                            <Collapsible key={tool.name} defaultOpen={isActive}>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <a href={tool.href} className="flex items-center gap-2">
                                            <span>{tool.emoji}</span>
                                            <span>{tool.name}</span>
                                        </a>
                                    </SidebarMenuButton>

                                    {tool.pages.length > 0 && (
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuAction
                                                className="bg-sidebar-accent text-sidebar-accent-foreground left-2 data-[state=open]:rotate-90"
                                                showOnHover
                                            >
                                                <ChevronRight />
                                            </SidebarMenuAction>
                                        </CollapsibleTrigger>
                                    )}

                                    <CollapsibleContent>
                                        {tool.pages.length > 0 && (
                                            <SidebarMenuSub>
                                                {tool.pages.map((page) => (
                                                    <SidebarMenuSubItem key={page.name}>
                                                        <SidebarMenuSubButton asChild>
                                                            <a
                                                                href={page.href}
                                                                className={`flex items-center gap-2 ${
                                                                    isActive && page.href === undefined
                                                                        ? "font-medium text-sidebar-accent"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span>{page.emoji}</span>
                                                                <span>{page.name}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
