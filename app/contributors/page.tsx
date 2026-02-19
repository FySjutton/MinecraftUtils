import React, {ReactNode} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GithubIcon from "@/components/icons/GithubIcon";
import {IconBrandDiscordFilled, IconBrandYoutubeFilled} from "@tabler/icons-react";
import {Metadata} from "next";

type Contributor = {
    name: string;
    medias: Record<string, string>;
    role?: string;
    logo?: string;
    messages?: string[];
};

const contributors: Contributor[] = [
    {
        name: "Fy17",
        role: "Founder & Developer",
        logo: "https://github.com/FySjutton.png",
        messages: [
            "Original creator of the website"
        ],
        medias: { "github": "https://github.com/FySjutton", "discord": "https://discord.gg/tS7regy34M" }
    },
    {
        name: "Kruxa",
        role: "Helper",
        logo: "https://i.ibb.co/Vp09X2c7/kruxa-avatar.jpg",
        messages: [
            "Sorted the mapart palette"
        ],
        medias: { "youtube": "https://www.youtube.com/@Kruxxa", "discord": "https://discord.gg/ReH5tyaHRy"}
    }
];

export default function ContributorsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Contributors</h1>
            <p className="px-5 mx-auto w-full text-center mb-6">Big thanks to everyone who has contributed to this project! Here&#39;s a list of all of the people who has contributed.</p>
            <div className="flex flex-wrap justify-center gap-4">
                {contributors.map((c, idx) => {
                    const initials = c.name.split(" ").map((n) => n[0]).join("").toUpperCase();

                    return (
                        <Card key={idx} className="h-full w-75">
                            <CardContent className="flex flex-col items-center h-full">
                                {c.logo ? (
                                    <img src={c.logo} alt={c.name} className="min-w-24 h-24 rounded-full mb-2" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-300 mb-2 flex items-center justify-center font-bold text-xl">
                                        {initials}
                                    </div>
                                )}
                                <p className="font-bold mt-2 mb-2 text-lg">{c.name}</p>
                                {c.role && <p className="text-gray-300 text-sm">{c.role}</p>}

                                <div className="max-h-18 overflow-y-auto mt-2 text-center p-2 mb-auto">
                                    {c.messages && c.messages.map((message, index) => (
                                        <p key={index} className="text-xs">{message}</p>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 cursor-pointer justify-center mt-2">
                                    {c.medias && Object.keys(c.medias).map((media, index) => {
                                        let mediaNode: ReactNode;
                                        switch (media) {
                                            case "github":
                                                mediaNode = <GithubIcon/>
                                                break
                                            case "youtube":
                                                mediaNode = <IconBrandYoutubeFilled/>
                                                break
                                            case "discord": mediaNode = <IconBrandDiscordFilled/>;
                                        }
                                        return (
                                            <Link key={index} href={c.medias[media]}>
                                                <Button variant="outline">{mediaNode}</Button>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export const metadata: Metadata = {
    title: "Contributors",
    description: "A list of all contributors to MinecraftUtils, thanks to everyone who contributes!"
};
