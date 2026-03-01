import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
    collapsable?: boolean
    defaultOpen?: boolean
}

function findFirstTitleEl(children: React.ReactNode): React.ReactElement<any> | null {
    const arr = React.Children.toArray(children)

    for (const child of arr) {
        if (!React.isValidElement(child)) continue

        const element = child as React.ReactElement<any>

        if (element.type === CardTitle) {
            return element
        }

        if (element.props?.children) {
            const nested = findFirstTitleEl(element.props.children)
            if (nested) return nested
        }
    }

    return null
}

function Card({className, collapsable = false, defaultOpen = true, children, ...props}: CardProps) {
    const [open, setOpen] = React.useState(defaultOpen)

    if (!collapsable) {
        return (
            <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)}{...props}>
                {children}
            </div>
        )
    }

    const titleEl = findFirstTitleEl(children)

    return (
        <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm")}{...props}>
            <div data-slot="card-header" className="@container/card-header px-6 py-6">
                <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
                    <div className={cn("leading-none font-semibold", titleEl?.props?.className)}>
                        {titleEl?.props?.children}
                    </div>
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {open && <div className="flex flex-col gap-6 py-6">{children}</div>}
        </div>
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-header" className={cn("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className)}{...props}/>
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-title" className={cn("leading-none font-semibold", className)}{...props}/>
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)}{...props}/>
    )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}{...props}/>
    )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-content" className={cn("px-6", className)}{...props}/>
    )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)}{...props}/>
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