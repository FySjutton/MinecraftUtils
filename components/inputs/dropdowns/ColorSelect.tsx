import * as React from "react"
import Image from "next/image"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {findImageAsset} from "@/lib/images/getImageAsset";

const COLORS = [
    "none",
    "white",
    "orange",
    "magenta",
    "light_blue",
    "yellow",
    "lime",
    "pink",
    "gray",
    "light_gray",
    "cyan",
    "purple",
    "blue",
    "brown",
    "green",
    "red",
    "black",
] as const

interface ColorSelectProps {
    value: string
    onChange: (color: string) => void
}

export default function ColorSelect({ value, onChange }: ColorSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[220px] flex items-center gap-2">
                <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Minecraft Colors</SelectLabel>
                    {COLORS.map((color) => (
                        <SelectItem key={color} value={color} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={findImageAsset(color)}
                                    alt={color}
                                    width={20}
                                    height={20}
                                    className="rounded-sm"
                                />
                                <span className="capitalize">{color.replace("_", " ")}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}