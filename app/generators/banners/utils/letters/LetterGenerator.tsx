"use client"
import UtilBase, {Banner} from "@/app/generators/banners/utils/UtilBase"
import {Pattern} from "@/app/generators/banners/TextureManager";
import {PatternType} from "@/app/generators/banners/patterns";
import {DyeColors} from "@/lib/Colors";

type BannerValues = {
    background: string
    foreground: string
}

export default function MinecraftBannerLetters() {
    return (
        <UtilBase<BannerValues>
            title="Minecraft Banner Letters"
            inputs={[
                {
                    key: "background",
                    label: "Background",
                    kind: "color",
                    defaultValue: DyeColors.white,
                },
                {
                    key: "foreground",
                    label: "Foreground",
                    kind: "color",
                    defaultValue: DyeColors.black,
                }
            ]}
            getResultsAction={(values) => {
                const result: Record<string, Banner> = {}

                for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
                    const letterData = letters[letter]
                    if (!letterData) continue

                    const [baseUse, letterPatterns] = letterData

                    const patterns: Pattern[] = letterPatterns.map(([pattern, useBackground]) => ({
                        pattern,
                        color: useBackground ? values.background : values.foreground
                    }))

                    const baseColor = baseUse ? values.background : values.foreground

                    result[letter] = { patterns, baseColor }
                }

                return result
            }}
        />
    )
}

const letters: Record<string, [boolean, [PatternType, boolean][]]> = {
    "A": [true, [["stripe_right", false], ["stripe_left", false], ["stripe_middle", false], ["stripe_top", false], ["border", true]]],
    "B": [false, [["rhombus", true], ["stripe_right", false], ["curly_border", true], ["half_vertical", false], ["stripe_middle", false], ["border", true]]],
    "C": [true, [["stripe_top", false], ["stripe_bottom", false], ["stripe_right", false], ["stripe_middle", true], ["stripe_left", false], ["border", true]]],
    "D": [true, [["stripe_right", false], ["stripe_bottom", false], ["stripe_top", false], ["curly_border", true], ["stripe_left", false], ["border", true]]],
    "E": [true, [["stripe_left", false], ["stripe_top", false], ["stripe_middle", false], ["stripe_bottom", false], ["border", true]]],
    "F": [true, [["stripe_middle", false], ["stripe_right", true], ["stripe_top", false], ["stripe_left", false], ["border", true]]],
    "G": [true, [["stripe_right", false], ["half_horizontal", true], ["stripe_bottom", false], ["stripe_left", false], ["stripe_top", false], ["border", true]]],
    "H": [false, [["stripe_top", true], ["stripe_bottom", true], ["stripe_left", false], ["stripe_right", false], ["border", true]]],
    "I": [true, [["stripe_center", false], ["stripe_top", false], ["stripe_bottom", false], ["border", true]]],
    "J": [true, [["stripe_left", false], ["half_horizontal", true], ["stripe_bottom", false], ["stripe_right", false], ["border", true]]],
    "K": [true, [["stripe_downright", false], ["half_horizontal", true], ["stripe_downleft", false], ["stripe_left", false], ["border", true]]],
    "L": [true, [["stripe_bottom", false], ["stripe_left", false], ["border", true]]],
    "M": [true, [["triangle_top", false], ["triangles_top", true], ["stripe_left", false], ["stripe_right", false], ["border", true]]],
    "N": [true, [["stripe_left", false], ["triangle_top", true], ["stripe_downright", false], ["stripe_right", false], ["border", true]]],
    "O": [true, [["stripe_left", false], ["stripe_right", false], ["stripe_bottom", false], ["stripe_top", false], ["border", true]]],
    "P": [true, [["stripe_right", false], ["half_horizontal_bottom", true], ["stripe_middle", false], ["stripe_top", false], ["stripe_left", false], ["border", true]]],
    "Q": [false, [["rhombus", true], ["stripe_right", false], ["stripe_left", false], ["square_bottom_right", false], ["border", true]]],
    "R": [true, [["half_horizontal", false], ["stripe_center", true], ["stripe_top", false], ["stripe_left", false], ["stripe_downright", false], ["border", true]]],
    "S": [false, [["rhombus", true], ["stripe_middle", true], ["stripe_downright", false], ["border", true]]],
    "T": [true, [["stripe_top", false], ["stripe_center", false], ["border", true]]],
    "U": [true, [["stripe_bottom", false], ["stripe_left", false], ["stripe_right", false], ["border", true]]],
    "V": [true, [["stripe_downleft", false], ["stripe_left", false], ["triangle_bottom", true], ["stripe_downleft", false], ["border", true]]],
    "W": [true, [["triangle_bottom", false], ["triangles_bottom", true], ["stripe_left", false], ["stripe_right", false], ["border", true]]],
    "X": [true, [["cross", false], ["border", true]]],
    "Y": [true, [["stripe_downright", false], ["half_horizontal_bottom", true], ["stripe_downleft", false], ["border", true]]],
    "Z": [true, [["stripe_top", false], ["stripe_downleft", false], ["stripe_bottom", false], ["border", true]]]
} as const
