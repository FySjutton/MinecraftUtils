import {Metadata} from "next";
import CoordinateConverterTool from "@/app/calculators/coordinate-calculator/CoordinateCalculatorTool";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";
import {EnchantmentPlanner} from "@/app/calculators/enchantment-order/EnchantmentCalculator";

export default function Page() {
    return (
        // TODO: REMOVE ALL X
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">XXX</h1>
            <p className="px-5 mx-auto w-full text-center">XXX.</p>
            <ClientWrapper component={EnchantmentPlanner} />;
        </>
    )
}

export const metadata: Metadata = {
    title: "Enchantment Order Calculator",
    description: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
};