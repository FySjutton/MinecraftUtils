import {Metadata} from "next";
import StrongholdTriangulator from "@/app/calculators/stronghold-triangulator/StrongholdTriangulator";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Stronghold Triangulator</h1>
            <p className="px-5 mx-auto w-full text-center">Estimate the stronghold location by triangulating Eye of Ender throws.</p>
            <ClientWrapper component={StrongholdTriangulator} />
        </>
    )
}

export const metadata: Metadata = {
    title: "Stronghold Triangulator",
    description: "Estimate the stronghold location by triangulating Eye of Ender throws using player coordinates and yaw direction."
};
