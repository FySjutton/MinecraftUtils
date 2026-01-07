import {Metadata} from "next";

import ColorCodeReference from "@/app/references/color-codes/ColorCodeReference";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Minecraft Color Codes</h1>
            <p className="px-5 mx-auto w-full text-center">View a list of all available color codes and formatting codes for minecraft.</p>
            <ColorCodeReference/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Color Codes",
    description: "View all different color codes for minecraft."
};