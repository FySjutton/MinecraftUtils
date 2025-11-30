"use client"

import React from "react"
import {PageItem, renderIcon} from "@/app/AppStructure";
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

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
                {utilities.map((tool, index) => (
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
    )
}
