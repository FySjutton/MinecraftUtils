import {Metadata} from "next";
import BannerGenerator from "@/app/generators/banners/editor/BannerGenerator";
import MinecraftBannerLetters from "@/app/generators/banners/utils/letters/LetterGenerator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Letters Banner Generator</h1>
            <p className="px-5 mx-auto w-full text-center">Generate nice looking letters on banners with this useful utility.</p>
            <MinecraftBannerLetters />
        </>
    )
}

export const metadata: Metadata = {
    title: "Letters Banner Generator",
    description: "Generate custom banners and shields for minecraft with interactive editor and command output.",
};