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
import {IconCheck, IconSelector} from "@tabler/icons-react";

interface ComboBoxProps {
    items: string[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    placeholderSearch: string
    width?: string
}

export function ComboBox({
                             items,
                             value,
                             onChange,
                             placeholder,
                             placeholderSearch,
                             width = "200px",
                         }: ComboBoxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    style={{ width }}
                    className="justify-between w-full"
                >
                    {value || placeholder}
                    <IconSelector className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent style={{ width }} className="p-0">
                <Command>
                    <CommandInput placeholder={placeholderSearch} className="h-9" />
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
                                >
                                    {item}
                                    <IconCheck
                                        className={cn(
                                            "ml-auto",
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
