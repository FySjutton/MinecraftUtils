import {Metadata} from "next";
import ShapeGeneratorPage from "@/app/generators/shape-generator/ShapeGeneratorTool";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Minecraft Shape Generator</h1>
            <p className="px-5 mx-auto w-full text-center">Generate pixel perfect shapes for minecraft, with many options and utilities.</p>
            <ShapeGeneratorPage circleOnly={false} />
        </>
    )
}

export const metadata: Metadata = {
    title: "Shape Generator",
    description: "Generate pixel perfect shapes for minecraft, with many options and utilities.",
};