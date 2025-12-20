import {Metadata} from "next";
import BeaconColorTool from "@/app/generators/beacon-color/BeaconColorGenerator";
import BeaconColorGenerator from "@/app/generators/beacon-color/BeaconColorGenerator";

export default function Page() {
    return (
        <BeaconColorGenerator />
    )
}

export const metadata: Metadata = {
    title: "Beacon Color - MinecraftUtils",
    description: "Calculate the best beacon color setup."
};