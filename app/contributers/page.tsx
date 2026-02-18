"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Contributor = {
    name: string;
    role?: string;
    github?: string;
    cardLink?: string;
    logo?: string;
    message?: string;
};

const contributors: Contributor[] = [
    { name: "Fy17", role: "Developer", message: "Created this site", github: "FySjutton"},
    { name: "Bob", role: "Designer", message: "Created the main branding" },
    { name: "Carol", role: "Backend Developer", cardLink: "https://carol.dev" },
    { name: "Dave", role: "Tester", github: "daveGH" },
];

export default function ContributorsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-center">Contributors</h1>
            <p className="text-center mb-8 text-muted-foreground px-4">
                Thank you to everyone who has contributed to the project. Your work, whether in code, design, or documentation, is appreciated!
            </p>

            <div className="flex flex-wrap justify-center gap-4 items-stretch">
                {contributors.map((c, idx) => {
                    const link = c.cardLink || (c.github ? `https://github.com/${c.github}` : undefined);
                    const logoSrc = c.logo ?? (c.github ? `https://github.com/${c.github}.png` : null);

                    return (
                        <Link key={idx} href={link ?? "#"} target={link ? "_blank" : undefined} rel={link ? "noopener noreferrer" : undefined}>
                            <Card className="flex flex-col items-center text-center p-4 cursor-pointer w-70 h-full">
                                <CardHeader className="flex flex-col items-center">
                                    {logoSrc ? (
                                        <img src={logoSrc} alt={c.name} width={64} height={64} className="rounded-full mb-2 w-18 h-18" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-300 rounded-full mb-2 flex items-center justify-center text-xl font-bold text-gray-700">
                                            {c.name.charAt(0)}
                                        </div>
                                    )}
                                    <CardTitle>{c.name}</CardTitle>
                                    {c.role && <CardDescription>{c.role}</CardDescription>}
                                </CardHeader>

                                {c.message && (
                                    <CardContent className="text-sm text-muted-foreground mt-2">
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>{c.message}</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">{c.message}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardContent>
                                )}

                                {link && (
                                    <CardContent className="mt-2">
                                        <Button asChild variant="outline" size="sm">View Profile</Button>
                                    </CardContent>
                                )}
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// TODO: Finish this page, add metadata and more!