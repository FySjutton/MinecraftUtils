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

interface ComboBoxProps {
    items: string[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    placeholderSearch: string
    width?: string
    renderItem?: (item: string) => React.ReactNode
    renderIcon?: (item: string) => React.ReactNode
}

export function ComboBox({
                             items,
                             value,
                             onChange,
                             placeholder,
                             placeholderSearch,
                             width = "200px",
                             renderItem,
                             renderIcon,
                         }: ComboBoxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    style={{ maxWidth: width }}
                    className="flex items-center w-full"
                >
                    {renderIcon && (
                        <span className="flex-shrink-0">
                            {renderIcon(value)}
                        </span>
                    )}

                    <span className="truncate flex-1">{value || placeholder}</span>

                    <span className="ml-auto flex items-center gap-2">
                        {renderItem?.(value)}
                        <IconSelector className="opacity-50" />
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent style={{ width }} className="p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholderSearch}
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
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

                                    <span className="flex-1 truncate">{item}</span>

                                    {renderItem?.(item)}

                                    <IconCheck
                                        className={cn(
                                            "ml-auto shrink-0",
                                            value === item
                                                ? "opacity-100"
                                                : "opacity-0"
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
