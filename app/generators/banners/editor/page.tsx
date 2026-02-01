import {Metadata} from "next";
import BannerGenerator from "@/app/generators/banners/editor/BannerGenerator";
import UtilSelector from "@/app/generators/banners/UtilSelector";
import React from "react";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Banner Generator</h1>
            <p className="px-5 mx-auto w-full text-center">Generate custom banners and shields for minecraft with interactive editor and command output.</p>
            <ClientWrapper component={BannerGenerator} />

            <h2 className="text-2xl font-bold mb-2 mx-auto mt-2 text-center">Other Banner Generators</h2>
            <p className="px-5 mx-auto w-full text-center">Other banner generators, like the alphabet and more.</p>
            <div className="flex w-full justify-center mt-4">
                <UtilSelector ignore={"Banner Editor"}/>
            </div>
        </>
    )
}

export const metadata: Metadata = {
    title: "Banner Generator",
    description: "Generate custom banners and shields for minecraft with interactive editor and command output.",
};