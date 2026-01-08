"use client"

import React, { SetStateAction } from "react"
import Image from "next/image"
import potionsRaw from "./potions.json"

import { ComboBox } from "@/components/ComboBox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toTitleCase } from "@/app/generators/beacon-color/ResultCard"
import {Separator} from "@/components/ui/separator";

type PotionName = string
type IngredientName = string

type RecipeStep = PotionName | [IngredientName, PotionName]
type Recipe = RecipeStep[]

interface PotionData {
    image: string
    recipe: Recipe[]
    aliases?: string[],
    effect: string,
    potency?: number,
    length: number
}

const POTIONS = potionsRaw as Record<PotionName, PotionData>

function formatTime(seconds: number) {
    if (seconds == 0) return ""
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function isPotion(name: string): name is PotionName {
    return name in POTIONS
}

function sanitize(name: string) {
    return name.toLowerCase().replace(/\s+/g, "_")
}

const comboBoxItems: Record<string, string[]> = Object.fromEntries(
    Object.entries(potionsRaw).map(([name, data]) => [name, data.aliases || []])
)

function potionIcon(name: PotionName, type: "normal" | "splash" | "lingering" = "normal") {
    const p = POTIONS[name]
    if (p && p.image) return `/assets/tool/potion/${type}/${p.image}.png`
    return `/assets/tool/potion/${type}/${sanitize(name)}.png`
}

function ingredientIcon(name: IngredientName) {
    return `/assets/tool/potion/ingredients/${sanitize(name)}.png`
}

type Row = | { type: "potion"; name: PotionName } | { type: "ingredient"; name: IngredientName }

function buildChain(potion: PotionName, options: Record<PotionName, number>, out: Row[]) {
    const data = POTIONS[potion]
    if (!data?.recipe) return

    const recipe = data.recipe[options[potion] ?? 0]
    const start = recipe[0]

    if (typeof start === "string" && isPotion(start)) {
        buildChain(start, options, out)
    }

    out.push({ type: "potion", name: start as PotionName })

    for (const step of recipe.slice(1)) {
        if (!Array.isArray(step)) continue
        const [ingredient, result] = step
        out.push({ type: "ingredient", name: ingredient })
        out.push({ type: "potion", name: result })
    }
}

function RowView({icon, label, size, right}: { icon: string, label: string, size: "small" | "large", right?: React.ReactNode }) {
    return (
        <div className="flex items-center rounded-md border py-2 pl-2">
            <Image
                src={icon}
                alt={label}
                width={size === "large" ? 36 : 24}
                height={size === "large" ? 36 : 24}
                className={`${size === "small" ? "mr-[14]" : "mr-[2]"} image-pixelated`}
            />
            <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${size === "large" ? "font-semibold" : "text-xs"}`}>
                    {label}
                </span>
                {right}
            </div>
        </div>
    )
}

function InlineIngredientList({items}: { items: { type: "potion" | "ingredient"; name: string }[] }) {
    return (
        <div className="sticky top-[55] z-10 backdrop-blur border-b py-2  items-center">
            <Separator className="mb-[4]"/>
            <div className="flex gap-3 flex-wrap justify-center px-1">
                {items.map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-xs shrink-0">
                        <Image
                            src={item.type === "potion" ? potionIcon(item.name.replace(/^(Splash |Lingering )/, ""), "normal") : ingredientIcon(item.name)}
                            alt={item.name}
                            width={28}
                            height={28}
                            className="image-pixelated"
                        />
                        <span className="mt-1 text-muted-foreground whitespace-nowrap">
                        {toTitleCase(item.name.replaceAll("_", " "))}
                    </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PotionCard({ selectedPotion, potionType }: { selectedPotion: PotionName, potionType: "normal" | "splash" | "lingering" }) {
    const potion = POTIONS[selectedPotion];
    const lengthSeconds = Math.floor(potionType === "lingering"
        ? potion.length === 0
            ? potion.length / 2
            : potion.length / 4
        : potion.length);

    const displayLength = formatTime(lengthSeconds);
    let effect = potion.effect
    if (potion.potency) {
        effect = effect.replace("%d", (potionType == "lingering" ? (potion.potency / 2) : potion.potency).toString())
    }

    return (
        <div className="flex items-center mt-3 max-[400]:block max-[400]:ml-0">
            <Image
                src={potionIcon(selectedPotion, potionType)}
                alt={selectedPotion}
                width={160}
                height={160}
                className="w-30 border mr-3 image-pixelated"
            />
            <div className="mr-3">
                <p><span className="font-bold">Name:</span> {potionType !== "normal" ? `${toTitleCase(potionType)} ` : ""}{selectedPotion}</p>
                <p><span className="font-bold">Effect:</span> {effect}</p>
                {displayLength != "" && <p><span className="font-bold">Length:</span> {displayLength}</p>}
            </div>
        </div>
    );
}

export default function PotionBrewingTool() {
    const potionNames = Object.keys(POTIONS)
    const [selectedPotion, setSelectedPotion] = React.useState<PotionName>(potionNames[0])
    const [options, setOptions] = React.useState<Record<PotionName, number>>({})
    const [potionType, setPotionType] = React.useState<"normal" | "splash" | "lingering">("normal")

    const rows = React.useMemo(() => {
        const out: Row[] = []
        buildChain(selectedPotion, options, out)
        return out.filter(
            (r, i) =>
                i === 0 ||
                r.type !== out[i - 1].type ||
                r.name !== out[i - 1].name
        )
    }, [selectedPotion, options])

    const firstPotionIndex = React.useMemo(() => {
        const map = new Map<PotionName, number>()
        rows.forEach((r, i) => {
            if (r.type === "potion" && !map.has(r.name)) map.set(r.name, i)
        })
        return map
    }, [rows])

    const steps = React.useMemo(() => {
        const result: {
            start: PotionName
            ingredient: IngredientName
            product: PotionName
            type: "normal" | "splash" | "lingering"
        }[] = []

        let i = 0
        while (i < rows.length - 1) {
            const startPotion = rows[i].type === "potion" ? rows[i].name : ""
            const ingredient =
                rows[i + 1].type === "ingredient" ? rows[i + 1].name : ""
            const product =
                rows[i + 2]?.type === "potion" ? rows[i + 2].name : ""

            if (startPotion && ingredient && product) {
                result.push({ start: startPotion, ingredient, product, type: "normal" })
            }
            i += 2
        }

        if (potionType === "splash" && result.length) {
            const lastProduct = result[result.length - 1].product
            result.push({
                start: lastProduct,
                ingredient: "gunpowder",
                product: `Splash ${lastProduct}`,
                type: "splash",
            })
        } else if (potionType === "lingering" && result.length) {
            const lastProduct = result[result.length - 1].product
            const splashName = `Splash ${lastProduct}`
            result.push({
                start: lastProduct,
                ingredient: "gunpowder",
                product: splashName,
                type: "splash",
            })
            result.push({
                start: splashName,
                ingredient: "dragon_breath",
                product: `Lingering ${lastProduct}`,
                type: "lingering",
            })
        }

        return result
    }, [rows, potionType])

    const requiredItems = React.useMemo(() => {
        const items: { type: "potion" | "ingredient"; name: string }[] = []

        if (steps.length) {
            items.push({ type: "potion", name: steps[0].start })
        }

        steps.forEach((s) => {
            items.push({ type: "ingredient", name: s.ingredient })
        })

        return items
    }, [steps])

    return (
        <div className="w-full mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Potion Brewing Guide</CardTitle>
                </CardHeader>
                <CardContent>
                    <ComboBox
                        items={comboBoxItems}
                        value={selectedPotion}
                        onChange={setSelectedPotion}
                        placeholder="Choose potion"
                        placeholderSearch="Search potion..."
                        renderIcon={item => (
                            <Image
                                src={potionIcon(item)}
                                alt={item}
                                width={20}
                                height={20}
                                className="w-6 h-6 image-pixelated"
                            />
                        )}
                        renderItem={item => (
                            <p className="text-xs text-gray-400 max-[530]:hidden">
                                {POTIONS[item].potency ? POTIONS[item].effect.replace("%d", POTIONS[item].potency.toString()) : POTIONS[item].effect} {formatTime(POTIONS[item].length)}
                            </p>
                        )}
                        className="w-full max-[360]:max-w-[200]"
                    />

                    <div className="mt-4">
                        <Tabs
                            value={potionType}
                            onValueChange={(v) => setPotionType(v as SetStateAction<"normal" | "splash" | "lingering">)}
                        >
                            <TabsList>
                                <TabsTrigger value="normal">Normal</TabsTrigger>
                                <TabsTrigger value="splash">Splash</TabsTrigger>
                                <TabsTrigger value="lingering">Lingering</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <PotionCard selectedPotion={selectedPotion} potionType={potionType} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Brewing Steps ({toTitleCase(potionType)})</CardTitle>
                </CardHeader>
                <InlineIngredientList items={requiredItems} />

                <CardContent className="space-y-6">
                    {steps.map((s, idx) => {
                        const baseName = s.product.replace(/^(Splash |Lingering )/, "")
                        const potionData = POTIONS[baseName]

                        const showTabs =
                            potionData?.recipe &&
                            potionData.recipe.length > 1 &&
                            firstPotionIndex.get(s.product) === rows.findIndex((r) => r.type === "potion" && r.name === s.product)

                        const startIconType = idx === 0 ? "normal" : steps[idx - 1].type
                        const productIconType = s.type

                        return (
                            <div key={idx} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Step {idx + 1}
                                </div>

                                <RowView
                                    icon={potionIcon(
                                        s.start.replace(/^(Splash |Lingering )/, ""),
                                        startIconType
                                    )}
                                    label={`Start with: ${s.start}`}
                                    size="small"
                                />

                                <RowView
                                    icon={ingredientIcon(s.ingredient)}
                                    label={`Add ${toTitleCase(
                                        s.ingredient.replaceAll("_", " ")
                                    )}`}
                                    size="large"
                                />

                                <RowView
                                    icon={potionIcon(baseName, productIconType)}
                                    label={`Product: ${s.product}`}
                                    size="small"
                                    right={
                                        showTabs ? (
                                            <Tabs
                                                value={(options[s.product] ?? 0).toString()}
                                                onValueChange={(v) =>
                                                    setOptions((o) => ({
                                                        ...o,
                                                        [s.product]: Number(v),
                                                    }))
                                                }
                                                className="pr-2"
                                            >
                                                <TabsList>
                                                    {potionData!.recipe!.map((_, idx) => (
                                                        <TabsTrigger
                                                            key={idx}
                                                            value={idx.toString()}
                                                        >
                                                            Option {idx + 1}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>
                                            </Tabs>
                                        ) : null
                                    }
                                />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
