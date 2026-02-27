import {Metadata} from "next";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";
import React from "react";
import RoadmapPage from "@/app/roadmap/Roadmap";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Roadmap</h1>
            <p className="px-5 mx-auto w-full text-center">Here you can see a list of all planned features, fixes and improvements in the near feature for all tools.<br />To suggest additional stuff, please open an issue on github.</p>
            <ClientWrapper component={RoadmapPage} />
        </>
    )
}

export const metadata: Metadata = {
    title: "Roadmap",
    description: "List of all planned features, fixes and improvements across MinecraftUtils.",
};