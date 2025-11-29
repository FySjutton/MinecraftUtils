import {
    Calculator,
    Home,
    ReplaceAll,
    Orbit,
    Microwave,
    Square,
    AudioLines,
    Book,
    PersonStanding,
    Shield, ShieldEllipsis, Martini, Pencil, Captions, Type, VectorSquare, Move3d, Icon, Flame, BetweenVerticalEnd,
    FileStack, Radical, ChevronRight, Cat, SquareTerminal, Settings, GlassWater, ChartCandlestick, WandSparkles
} from "lucide-react"
import {bacon, textSquare} from '@lucide/lab';

import React from "react"

export const navMain = [
    { title: "Home", url: "/", icon: <Home /> },
]

export const tools = [
    {
        name: "Calculators",
        icon: <Calculator />,
        url: "/calculators",
        defaultOpen: true,
        pages: [
            { name: "Unit Calculator", url: "units", emoji: <ReplaceAll /> },
            { name: "XP to Level Calculator", url: "experience", emoji: <Orbit /> },
            { name: "Nether Calculator", url: "nether_cords", emoji: <Square /> },
        ],
    },
    {
        name: "Statics",
        icon: <Calculator/>,
        url: "#",
        defaultOpen: true,
        pages: [
            { name: "Inventory Slots", url: "inventory_slots", emoji: <BetweenVerticalEnd /> },
        ]
    }
]

export const externals = [
    {
        name: "Utilities",
        icon: <Calculator />,
        url: "#",
        external: true,
        pages: [
            { name: "Enchantment Ordering", url: "https://iamcal.github.io/enchant-order/", emoji: <WandSparkles /> },
            { name: "Sound Explorer", url: "https://mcutils.com/sound-explorer", emoji: <AudioLines /> },
            { name: "Skin Stealer", url: "https://minecraft.tools/en/skin.php", emoji: <PersonStanding /> },
            { name: "Armor Color Crafting", url: "https://minecraft.tools/en/armor.php", emoji: <Shield /> },
            { name: "Custom Potions", url: "https://minecraft.tools/en/potion.php", emoji: <Martini /> },
            { name: "Beacon Color", url: "https://minecraft.tools/en/beacon-color.php", emoji: <Icon iconNode={bacon} /> },
            { name: "Coordinate Calculator", url: "https://minecraft.tools/en/coordinate-calculator.php", emoji: <Move3d /> },
            { name: "Stack Calculator", url: "https://rapidtoolset.com/en/tool/minecraft-stack-calculator", emoji: <FileStack /> },
        ],
    },
    {
        name: "Generators",
        icon: <Settings />,
        url: "#",
        external: true,
        pages: [
            { name: "Selector Generator", url: "https://minecraft.tools/en/selector.php", emoji: <VectorSquare /> },
            { name: "Json Text Generator", url: "https://minecraft.tools/en/json_text.php", emoji: <Type /> },
            { name: "Title Generator", url: "https://minecraft.tools/en/title.php", emoji: <Captions /> },
            { name: "Sign Generator", url: "https://minecraft.tools/en/sign.php", emoji: <Pencil /> },
            { name: "Book Generator", url: "https://minecraft.tools/en/book.php", emoji: <Book /> },
            { name: "/give Generator", url: "https://www.digminecraft.com/generators/give_tool.php", emoji: <SquareTerminal /> },
            { name: "Summon Mob Generator", url: "https://www.digminecraft.com/generators/summon_mob.php", emoji: <Cat /> },
            { name: "Advanced Command Generator", url: "https://mcstacker.net/", emoji: <ChevronRight /> },
            { name: "Datapack Generators", url: "https://misode.github.io/generators/", emoji: <Radical /> },
            { name: "Firework Creator", url: "https://mcutils.com/firework-creator", emoji: <Flame />},
            { name: "Shield Editor", url: "https://minecraft.tools/en/shield.php", emoji: <ShieldEllipsis /> },
            { name: "Motd Editor", url: "https://minecraft.tools/en/motd.php", emoji: <Icon iconNode={textSquare} />},
        ]
    },
    {
        name: "Statics",
        icon: <Calculator/>,
        url: "#",
        external: true,
        pages: [
            { name: "Brewing Guide", url: "https://minecraft.wiki/w/Brewing#/media/File:Minecraft_brewing_en.png", emoji: <GlassWater /> },
            { name: "Trading Guide", url: "https://minecraft.wiki/w/Trading#/media/File:Trading_and_Bartering_Guide_for_Minecraft_Java_Edition_1.17+.png", emoji: <ChartCandlestick /> },
        ]
    }
]

