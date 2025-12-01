import InventorySlotsTool from "@/app/references/inventory_slots/InventorySlotsTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <InventorySlotsTool />
    )
}

export const metadata: Metadata = {
    title: "Inventory Slots - MinecraftUtils",
    description: "Browse slot index layouts for every Minecraft inventory type."
};