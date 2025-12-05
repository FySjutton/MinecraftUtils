import {Metadata} from "next";
import MotdCreator from "@/app/generators/motd-creator/MotdCreator";

export default function Page() {
    return (
        <MotdCreator />
    )
}

export const metadata: Metadata = {
    title: "MOTD Creator - MinecraftUtils",
    description: "Generate minecraft motd for servers! Complete with preview and an editor."
};