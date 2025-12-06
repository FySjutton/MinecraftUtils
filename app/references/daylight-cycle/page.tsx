import {Metadata} from "next";
import DaylightCycleTool from "@/app/references/daylight-cycle/DaylightCycleTool";

export default function Page() {
    return (
        <DaylightCycleTool />
    )
}

export const metadata: Metadata = {
    title: "Daylight Cycle - MinecraftUtils",
    description: "View how the sky looks at a certain time, in both ticks and 24h clock."
};