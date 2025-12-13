import {Metadata} from "next";
import SignGenerator from "@/app/generators/sign-generator/SignGenerator";

export default function Page() {
    return (
        <SignGenerator />
    )
}

export const metadata: Metadata = {
    title: "Sign Generator - MinecraftUtils",
    description: "Generate accurate signs for minecraft."
};