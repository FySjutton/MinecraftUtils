import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CardContextValue {
    collapsed: boolean
    toggle: () => void
    collapsible: boolean
}

const CardContext = React.createContext<CardContextValue>({
    collapsed: false,
    toggle: () => {},
    collapsible: false,
})

interface CardProps extends React.ComponentProps<"div"> {
    collapsible?: boolean
    defaultCollapsed?: boolean
}

function Card({ className, collapsible = false, defaultCollapsed = false, ...props }: CardProps) {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
    return (
        <CardContext.Provider value={{ collapsed, toggle: () => setCollapsed(v => !v), collapsible }}>
            <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)}{...props}/>
        </CardContext.Provider>
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    const { collapsible, toggle } = React.useContext(CardContext)
    return (
        <div
            data-slot="card-header"
            onClick={collapsible ? toggle : undefined}
            className={cn(
                "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
                collapsible && "cursor-pointer select-none",
                className
            )}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-title" className={cn("leading-none font-semibold", className)}{...props}/>
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
    )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    const { collapsible, collapsed } = React.useContext(CardContext)
    return (
        <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end flex items-center gap-1", className)} {...props}>
            {props.children}
            {collapsible && (<ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", collapsed && "-rotate-90")}/>)}
        </div>
    )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    const { collapsed } = React.useContext(CardContext)
    if (collapsed) return null
    return (
        <div data-slot="card-content" className={cn("px-6", className)} {...props} />
    )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    const { collapsed } = React.useContext(CardContext)
    if (collapsed) return null
    return (
        <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
    )
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardAction,
    CardDescription,
    CardContent,
}