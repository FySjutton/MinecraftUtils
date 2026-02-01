import {Metadata} from "next";
import BeaconColorGenerator from "@/app/generators/beacon-color/BeaconColorGenerator";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <ClientWrapper component={BeaconColorGenerator} />
    )
}

export const metadata: Metadata = {
    title: "Beacon Beam Calculator",
    description: "Calculate the best glass combinations to achieve a specific beacon beam color in Minecraft. Accurate results for all presets.",
};