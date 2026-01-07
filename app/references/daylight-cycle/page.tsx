import {Metadata} from "next";
import DaylightCycleTool from "@/app/references/daylight-cycle/DaylightCycleTool";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Daylight Cycle Viewer</h1>
            <p className="px-5 mx-auto w-full text-center">View how the sky looks at a certain time using an interactive tick wheel, with both ticks and a 24h clock. Complete with video and daylight detector output.</p>
            <DaylightCycleTool/>
        </>
    )
}

export const metadata: Metadata = {
    title: "Daylight Cycle",
    description: "View how the sky looks at a certain time, in both ticks and 24h clock."
};