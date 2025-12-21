import {Metadata} from "next";
import BeaconColorGenerator from "@/app/generators/beacon-color/BeaconColorGenerator";

export default function Page() {
    return (
        <BeaconColorGenerator />
    )
}

export const metadata: Metadata = {
    title: "Beacon Color - MinecraftUtils",
    description: "Calculate the beacon beam color."
};