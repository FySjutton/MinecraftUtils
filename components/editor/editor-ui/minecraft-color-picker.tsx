"use client"

import * as React from "react"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"

export const DEFAULT_PALETTE = [
    "#000000",
    "#7f7f7f",
    "#ffffff",
    "#ff4d4f",
    "#ff7a45",
    "#ffd666",
    "#95de64",
    "#36cfc9",
    "#40a9ff",
    "#9254de",
    "#f759ab",
    "#ffa39e",
    "#ffec3d",
    "#73d13d",
    "#13c2c2",
    "#2f54eb",
]

type ColorPickerContextValue = {
    value: string
    setValue: (v: string) => void
    open: boolean
    setOpen: (o: boolean) => void
    palette: string[]
}

const ColorPickerContext =
    React.createContext<ColorPickerContextValue | null>(null)

export function ColorPicker({
                                value,
                                defaultValue = "#000000",
                                onValueChange,
                                onOpenChange,
                                palette = DEFAULT_PALETTE,
                                children,
                            }: {
    value?: string
    defaultValue?: string
    onValueChange?: (v: string) => void
    onOpenChange?: (v: boolean) => void
    palette?: string[]
    children: React.ReactNode
}) {
    const controlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(
        value ?? defaultValue
    )

    React.useEffect(() => {
        if (controlled && value !== undefined) setInternalValue(value)
    }, [controlled, value])

    const onChange = (v: string) => {
        if (!controlled) setInternalValue(v)
        onValueChange?.(v)
    }

    const [open, setOpen] = React.useState(false)
    const setOpenWithCallback = (o: boolean) => {
        setOpen(o)
        onOpenChange?.(o)
    }

    const ctx: ColorPickerContextValue = {
        value: internalValue,
        setValue: onChange,
        open,
        setOpen: setOpenWithCallback,
        palette: palette.slice(0, 16),
    }

    return (
        <ColorPickerContext.Provider value={ctx}>
            <Popover open={open} onOpenChange={setOpenWithCallback}>
                {children}
            </Popover>
        </ColorPickerContext.Provider>
    )
}

export function ColorPickerTrigger({ asChild, children }: any) {
    return (
        <PopoverTrigger asChild={asChild}>
            {children}
        </PopoverTrigger>
    )
}

export function ColorPickerContent({ children }: { children: React.ReactNode }) {
    return (
        <PopoverContent
            className="z-50 w-auto rounded-md border bg-popover p-3 shadow-md"
            side="top"
            align="start"
        >
            {children}
        </PopoverContent>
    )
}

export function ColorPickerArea() {
    const ctx = React.useContext(ColorPickerContext)
    if (!ctx) return null

    const { value, setValue, palette, setOpen } = ctx

    const pick = (c: string) => {
        setValue(c)
        setOpen(false)
    }

    return (
        <div className="grid grid-cols-4 gap-2">
            {palette.map((c) => {
                const selected = c.toLowerCase() === value.toLowerCase()
                return (
                    <button
                        key={c}
                        type="button"
                        onClick={() => pick(c)}
                        title={c}
                        className={[
                            "h-6 w-6 rounded-md border",
                            selected
                                ? "border-primary ring-2 ring-primary ring-offset-1"
                                : "border-muted",
                        ].join(" ")}
                        style={{
                            backgroundColor: c,
                        }}
                    />
                )
            })}
        </div>
    )
}
