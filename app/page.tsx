import React from "react"
import {Button} from "@/components/ui/button"
import GithubIcon from "@/components/icons/GithubIcon";
import DiscordIcon from "@/components/icons/DiscordIcon";
import FeaturedUtils from "@/components/FeaturedUtils";
import {featuredHomePage} from "@/app/AppStructure";

export default function HomePage() {
    return (
        <div className="w-[95%] max-w-6xl mx-auto space-y-10 py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold">Minecraft Tools & Utilities</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explore a collection of calculators, generators, and other utilities and references for making your
                    Minecraft gameplay easier.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                    <a href="https://discord.gg/tqn38v6w7k" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <DiscordIcon/> Discord Server
                        </Button>
                    </a>
                    <a href="https://github.com/FySjutton/MinecraftUtils" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <GithubIcon/> Open Source
                        </Button>
                    </a>
                </div>
            </div>

            <FeaturedUtils title="Featured Utilities" description="These are just some of our tools! For all tools, please see the sidebar." utilities={featuredHomePage}/>
        </div>
    )
}