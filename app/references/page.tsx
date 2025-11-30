"use client"

import {Button} from "@/components/ui/button";
import DiscordIcon from "@/components/icons/DiscordIcon";
import GithubIcon from "@/components/icons/GithubIcon";
import FeaturedUtils from "@/components/FeaturedUtils";
import React from "react";
import {featuredReferences} from "@/app/AppStructure";

export default function Page() {
    return (
        <div className="w-[95%] max-w-6xl mx-auto space-y-10 py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold">MinecraftUtils - References</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Our references contains helpful images, texts and guides.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                    <a href="https://discord.gg/tqn38v6w7k" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <DiscordIcon /> Discord Server
                        </Button>
                    </a>
                    <a href="https://github.com/FySjutton/MinecraftUtils" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <GithubIcon /> Open Source
                        </Button>
                    </a>
                </div>
            </div>

            <FeaturedUtils title="Featured References" description="These are just some of our references! For all references, please see the sidebar." utilities={featuredReferences} />
        </div>
    )
}
