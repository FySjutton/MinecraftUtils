import {Metadata} from "next";
import ExperienceTool from "@/app/calculators/experience/ExperienceTool";

export default function Page() {
    return (
        <ExperienceTool />
    )
}

export const metadata: Metadata = {
    title: "Experience Converter - MinecraftUtils",
    description: "Convert Minecraft experience levels to experience points with an interactive experience bar."
};