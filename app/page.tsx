"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import GithubIcon from "@/app/components/icons/GithubIcon";
import DiscordIcon from "@/app/components/icons/DiscordIcon";
import {homepage_featured, renderIcon} from "@/app/AppStructure";

export default function HomePage() {

    return (
        <div className="w-[95%] max-w-6xl mx-auto space-y-10 py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold">Minecraft Tools & Utilities</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explore a collection of calculators, generators, and other utilities and references for making your Minecraft gameplay easier.
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

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Featured Utilities</h2>
                <p className="text-sm text-muted-foreground">
                    These are just some of our tools! For all tools, please see the sidebar.
                </p>
                <div className="flex flex-wrap gap-6 justify-center">
                    {homepage_featured.map((tool, index) => (
                        <Link key={index} href={tool.url} className="flex-1 min-w-[250px] max-w-sm">
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex items-center gap-4">
                                    {renderIcon(tool.icon)}
                                    <CardTitle>{tool.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{tool.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
