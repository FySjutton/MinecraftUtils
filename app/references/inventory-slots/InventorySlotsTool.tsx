"use client"

import React, {useState} from "react"
import Image from "next/image"
import { ComboBox } from "@/components/ComboBox"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from "@/components/ui/carousel"

export default function InventorySlotsTool() {
    const inventories = [
        // Most common / universal
        { label: "Player Inventory", value: "player_inventory" },
        { label: "Creative Inventory", value: "creative_inventory" },
        { label: "Creative Player Inventory", value: "creative_player_inventory" },

        // Storage blocks
        { label: "Chest", value: "chest" },
        { label: "Barrel", value: "chest" },
        { label: "Ender Chest", value: "chest" },
        { label: "Shulker Box", value: "shulker_box" },
        { label: "Double Chest", value: "double_chest" },

        // Furnaces & processing
        { label: "Furnace", value: "furnace" },
        { label: "Blast Furnace", value: "blast_furnace" },
        { label: "Smoker", value: "smoker" },
        { label: "Stonecutter", value: "stonecutter" },
        { label: "Grindstone", value: "grindstone" },
        { label: "Smithing Table", value: "smithing_table" },
        { label: "Loom", value: "loom" },
        { label: "Cartography Table", value: "cartography_table" },
        { label: "Anvil", value: "anvil" },
        { label: "Enchanting Table", value: "enchanting_table" },

        // Redstone / automation inventories
        { label: "Hopper", value: "hopper" },
        { label: "Dropper", value: "dropper" },
        { label: "Dispenser", value: "dispenser" },
        { label: "Brewing Stand", value: "brewing_stand" },
        { label: "Beacon", value: "beacon" },

        // Mobs & mounts
        { label: "Horse", value: "horse" },
        { label: "Donkey", value: "donkey_mule" },
        { label: "Mule", value: "donkey_mule" },
        { label: "Llama", value: "donkey_mule" },

        // Chest variants of mounts
        { label: "Donkey with Chest", value: "donkey_with_chest" },
        { label: "Mule with Chest", value: "donkey_with_chest" },
        { label: "Llama with Chest", value: "donkey_with_chest" },

        // Villagers
        { label: "Villager", value: "villager" }
    ]


    const labels = inventories.map(i => ( i.label ))
    const [selectedLabel, setSelectedLabel] = useState("Player Inventory")

    const [api, setApi] = useState<CarouselApi>()

    React.useEffect(() => {
        if (!api || !selectedLabel) return

        const index = inventories.findIndex(i => i.label === selectedLabel)
        if (index >= 0) api.scrollTo(index)
    }, [selectedLabel, api, inventories])

    React.useEffect(() => {
        if (!api) return

        api.on("select", () => {
            const index = api.selectedScrollSnap()
            const label = inventories[index]?.label
            if (label) setSelectedLabel(label)
        })
    }, [api, inventories])

    const reset = () => {
        setSelectedLabel("Player Inventory")
        api?.scrollTo(0)
    }

    return (
        <div className="w-[100%] lg:w-[80%] md:w-[90%] mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Minecraft Inventory Viewer</CardTitle>
                    <CardDescription>Select an inventory using the dropdown or the carousel below.</CardDescription>

                    <CardAction>
                        <Button variant="outline" onClick={reset}>
                            Reset
                        </Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    <ComboBox
                        items={labels}
                        value={selectedLabel}
                        onChange={setSelectedLabel}
                        placeholder="Choose an inventory"
                        placeholderSearch="Search inventory..."
                        className="w-full"
                    />

                    <Card>
                        <Carousel className="relative w-full max-w-[900px] mx-auto" setApi={setApi}>
                            {/* Top buttons for small screens */}
                            <div className="flex justify-between mb-4 px-4 md:hidden">
                                <CarouselPrevious free />
                                <CarouselNext free />
                            </div>

                            <div className="flex">
                                <div className="hidden md:flex flex-row items-center ml-2">
                                    <CarouselPrevious free />
                                </div>

                                <CarouselContent>
                                    {inventories.map((inv, index) => (
                                        <CarouselItem key={index}>
                                            <div className="flex items-center justify-center w-full p-2">
                                                <div className="flex items-center justify-center max-w-full">
                                                    <Image
                                                        src={`/assets/tool/inv_slots/${inv.value}.png`}
                                                        alt={inv.label}
                                                        width={900}
                                                        height={900}
                                                        className="w-full max-h-[60vh] md:max-h-[70vh] object-contain"
                                                        priority={index === 0}
                                                    />
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                                <div className="hidden md:flex flex-row items-center mr-2">
                                    <CarouselNext free />
                                </div>
                            </div>
                        </Carousel>
                    </Card>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Slot Indexes</CardTitle>
                    <CardDescription>
                        This tool lets you see how different Minecraft inventories map their slots.
                        Choose an inventory from the dropdown or swipe through the carousel.
                        Each screenshot shows colored numbers that explain how the game orders slots depending on the context.

                        <br /><br />
                        <strong>Yellow Numbers - &#34;Screen Order&#34;</strong><br />
                        Yellow numbers show the order of slots inside the currently open screen.
                        When you open a crafting table, chest, hopper, furnace, etc., the game builds a layout that combines the container&#39;s slots first, followed by your player inventory.
                        Use yellow numbers whenever you care about where a slot appears in the actual GUI.

                        <br /><br />
                        <strong>Pink Numbers - &#34;Inventory Order&#34;</strong><br />
                        Pink numbers show the slot&#39;s position inside the inventory it belongs to, ignoring the screen.
                        For example, your hotbar is always 0–8 in this internal order, even if it appears as slot 30 or higher on a chest screen.
                        Use pink numbers when you care about the slot’s true identity inside an inventory, no matter the screen.

                        <br /><br />
                        <strong>Green Numbers - &#34;Same in Both Views&#34;</strong><br />
                        A slot is green when the screen order and the inventory order happen to be the same.
                        This usually occurs when the layout of the screen doesn’t shift anything around, or when the player inventory is displayed alone.
                        Green means you can use either numbering system safely.
                    </CardDescription>
                </CardHeader>
            </Card>


        </div>
    )
}
