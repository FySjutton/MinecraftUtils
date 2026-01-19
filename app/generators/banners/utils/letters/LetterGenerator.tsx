"use client"
import UtilBase from "@/app/generators/banners/utils/UtilBase";

type BannerValues = {
    background: string
    foreground: string
    text: string
}

export default function MinecraftBannerLetters() {
    function generate(values: BannerValues) {
        console.log(values)
    }

    return (
        <UtilBase<BannerValues>
            title="Minecraft Banner Letters"
            onGenerate={generate}
            inputs={[
                {
                    name: "background",
                    label: "Background",
                    kind: "color",
                    defaultValue: "#ffffff",
                },
                {
                    name: "foreground",
                    label: "Foreground",
                    kind: "color",
                    defaultValue: "#000000",
                },
                {
                    name: "text",
                    label: "Text",
                    kind: "text",
                    defaultValue: "",
                },
            ]}
        />
    )
}
