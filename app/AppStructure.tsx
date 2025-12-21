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
    IconMapPins, IconPalette,
    IconPaw,
    IconRocket,
    IconSettings,
    IconSettingsUp, IconShield,
    IconTerminal2,
    IconTransform,
    IconUser,
    IconWand,
    IconWorld
} from "@tabler/icons-react";
import {Captions, Milestone, SlidersVertical, Sun} from "lucide-react";

export interface PageItem {
    name: string
    url: string
    icon?: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    description?: string
    external?: boolean
    type?: "beta" | "alpha"
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

function getPage(categories: ToolCategory[], pageName: string): PageItem {
    for (const category of categories) {
        const page = category.pages.find(p => p.name === pageName)
        if (page) {
            return {
                ...page,
                url: `${category.url}/${page.url}`
            }
        }
    }
    throw new Error(`Page "${pageName}" not found in any category`)
}

interface PageWithCategory extends PageItem {
    categoryUrl: string
}

export function getCurrentPage(pathname: string) {
    const allPages: PageWithCategory[] = [
        ...tools.flatMap(t => t.pages.map(p => ({ ...p, categoryUrl: t.url }))),
        ...externals.flatMap(t => t.pages.map(p => ({ ...p, categoryUrl: t.url }))),
    ];

    const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    return allPages.find(
        p => `${p.categoryUrl.replace(/^\/+/, "")}/${p.url.replace(/^\/+/, "")}` === cleanPath
    );
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
            { name: "Nether Calculator", url: "nether-cords", icon: <IconWorld />, description: "Convert coordinates between Overworld and Nether." },
        ],
    },
    {
        name: "Generators",
        icon: <SlidersVertical />,
        url: "/generators",
        defaultOpen: true,
        pages: [
            { name: "Beacon Generator", url: "beacon-color", icon: <Milestone />, description: "Calculate the optimal glass order for beacon colors with high accuracy, live preview, reverse mode.", type: "beta" },
            { name: "Sign Generator", url: "sign-generator", icon: <Milestone />, description: "Generate minecraft signs through an editor with live 3D preview.", type: "alpha" },
            { name: "Motd Creator", url: "motd-creator", icon: <Captions />, description: "Generate server motds through an interactive editor." },
        ],
    },
    {
        name: "References",
        icon: <IconLibraryPhoto />,
        url: "/references",
        defaultOpen: true,
        pages: [
            { name: "Daylight Cycle", url: "daylight-cycle", icon: <Sun />, description: "Interactive daylight cycle viewer, with video, daylight detector output, and time converter." },
            { name: "Inventory Slots", url: "inventory-slots", icon: <IconCircleNumber0 />, description: "Visual guide to inventory slot positions." },
            { name: "Color Codes", url: "color-codes", icon: <IconPalette />, description: "A list of all formatting codes in Minecraft." },
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
            { name: "Book Generator", url: "https://minecraft.tools/en/book.php", icon: <IconBook />, description: "Create writable books." },
            { name: "/give Generator", url: "https://www.digminecraft.com/generators/give_tool.php", icon: <IconTerminal2 />, description: "Generate /give commands easily." },
            { name: "Summon Mob Generator", url: "https://www.digminecraft.com/generators/summon_mob.php", icon: <IconPaw />, description: "Generate summon commands for mobs." },
            { name: "Advanced Command Generator", url: "https://mcstacker.net/", icon: <IconSettingsUp />, description: "Complex command generation tool." },
            { name: "Datapack Generators", url: "https://misode.github.io/generators/", icon: <IconBackpack />, description: "Create custom datapacks." },
            { name: "Firework Creator", url: "https://mcutils.com/firework-creator", icon: <IconRocket />, description: "Generate fireworks commands." },
            { name: "Shield Editor", url: "https://minecraft.tools/en/shield.php", icon: <IconShield />, description: "Design custom shield patterns." },
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
    getPage(tools, "Unit Calculator"),
    getPage(tools, "XP to Level Calculator"),
    getPage(tools, "Beacon Generator"),
    getPage(tools, "Sign Generator"),
    getPage(tools, "Nether Calculator"),
    getPage(tools, "Daylight Cycle"),
    getPage(tools, "Motd Creator"),
    getPage(tools, "Inventory Slots"),
    getPage(tools, "Color Codes")
]

export const featuredCalculators: PageItem[] = [
    getPage(tools, "Unit Calculator"),
    getPage(tools, "XP to Level Calculator"),
    getPage(tools, "Nether Calculator")
]

export const featuredGenerators: PageItem[] = [
    getPage(tools, "Beacon Generator"),
    getPage(tools, "Sign Generator"),
    getPage(tools, "Motd Creator"),
]

export const featuredReferences: PageItem[] = [
    getPage(tools, "Daylight Cycle"),
    getPage(tools, "Inventory Slots"),
    getPage(tools, "Color Codes"),
]

