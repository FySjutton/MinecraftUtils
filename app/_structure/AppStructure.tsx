import React from "react"
import {
    IconBackpack,
    IconBellRingingFilled,
    IconBook,
    IconBraces,
    IconBubbleTea2, IconBuildingFactory2,
    IconCalculator,
    IconCode,
    IconH1,
    IconHanger2,
    IconLibraryPhoto,
    IconMap,
    IconPaw,
    IconRocket,
    IconSettings,
    IconSettingsUp, IconShield,
    IconTerminal2,
    IconUser, IconWand
} from "@tabler/icons-react";
import {SlidersVertical} from "lucide-react";
import {getPage, PageItem, ToolCategory} from "@/app/_structure/StructureUtils";


export const tools: ToolCategory[] = [
    {
        name: "Calculators",
        icon: <IconCalculator />,
        url: "/calculators",
        defaultOpen: true,
        pages: [
            { name: "Enchanting Calculator", url: "enchanting-order", icon: "enchanted_book", description: "Calculate the cheapest way to enchant a specific item while avoiding the too expensive error.", type: "beta" },
            { name: "Unit Calculator", url: "units", icon: "shulkerbox", description: "Convert units and measurements quickly." },
            { name: "XP to Level Calculator", url: "experience", icon: "xp-bottle", description: "Calculate how much XP each level is through an interactive experience bar." },
            { name: "Coordinate Calculator", url: "coordinate-calculator", icon: "filled_map", description: "Convert coordinates between the overworld, chunks, regions as well as nether coordinates." },
        ],
    },
    {
        name: "Generators",
        icon: <SlidersVertical />,
        url: "/generators",
        defaultOpen: true,
        pages: [
            { name: "Mapart Generator", url: "mapart", icon: "filled_map", description: "Generate advanced and accurate minecraft maparts, with staircasing, dithering and more.", type: "alpha" },
            { name: "Beacon Generator", url: "beacon-color", icon: "3d_beacon", description: "Calculate the optimal glass order for beacon colors with high accuracy, live preview, reverse mode." },
            { name: "Circle Generator", url: "circle-generator", icon: "circle-generator", description: "Generate pixel perfect circles for minecraft.", type: "beta" },
            { name: "Firework Generator", url: "fireworks", icon: "firework", description: "Generate advanced fireworks with preview, instructions, and output command.", type: "beta" },
            { name: "Shape Generator", url: "shape-generator", icon: "shape-generator", description: "Generate pixel perfect shapes for minecraft.", type: "beta" },
            { name: "Banner Generator", url: "banners", icon: "banner", description: "Create banners through an interactive editor with command and crafting instructions output.", type: "beta" },
            { name: "Sign Generator", url: "sign-generator", icon: "3d_sign", description: "Generate minecraft signs through an editor with live 3D preview.", type: "alpha", unlisted: true },
            { name: "Motd Creator", url: "motd-creator", icon: "motd", description: "Generate server motds through an interactive editor." },
        ],
    },
    {
        name: "References",
        icon: <IconLibraryPhoto />,
        url: "/references",
        defaultOpen: true,
        pages: [
            { name: "Daylight Cycle", url: "daylight-cycle", icon: "sun", description: "Interactive daylight cycle viewer, with video, daylight detector output, and time converter." },
            { name: "Potion Brewing", url: "potion-brewing", icon: "potion", description: "View instructions how to brew a specific potion." },
            { name: "Inventory Slots", url: "inventory-slots", icon: "3d_chest", description: "Visual guide to inventory slot positions." },
            { name: "Color Codes", url: "color-codes", icon: "colors", description: "A list of all formatting codes in Minecraft." },
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
            { name: "Trading Guide", url: "https://minecraft.wiki/w/Trading#/media/File:Trading_and_Bartering_Guide_for_Minecraft_Java_Edition_1.17+.png", icon: <IconBuildingFactory2 />, description: "Reference for villager trades." },
        ],
    },
]

export const featuredHomePage: PageItem[] = [
    getPage(tools, "Shape Generator"),
    getPage(tools, "Enchanting Calculator"),
    getPage(tools, "Mapart Generator"),
    getPage(tools, "Firework Generator"),
    getPage(tools, "Unit Calculator"),
    getPage(tools, "XP to Level Calculator"),
    getPage(tools, "Beacon Generator"),
    getPage(tools, "Potion Brewing"),
    getPage(tools, "Banner Generator"),
    getPage(tools, "Sign Generator"),
    getPage(tools, "Circle Generator"),
    getPage(tools, "Coordinate Calculator"),
    getPage(tools, "Daylight Cycle"),
    getPage(tools, "Motd Creator"),
    getPage(tools, "Inventory Slots"),
    getPage(tools, "Color Codes")
]

export const featuredCalculators: PageItem[] = [
    getPage(tools, "Enchanting Calculator"),
    getPage(tools, "Unit Calculator"),
    getPage(tools, "XP to Level Calculator"),
    getPage(tools, "Coordinate Calculator")
]

export const featuredGenerators: PageItem[] = [
    getPage(tools, "Mapart Generator"),
    getPage(tools, "Beacon Generator"),
    getPage(tools, "Shape Generator"),
    getPage(tools, "Firework Generator"),
    getPage(tools, "Banner Generator"),
    getPage(tools, "Sign Generator"),
    getPage(tools, "Motd Creator"),
]

export const featuredReferences: PageItem[] = [
    getPage(tools, "Daylight Cycle"),
    getPage(tools, "Potion Brewing"),
    getPage(tools, "Inventory Slots"),
    getPage(tools, "Color Codes"),
]

