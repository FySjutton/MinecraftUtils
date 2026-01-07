import {Metadata} from "next";
import ExperienceTool from "@/app/calculators/experience/ExperienceTool";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Experience Converter</h1>
            <p className="px-5 mx-auto w-full text-center">Convert Minecraft experience levels to experience points with an interactive experience bar. Works both ways.</p>
            <ExperienceTool/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Experience Converter",
    description: "Convert Minecraft experience levels to experience points with an interactive experience bar."
};