import UnitsTool from "@/app/calculators/units/UnitsTool";
import {Metadata} from "next";

export default function Page() {
    return (
        <UnitsTool />
    )
}

export const metadata: Metadata = {
    title: "Units Converter - MinecraftUtils",
    description: "Convert items and shulker boxes into stacks and more."
};