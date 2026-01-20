import {DyeColorsReverse} from "@/lib/Colors";

export function generateCommand(mode: Mode, patterns: Pattern[], baseColor: string) {
    return `/give @p minecraft:${mode == "shield" ? "shield" : `${baseColor.startsWith("#") ? DyeColorsReverse[baseColor] : baseColor}_banner`}[banner_patterns=[${patterns
        .map((p) => {
            const colorKey = p.color.startsWith("#") ? DyeColorsReverse[p.color] : p.color
            return `{pattern:${p.pattern},color:${colorKey}}`
        }).join(',')}]${mode == "shield" ? `, minecraft:base_color="${baseColor.startsWith("#") ? DyeColorsReverse[baseColor] : baseColor}"` : ""}]`
}

export type Mode = "banner" | "shield"

export type Pattern = {
    pattern: PatternType
    color: string
}

export type Banner = {
    patterns: Pattern[]
    baseColor: string
}

export const patternList: Record<string, string> = {
    "border": "Bordure",
    "bricks": "Field Masoned",
    "circle": "Roundel",
    "creeper": "Creeper Charge",
    "cross": "Saltire",
    "curly_border": "Bordure Indented",
    "diagonal_left": "Per Bend Sinister",
    "diagonal_right": "Per Bend",
    "diagonal_up_left": "Per Bend Inverted",
    "diagonal_up_right": "Per Bend Sinister Inverted",
    "flow": "Flow",
    "flower": "Flower Charge",
    "globe": "Globe",
    "gradient": "Gradient",
    "gradient_up": "Base Gradient",
    "guster": "Guster",
    "half_horizontal": "Per Fess",
    "half_horizontal_bottom": "Per Fess Inverted",
    "half_vertical": "Per Pale",
    "half_vertical_right": "Per Pale Inverted",
    "mojang": "Thing",
    "piglin": "Snout",
    "rhombus": "Lozenge",
    "skull": "Skull Charge",
    "small_stripes": "Paly",
    "square_bottom_left": "Base Dexter Canton",
    "square_bottom_right": "Base Sinister Canton",
    "square_top_left": "Chief Dexter Canton",
    "square_top_right": "Chief Sinister Canton",
    "straight_cross": "Cross",
    "stripe_bottom": "Base",
    "stripe_center": "Pale",
    "stripe_downleft": "Bend Sinister",
    "stripe_downright": "Bend",
    "stripe_left": "Pale Dexter",
    "stripe_middle": "Fess",
    "stripe_right": "Pale Sinister",
    "stripe_top": "Chief",
    "triangle_bottom": "Chevron",
    "triangle_top": "Inverted Chevron",
    "triangles_bottom": "Base Indented",
    "triangles_top": "Chief Indented"
} as const;

export type PatternType = typeof patternList[keyof typeof patternList]