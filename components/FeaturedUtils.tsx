"use client"

import React from "react"
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {PageItem, renderIcon} from "@/app/_structure/StructureUtils";

export default function FeaturedUtils({title, description, utilities}: {
    title: string
    description: string
    utilities: PageItem[]
}) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">
                {description}
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
                {utilities.map((tool, index) => {
                    if (tool.type === "alpha") return null
                    if (tool.unlisted) return null;
                    return (
                        <Link key={index} href={tool.url} className="flex-1 min-w-[250px] max-w-sm">
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer gap-2">
                                <CardHeader className="flex flex-wrap justify-center w-full">
                                    <div className="w-full flex justify-center">
                                        {renderIcon(tool.icon, 120)}
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between mt-2">
                                        <CardTitle>{tool.name}</CardTitle>
                                        {tool.type === "beta" && (
                                            <Badge variant="secondary" className="bg-blue-500 ml-3">
                                                Beta
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <CardDescription className="text-center">{tool.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
