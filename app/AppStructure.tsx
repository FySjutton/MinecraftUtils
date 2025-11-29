import {
    Calculator,
    Home,
    ReplaceAll,
    Orbit,
    Square,
    ImageIcon,
    BetweenVerticalEnd,
    WandSparkles,
    AudioLines,
    PersonStanding,
    Shield,
    Martini,
    Icon,
    Move3d,
    FileStack,
    VectorSquare,
    Type,
    Captions,
    Pencil,
    Book,
    SquareTerminal,
    ChevronRight,
    Cat,
    Radical,
    Flame,
    ShieldEllipsis,
    Settings,
    GlassWater,
    ChartCandlestick
} from "lucide-react"

import { bacon, textSquare } from "@lucide/lab"
import React, { JSX } from "react"

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

export const navMain: PageItem[] = [
    { name: "Home", url: "/", icon: <Home /> },
]

export const tools: ToolCategory[] = [
    {
        name: "Calculators",
        icon: <Calculator />,
        url: "/calculators",
        defaultOpen: true,
        pages: [
            { name: "Unit Calculator", url: "units", icon: <ReplaceAll />, description: "Convert units and measurements quickly." },
            { name: "XP to Level Calculator", url: "experience", icon: <Orbit />, description: "Calculate XP requirements and level progression." },
            { name: "Nether Calculator", url: "nether_cords", icon: <Square />, description: "Convert coordinates between Overworld and Nether." },
        ],
    },
    {
        name: "References",
        icon: <ImageIcon />,
        url: "/references",
        defaultOpen: true,
        pages: [
            { name: "Inventory Slots", url: "inventory_slots", icon: <BetweenVerticalEnd />, description: "Visual guide to inventory slot positions." },
        ],
    },
]

export const externals: ToolCategory[] = [
    {
        name: "Utilities",
        icon: <Calculator />,
        url: "#",
        external: true,
        pages: [
            { name: "Enchantment Ordering", url: "https://iamcal.github.io/enchant-order/", icon: <WandSparkles />, description: "Determine optimal enchantment order." },
            { name: "Sound Explorer", url: "https://mcutils.com/sound-explorer", icon: <AudioLines />, description: "Browse Minecraft sounds and audio cues." },
            { name: "Skin Stealer", url: "https://minecraft.tools/en/skin.php", icon: <PersonStanding />, description: "Download and view player skins." },
            { name: "Armor Color Crafting", url: "https://minecraft.tools/en/armor.php", icon: <Shield />, description: "Mix and match armor colors." },
            { name: "Custom Potions", url: "https://minecraft.tools/en/potion.php", icon: <Martini />, description: "Create potion recipes." },
            { name: "Beacon Color", url: "https://minecraft.tools/en/beacon-color.php", icon: <Icon iconNode={bacon} />, description: "Visualize beacon beam colors." },
            { name: "Coordinate Calculator", url: "https://minecraft.tools/en/coordinate-calculator.php", icon: <Move3d />, description: "Calculate positions and distances." },
            { name: "Stack Calculator", url: "https://rapidtoolset.com/en/tool/minecraft-stack-calculator", icon: <FileStack />, description: "Compute stack counts efficiently." },
        ],
    },
    {
        name: "Generators",
        icon: <Settings />,
        url: "#",
        external: true,
        pages: [
            { name: "Selector Generator", url: "https://minecraft.tools/en/selector.php", icon: <VectorSquare />, description: "Generate entity selectors." },
            { name: "Json Text Generator", url: "https://minecraft.tools/en/json_text.php", icon: <Type />, description: "Create custom chat messages." },
            { name: "Title Generator", url: "https://minecraft.tools/en/title.php", icon: <Captions />, description: "Generate title and subtitle commands." },
            { name: "Sign Generator", url: "https://minecraft.tools/en/sign.php", icon: <Pencil />, description: "Create custom signs for builds." },
            { name: "Book Generator", url: "https://minecraft.tools/en/book.php", icon: <Book />, description: "Create writable books." },
            { name: "/give Generator", url: "https://www.digminecraft.com/generators/give_tool.php", icon: <SquareTerminal />, description: "Generate /give commands easily." },
            { name: "Summon Mob Generator", url: "https://www.digminecraft.com/generators/summon_mob.php", icon: <Cat />, description: "Generate summon commands for mobs." },
            { name: "Advanced Command Generator", url: "https://mcstacker.net/", icon: <ChevronRight />, description: "Complex command generation tool." },
            { name: "Datapack Generators", url: "https://misode.github.io/generators/", icon: <Radical />, description: "Create custom datapacks." },
            { name: "Firework Creator", url: "https://mcutils.com/firework-creator", icon: <Flame />, description: "Generate fireworks commands." },
            { name: "Shield Editor", url: "https://minecraft.tools/en/shield.php", icon: <ShieldEllipsis />, description: "Design custom shield patterns." },
            { name: "Motd Editor", url: "https://minecraft.tools/en/motd.php", icon: <Icon iconNode={textSquare} />, description: "Customize server messages." },
        ],
    },
    {
        name: "Statics",
        icon: <Calculator />,
        url: "#",
        external: true,
        pages: [
            { name: "Brewing Guide", url: "https://minecraft.wiki/w/Brewing#/media/File:Minecraft_brewing_en.png", icon: <GlassWater />, description: "Step-by-step brewing reference." },
            { name: "Trading Guide", url: "https://minecraft.wiki/w/Trading#/media/File:Trading_and_Bartering_Guide_for_Minecraft_Java_Edition_1.17+.png", icon: <ChartCandlestick />, description: "Reference for villager trades." },
        ],
    },
]

export const homepage_featured: PageItem[] = [
    tools[1].pages[0], // Inventory Slots
    tools[0].pages[2], // Nether Calculator
    tools[0].pages[1], // XP to Level Calculator
    externals[0].pages[0], // Enchantment Ordering
    externals[0].pages[2], // Skin Stealer
]
