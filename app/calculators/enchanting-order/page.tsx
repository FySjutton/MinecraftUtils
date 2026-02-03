import {Metadata} from "next";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";
import {EnchantmentPlanner} from "@/app/calculators/enchanting-order/EnchantmentCalculator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Enchanting Order Calculator</h1>
            <p className="px-5 mx-auto w-full text-center">This utility lets you calculate the optimal way of enchanting an item, giving you the cheapest solution and helping you avoid &#34;Too Expensive&#34; errors in the anvil.</p>
            <ClientWrapper component={EnchantmentPlanner} />
        </>
    )
}

export const metadata: Metadata = {
    title: "Enchanting Order Calculator",
    description: "Calculate the cheapest way to enchant a specific item while avoiding the too expensive error."
};