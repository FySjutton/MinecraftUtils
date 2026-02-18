"use client";

import React, {ReactNode, useEffect, useState} from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GithubIcon from "@/components/icons/GithubIcon";
import {IconBrandDiscord, IconBrandYoutubeFilled} from "@tabler/icons-react";
import {YoutubeIcon} from "lucide-react";

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
            "Original creator of the website", "a", "b", "c", "d", "e", "f",
        ],
        medias: { "github": "https://github.com/FySjutton" }
    },
    {
        name: "Kruxa",
        role: "Helper",
        messages: [
            "Sorted mapart palette"
        ],
        medias: { "youtube": "https://www.youtube.com/@Kruxxa"}
    }
];

export default function ContributorsPage() {
    return (
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

                            <div className="flex flex-wrap gap-3 cursor-pointer justify-center mt-2">
                                {c.medias && Object.keys(c.medias).map((media, index) => {
                                    let mediaNode: ReactNode;
                                    switch (media) {
                                        case "github":
                                            mediaNode = <GithubIcon/>
                                            break
                                        case "youtube":
                                            mediaNode = <IconBrandYoutubeFilled/>
                                            break
                                        case "discord": mediaNode = <IconBrandDiscord/>;
                                    }
                                    return (
                                        <Link key={index} href={c.medias[media]}>
                                            <Button variant="outline" className="cursor-pointer">{mediaNode}</Button>
                                        </Link>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

// TODO: Finish this page, add metadata and more!