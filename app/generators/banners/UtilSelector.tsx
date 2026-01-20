import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function UtilSelector() {
    // All images are to be 16:9 (400x225)
    const utilities = [
        {
            name: "Letter Generator",
            link: "letters",
            image: "letters",
            description: "Generate letters on banners with custom colors.",
        }
    ]

    return (
        <div className="flex">
            {utilities.map(utility => (
                <Link href={`/generators/banners/${utility.link}`} key={utility.name}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{utility.name}</CardTitle>
                            <CardDescription>{utility.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="relative h-40 flex">
                            <Image
                                src={`/assets/tool/banner/utils/${utility.image}.png`}
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