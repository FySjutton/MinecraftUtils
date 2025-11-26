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
} from "@/components/ui/sidebar"
import {SidebarMenuAction} from "@/ui/sidebar";

export function NavWorkspaces({
                                  workspaces,
                              }: {
    workspaces: {
        name: string
        emoji: React.ReactNode
        href?: string
        pages: {
            name: string
            emoji: React.ReactNode
            href?: string
        }[]
    }[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {workspaces.map((workspace) => (
                        <Collapsible key={workspace.name}>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href={workspace.href} className="flex items-center gap-2">
                                        <span>{workspace.emoji}</span>
                                        <span>{workspace.name}</span>
                                    </a>
                                </SidebarMenuButton>

                                {workspace.pages.length > 0 && (
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
                                    {workspace.pages.length > 0 && (
                                        <SidebarMenuSub>
                                            {workspace.pages.map((page) => (
                                                <SidebarMenuSubItem key={page.name}>
                                                    <SidebarMenuSubButton asChild>
                                                        <a href={page.href} className="flex items-center gap-2">
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
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
