import {Button} from "@/components/ui/button";
import DiscordIcon from "@/components/icons/DiscordIcon";
import GithubIcon from "@/components/icons/GithubIcon";
import FeaturedUtils from "@/components/FeaturedUtils";
import React from "react";
import {featuredCalculators} from "@/app/AppStructure";
import {Metadata} from "next";

export default function Page() {
    return (
        <div className="w-[95%] max-w-6xl mx-auto space-y-10 py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold">MinecraftUtils - Calculators</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Our calculators lets you calculate everything from different units, to experience and coordinates.
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

            <FeaturedUtils title="Featured Calculators" description="These are just some of our calculators! For all calculators, please see the sidebar." utilities={featuredCalculators} />
        </div>
    )
}

export const metadata: Metadata = {
    title: "Calculators",
    description: "Multiple calculators for Minecraft-related calculations like units, coordinates and more."
};