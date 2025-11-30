import InventorySlotsTool from "@/app/references/inventory_slots/InventorySlotsTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <InventorySlotsTool />
    )
}

export const metadata: Metadata = {
    title: "Inventory Slots - MinecraftUtils",
    description: "View the index of each slot in all different inventories."
};