import {Metadata} from "next";
import MotdCreator from "@/app/generators/motd-creator/MotdCreator";
import { ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">MOTD Creator</h1>
            <p className="px-5 mx-auto w-full text-center">Create motd for minecraft servers through a visual editor and ready to paste output.</p>
            <ClientWrapper component={MotdCreator} />
        </>
    )
}

export const metadata: Metadata = {
    title: "MOTD Creator",
    description: "Create motd for minecraft servers through a visual editor and ready to paste output."
};