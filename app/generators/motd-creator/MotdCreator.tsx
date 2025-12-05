"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import MotdEditor from "@/app/generators/motd-creator/MotdEditor";
import {Colors} from "@/lib/Colors";

export default function MotdCreator() {

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-6 p-6">
            <Card className="w-full h-full">
                <CardHeader>
                    <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                    <MotdEditor />
                </CardContent>
            </Card>
        </div>
    )
}
