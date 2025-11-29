'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

export interface ComboBoxItem {
    label: string
}

interface ComboBoxProps {
    items: ComboBoxItem[]
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
                    className="justify-between"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="opacity-50" />
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
                                    key={item.label}
                                    value={item.label}
                                    onSelect={() => {
                                        onChange(item.label)
                                        setOpen(false)
                                    }}
                                >
                                    {item.label}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === item.label ? "opacity-100" : "opacity-0"
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
