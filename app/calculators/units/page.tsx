import UnitsTool from "@/app/calculators/units/UnitsTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <UnitsTool />
    )
}

export const metadata: Metadata = {
    title: "Units Converter - MinecraftUtils",
    description: "Convert items, stacks, and shulker boxes into each other for easy Minecraft inventory calculations."
};