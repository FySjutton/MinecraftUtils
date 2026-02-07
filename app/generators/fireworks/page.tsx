import {Metadata} from "next";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";
import FireworkGenerator from "@/app/generators/fireworks/FireworkGenerator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Minecraft Firework Generator</h1>
            {/*TODO: remove*/}
            <p className="px-5 mx-auto w-full text-center">XXX</p>
            <ClientWrapper component={FireworkGenerator} props={{circleOnly: false} } />
        </>
    )
}

export const metadata: Metadata = {
    title: "Firework Generator",
    description: "XXX",
};