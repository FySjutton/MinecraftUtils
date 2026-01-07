import NetherCordTool from "@/app/calculators/nether-cords/NetherCordTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Nether Coordinate Calculator</h1>
            <p className="px-5 mx-auto w-full text-center">Convert overworld coordinates to nether coordinates and the other way around.</p>
            <NetherCordTool/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Nether Coordinates",
    description: "Calculate corresponding coordinates between the Nether and Overworld in Minecraft."
};