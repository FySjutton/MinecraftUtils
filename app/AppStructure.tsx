import React, { JSX } from "react"
import {
    IconAlignBoxLeftBottom,
    IconBackpack,
    IconBellRingingFilled,
    IconBlob,
    IconBook, IconBottle,
    IconBraces,
    IconBubbleTea2, IconBuildingFactory2,
    IconBuildingLighthouse,
    IconCalculator,
    IconCircleNumber0,
    IconCode,
    IconH1,
    IconHanger2,
    IconHome,
    IconLibraryPhoto,
    IconMap,
    IconMapPins,
    IconPaw,
    IconRocket,
    IconSettings,
    IconSettingsUp, IconShield,
    IconStack3,
    IconTerminal2, IconTextScan2,
    IconTransform,
    IconUser,
    IconWand,
    IconWorld
} from "@tabler/icons-react";

export interface PageItem {
    name: string
    url: string
    icon?: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    description?: string
    external?: boolean
}

export interface ToolCategory {
    name: string
    icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    url: string
    defaultOpen?: boolean
    external?: boolean
    pages: PageItem[]
}

export const renderIcon = (icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string) => {
    if (!icon) return null
    if (typeof icon === "string") return <span>{icon}</span>
    if (React.isValidElement(icon)) return icon
    if (typeof icon === "function") return React.createElement(icon, { className: "size-4" })
    return null
}

function findPage(categories: ToolCategory[], pageName: string): PageItem {
    for (const category of categories) {
        const page = category.pages.find(p => p.name === pageName)
        if (page) return page
    }
    throw new Error(`Page "${pageName}" not found in any category`)
}


export const navMain: PageItem[] = [
    { name: "Home", url: "/", icon: <IconHome /> },
]

export const tools: ToolCategory[] = [
    {
        name: "Calculators",
        icon: <IconCalculator />,
        url: "/calculators",
        defaultOpen: true,
        pages: [
            { name: "Unit Calculator", url: "units", icon: <IconTransform />, description: "Convert units and measurements quickly." },
            { name: "XP to Level Calculator", url: "experience", icon: <IconBlob />, description: "Calculate how much XP each level is through an interactive experience bar." },
            { name: "Nether Calculator", url: "nether_cords", icon: <IconWorld />, description: "Convert coordinates between Overworld and Nether." },
        ],
    },
    {
        name: "References",
        icon: <IconLibraryPhoto />,
        url: "/references",
        defaultOpen: true,
        pages: [
            { name: "Inventory Slots", url: "inventory_slots", icon: <IconCircleNumber0 />, description: "Visual guide to inventory slot positions." },
        ],
    },
]

export const externals: ToolCategory[] = [
    {
        name: "Utilities",
        icon: <IconCalculator />,
        url: "#",
        external: true,
        pages: [
            { name: "Enchantment Ordering", url: "https://iamcal.github.io/enchant-order/", icon: <IconWand />, description: "Determine optimal enchantment order." },
            { name: "Sound Explorer", url: "https://mcutils.com/sound-explorer", icon: <IconBellRingingFilled />, description: "Browse Minecraft sounds and audio cues." },
            { name: "Skin Stealer", url: "https://minecraft.tools/en/skin.php", icon: <IconUser />, description: "Download and view player skins." },
            { name: "Armor Color Crafting", url: "https://minecraft.tools/en/armor.php", icon: <IconHanger2 />, description: "Mix and match armor colors." },
            { name: "Custom Potions", url: "https://minecraft.tools/en/potion.php", icon: <IconBubbleTea2 />, description: "Create potion recipes." },
            { name: "Beacon Color", url: "https://minecraft.tools/en/beacon-color.php", icon: <IconBuildingLighthouse />, description: "Visualize beacon beam colors." },
            { name: "Coordinate Calculator", url: "https://minecraft.tools/en/coordinate-calculator.php", icon: <IconMapPins />, description: "Calculate positions and distances." },
            { name: "Stack Calculator", url: "https://rapidtoolset.com/en/tool/minecraft-stack-calculator", icon: <IconStack3 />, description: "Compute stack counts efficiently." },
        ],
    },
    {
        name: "Generators",
        icon: <IconSettings />,
        url: "#",
        external: true,
        pages: [
            { name: "Mapart Generator", url: "https://rebane2001.com/mapartcraft/", icon: <IconMap />, description: "Generate maparts from images." },
            { name: "Selector Generator", url: "https://minecraft.tools/en/selector.php", icon: <IconBraces />, description: "Generate entity selectors." },
            { name: "Json Text Generator", url: "https://minecraft.tools/en/json_text.php", icon: <IconCode />, description: "Create custom chat messages." },
            { name: "Title Generator", url: "https://minecraft.tools/en/title.php", icon: <IconH1 />, description: "Generate title and subtitle commands." },
            { name: "Sign Generator", url: "https://minecraft.tools/en/sign.php", icon: <IconAlignBoxLeftBottom />, description: "Create custom signs for builds." },
            { name: "Book Generator", url: "https://minecraft.tools/en/book.php", icon: <IconBook />, description: "Create writable books." },
            { name: "/give Generator", url: "https://www.digminecraft.com/generators/give_tool.php", icon: <IconTerminal2 />, description: "Generate /give commands easily." },
            { name: "Summon Mob Generator", url: "https://www.digminecraft.com/generators/summon_mob.php", icon: <IconPaw />, description: "Generate summon commands for mobs." },
            { name: "Advanced Command Generator", url: "https://mcstacker.net/", icon: <IconSettingsUp />, description: "Complex command generation tool." },
            { name: "Datapack Generators", url: "https://misode.github.io/generators/", icon: <IconBackpack />, description: "Create custom datapacks." },
            { name: "Firework Creator", url: "https://mcutils.com/firework-creator", icon: <IconRocket />, description: "Generate fireworks commands." },
            { name: "Shield Editor", url: "https://minecraft.tools/en/shield.php", icon: <IconShield />, description: "Design custom shield patterns." },
            { name: "Motd Editor", url: "https://minecraft.tools/en/motd.php", icon: <IconTextScan2 />, description: "Customize server messages." },
        ],
    },
    {
        name: "References",
        icon: <IconLibraryPhoto />,
        url: "#",
        external: true,
        pages: [
            { name: "Brewing Guide", url: "https://minecraft.wiki/w/Brewing#/media/File:Minecraft_brewing_en.png", icon: <IconBottle />, description: "Step-by-step brewing reference." },
            { name: "Trading Guide", url: "https://minecraft.wiki/w/Trading#/media/File:Trading_and_Bartering_Guide_for_Minecraft_Java_Edition_1.17+.png", icon: <IconBuildingFactory2 />, description: "Reference for villager trades." },
        ],
    },
]

export const featuredHomePage: PageItem[] = [
    findPage(tools, "Unit Calculator"),
    findPage(tools, "XP to Level Calculator"),
    findPage(tools, "Nether Calculator"),
    findPage(tools, "Inventory Slots")
]

export const featuredCalculators: PageItem[] = [
    findPage(tools, "Unit Calculator"),
    findPage(tools, "XP to Level Calculator"),
    findPage(tools, "Nether Calculator")
]

export const featuredReferences: PageItem[] = [
    findPage(tools, "Inventory Slots"),
]

