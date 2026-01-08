"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

import {InteractiveCircleGroups} from "./CircleSvg";
import { CircleMode } from "./CircleGenerator";
import {ZoomViewport} from "@/app/generators/circle-generator/ZoomViewport";

export default function CircleGeneratorPage() {
    const [width, setWidth] = useState(31);
    const [height, setHeight] = useState(21);
    const [mode, setMode] = useState<CircleMode>("thick");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Circle / Ellipse Generator</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label>Width</Label>
                        <Slider
                            min={5}
                            max={101}
                            step={2}
                            value={[width]}
                            onValueChange={v => setWidth(v[0])}
                        />
                    </div>

                    <div>
                        <Label>Height</Label>
                        <Slider
                            min={5}
                            max={101}
                            step={2}
                            value={[height]}
                            onValueChange={v => setHeight(v[0])}
                        />
                    </div>

                    <Tabs value={mode} onValueChange={v => setMode(v as CircleMode)}>
                        <TabsList>
                            <TabsTrigger value="filled">Filled</TabsTrigger>
                            <TabsTrigger value="thin">Thin</TabsTrigger>
                            <TabsTrigger value="thick">Thick</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <ZoomViewport>
                        <InteractiveCircleGroups options={{ width, height, mode }} />
                    </ZoomViewport>

                </CardContent>
            </Card>
        </div>
    );
}
