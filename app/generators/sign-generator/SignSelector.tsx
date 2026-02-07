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
import { Badge } from "@/components/ui/badge"
import {findImageAsset} from "@/lib/images/getImageAsset";

const WOOD_TYPES = [
    "oak",
    "spruce",
    "birch",
    "jungle",
    "acacia",
    "dark_oak",
    "mangrove",
    "cherry",
    "pale_oak",
    "bamboo",
    "crimson",
    "warped",
] as const

const SIGN_VARIANTS = [
    {
        id: "sign",
        label: "Normal",
        preview: "sign_preview",
        badgeVariant: "secondary",
    },
    {
        id: "hanging",
        label: "Hanging",
        preview: "hanging_preview",
        badgeVariant: "outline",
    },
] as const

export type WoodType = typeof WOOD_TYPES[number]
export type SignType = typeof SIGN_VARIANTS[number]["id"]

export interface SignState {
    signMaterial: WoodType
    signType: SignType
}

interface SignSelectorProps {
    value: SignState
    onChange: (value: SignState) => void
}

export default function SignSelector({ value, onChange }: SignSelectorProps) {
    const selectValue = `${value.signMaterial}:${value.signType}`

    return (
        <Select
            value={selectValue}
            onValueChange={(v) => {
                const [signMaterial, signType] = v.split(":") as [
                    WoodType,
                    SignType
                ]

                onChange({ signMaterial, signType })
            }}
        >
            <SelectTrigger className="w-[260px] flex items-center gap-2">
                <SelectValue placeholder="Select a sign" />
            </SelectTrigger>

            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Minecraft Signs</SelectLabel>

                    {WOOD_TYPES.map((wood) => (
                        <React.Fragment key={wood}>
                            {SIGN_VARIANTS.map((variant) => (
                                <SelectItem
                                    key={`${wood}-${variant.id}`}
                                    value={`${wood}:${variant.id}`}
                                    className="flex items-center gap-2"
                                >
                                    <Image
                                        src={findImageAsset(wood + "_" + variant.preview)}
                                        alt={`${wood} ${variant.id}`}
                                        width={20}
                                        height={20}
                                    />

                                    <span className="capitalize">
                                        {wood.replace("_", " ")}
                                    </span>

                                    <Badge
                                        variant={variant.badgeVariant}
                                        className="ml-auto"
                                    >
                                        {variant.label}
                                    </Badge>
                                </SelectItem>
                            ))}
                        </React.Fragment>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
