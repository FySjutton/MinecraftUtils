import {Metadata} from "next";
import BannerGenerator from "@/app/generators/banner-generator/BannerGenerator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Banner Generator</h1>
            <p className="px-5 mx-auto w-full text-center">Generate custom banners for minecraft with interactive editor and command output.</p>
            <BannerGenerator />
        </>
    )
}

export const metadata: Metadata = {
    title: "Banner Generator",
    description: "Generate custom banners for minecraft with interactive editor and command output.",
};