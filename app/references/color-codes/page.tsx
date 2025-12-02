import {Metadata} from "next";

import ColorCodeReference from "@/app/references/color-codes/ColorCodeReference";

export default function Page() {
    return (
        <ColorCodeReference />
    )
}

export const metadata: Metadata = {
    title: "Color Codes - MinecraftUtils",
    description: "View all different color codes for minecraft."
};