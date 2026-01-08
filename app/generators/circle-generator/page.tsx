import {Metadata} from "next";
import CircleGeneratorPage from "@/app/generators/circle-generator/CircleGeneratorTool";

export default function Page() {
    return (
        <CircleGeneratorPage />
    )
}

export const metadata: Metadata = {
    title: "Circle Generator",
    description: "Generate circles for minecraft",
};