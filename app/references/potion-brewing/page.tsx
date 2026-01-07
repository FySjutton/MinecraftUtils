import {Metadata} from "next";
import PotionBrewingTool from "@/app/references/potion-brewing/PotionBrewingTool";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Potion Brewing Guide</h1>
            <p className="px-5 mx-auto w-full text-center">View how to brew a specific potion in minecraft.</p>
            <PotionBrewingTool />
        </>
    )
}

export const metadata: Metadata = {
    title: "Potion Brewing Guide",
    description: "View how to brew a specific potion in minecraft."
};