import {Metadata} from "next";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";

export default function Page() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Banners</h1>
            <p className="px-5 mx-auto w-full text-center">Generate custom banners and shields for minecraft with interactive editor and command output.</p>

            <div className="w-full flex justify-center my-6">
                <a href="banners/editor">
                    <Button variant="outline">
                        Open Banner Editor
                    </Button>
                </a>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Minecraft Banner Patterns</CardTitle>
                    <CardDescription>View a collection of specific banner generators for special banners, like the alphabet and more.</CardDescription>
                </CardHeader>
                <CardContent>

                </CardContent>
            </Card>
        </div>
    )
}

export const metadata: Metadata = {
    title: "Banners",
    description: "Generate custom banners and shields for minecraft with interactive editor and command output.",
};