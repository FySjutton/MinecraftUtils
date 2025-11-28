import {Calculator, Home, ReplaceAll, Orbit, Microwave, Square, AudioLines} from "lucide-react"
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
            { name: "Furnace Calculator", url: "furnace", emoji: <Microwave /> },
            { name: "Nether Calculator", url: "nether_cords", emoji: <Square /> },
        ],
    },
]

export const externals = [
    {
        name: "Utilities",
        icon: <Calculator />,
        url: "#",
        defaultOpen: true,
        external: true,
        pages: [
            { name: "Sound Explorer", url: "https://mcutils.com/sound-explorer", emoji: <AudioLines /> },
        ],
    },
]

