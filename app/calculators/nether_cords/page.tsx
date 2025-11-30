import NetherCordTool from "@/app/calculators/nether_cords/NetherCordTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <NetherCordTool></NetherCordTool>
    )
}

export const metadata: Metadata = {
    title: "Nether Coordinates - MinecraftUtils",
    description: "Calculate coordinates between nether and the overworld."
};