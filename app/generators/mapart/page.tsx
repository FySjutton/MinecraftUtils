import { Metadata } from "next";
import { ClientWrapper } from "@/components/ClientLoadingWrapper";
import MapArtGenerator from "./MapartGenerator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Minecraft Map Art Generator</h1>
            <p className="px-5 mx-auto w-full text-center">
                Convert images to Minecraft map art with dithering, staircasing, and custom block palettes. Export as PNG or 3D NBT structure.
            </p>
            <ClientWrapper component={MapArtGenerator} props={{}} />
        </>
    );
}

export const metadata: Metadata = {
    title: "Map Art Generator",
    description: "Convert images to Minecraft map art with dithering, staircasing, and custom block palettes. Export as PNG or 3D NBT structure.",
};