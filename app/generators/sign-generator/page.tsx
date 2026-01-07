import {Metadata} from "next";
import SignGenerator from "@/app/generators/sign-generator/SignGenerator";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Sign Generator</h1>
            <p className="px-5 mx-auto w-full text-center">Generate minecraft signs through the interactive editor, and preview the results on a 3d sign.</p>
            <SignGenerator/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Sign Generator",
    description: "Generate minecraft signs through a interactive editor, and preview the results on a 3d sign."
};