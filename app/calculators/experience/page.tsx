import {Metadata} from "next";
import ExperienceTool from "@/app/calculators/experience/ExperienceTool";

export default function Page() {
    return (
        <ExperienceTool />
    )
}

export const metadata: Metadata = {
    title: "Experience Converter - MinecraftUtils",
    description: "Convert experience levels to experience points through an interactive experience bar."
};