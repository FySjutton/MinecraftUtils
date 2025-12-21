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
import { Switch } from "@/components/ui/switch"
import { IconCheck, IconSelector } from "@tabler/icons-react"

interface MultiSelectDropdownProps {
    items: string[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    placeholderSearch?: string
    width?: string
    renderIcon?: (item: string) => React.ReactNode
}

export function MultiSelectDropdown({
                                        items,
                                        selected,
                                        onChange,
                                        placeholder = "Select items...",
                                        placeholderSearch = "Search...",
                                        width = "200px",
                                        renderIcon,
                                    }: MultiSelectDropdownProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredItems = items.filter((item) =>
        item.toLowerCase().includes(search.toLowerCase())
    )

    const toggleItem = (item: string) => {
        if (selected.includes(item)) {
            onChange(selected.filter((i) => i !== item))
        } else {
            onChange([...selected, item])
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    style={{ width: width }}
                    className="flex items-center justify-between"
                >
                    <div className="flex gap-2 truncate">
                        {selected.length === 0 ? placeholder : `${selected.length} selected`}
                    </div>
                    <IconSelector className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent style={{ width }} className="p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholderSearch}
                        className="h-9"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {filteredItems.map((item) => (
                                <CommandItem
                                    key={item}
                                    className="flex items-center justify-between gap-2"
                                    onSelect={() => toggleItem(item)}
                                >
                                    <div className="flex items-center gap-2">
                                        {renderIcon && <span className="flex-shrink-0">{renderIcon(item)}</span>}
                                        <span className="truncate">{item}</span>
                                    </div>
                                    <Switch checked={selected.includes(item)} onCheckedChange={() => toggleItem(item)} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
