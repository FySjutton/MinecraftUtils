import InventorySlotsTool from "@/app/references/inventory-slots/InventorySlotsTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Inventory Slots Reference</h1>
            <p className="px-5 mx-auto w-full text-center">View the slot indexes for each minecraft inventory type. With images, and multiple indexing types.</p>
            <InventorySlotsTool/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Inventory Slots",
    description: "Browse slot index layouts for every Minecraft inventory type."
};