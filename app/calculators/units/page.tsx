import UnitsTool from "@/app/calculators/units/UnitsTool";
import {Metadata} from "next";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Units Converter</h1>
            <p className="px-5 mx-auto w-full text-center">Convert items, stacks and shulker boxes into each other for easy Minecraft inventory calculations.</p>
            <ClientWrapper component={UnitsTool} />
        </>
    )
}

export const metadata: Metadata = {
    title: "Units Converter",
    description: "Convert items, stacks and shulker boxes into each other for easy Minecraft inventory calculations."
};