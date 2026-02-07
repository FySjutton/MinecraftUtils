import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {findImageAsset} from "@/lib/images/getImageAsset";

export default function UtilSelector({ ignore }: { ignore?: string }) {
    // All images are to be 16:9 (400x225)
    // Name must match the "title" given in the generator file!
    const utilities = [
        {
            name: "Banner Editor",
            link: "editor",
            image: "editor",
            description: "Generate custom banners and shields for minecraft with interactive editor and command output.",
        },
        {
            name: "Minecraft Banner Letters",
            link: "letters",
            image: "letters",
            description: "Generate letters on banners with custom colors.",
        }
    ]

    return (
        <div className="flex gap-4 items-stretch flex-wrap">
            {utilities.filter(util => util.name != ignore).map(utility => (
                <Link href={`/generators/banners/${utility.link}`} key={utility.name}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{utility.name}</CardTitle>
                            <CardDescription>{utility.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="relative h-40 flex">
                            <Image
                                src={findImageAsset(utility.image)}
                                alt={utility.name}
                                width={400}
                                height={225}
                                className="w-auto h-full"
                            />
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}