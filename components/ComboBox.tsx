'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { IconCheck, IconSelector } from "@tabler/icons-react"
import {useState} from "react";

type ItemsInput =
    | string[]
    | Record<string, string[]>

interface ComboBoxProps {
    items: ItemsInput
    value: string
    onChange: (value: string) => void
    placeholder?: string
    placeholderSearch?: string
    className?: string
    renderItem?: (item: string) => React.ReactNode
    renderIcon?: (item: string) => React.ReactNode
}

export function ComboBox({items, value, onChange, placeholder = "Select...", placeholderSearch = "Search...", className, renderItem, renderIcon}: ComboBoxProps) {
    const [open, setOpen] = useState(false)

    const normalizedItems = React.useMemo(() => {
        if (Array.isArray(items)) {
            return items.map(item => ({
                value: item,
                aliases: [] as string[],
            }))
        }

        return Object.entries(items).map(([key, aliases]) => ({
            value: key,
            aliases,
        }))
    }, [items])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("flex items-center justify-between w-full", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        {renderIcon && value && (
                            <span className="flex-shrink-0">
                {renderIcon(value)}
              </span>
                        )}
                        <span className="truncate">
              {value || placeholder}
            </span>
                    </div>

                    <div className="flex items-center gap-2 ml-2 shrink-0">
                        {value && renderItem?.(value)}
                        <IconSelector className="opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={false}
                className={cn("p-0", className)}
            >
                <Command>
                    <CommandInput
                        placeholder={placeholderSearch}
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {normalizedItems.map(({ value: item, aliases }) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    keywords={[item, ...aliases]}
                                    onSelect={() => {
                                        onChange(item)
                                        setOpen(false)
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    {renderIcon && (
                                        <span className="flex-shrink-0">
                                          {renderIcon(item)}
                                        </span>
                                    )}

                                    <span className="flex-1 truncate">
                                        {item}
                                    </span>

                                    {renderItem?.(item)}

                                    <IconCheck
                                        className={cn(
                                            "ml-auto shrink-0",
                                            value === item ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
