"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { InteractiveCircleGroups } from "./CircleSvg";
import { CircleMode } from "./CircleGenerator";
import { ZoomViewport } from "@/app/generators/circle-generator/ZoomViewport";

export default function CircleGeneratorPage() {
    const [width, setWidth] = useState(31);
    const [height, setHeight] = useState(21);
    const [widthInput, setWidthInput] = useState(`${width}`);
    const [heightInput, setHeightInput] = useState(`${height}`);
    const [mode, setMode] = useState<CircleMode>("thick");

    const MIN_VALUE = 3;
    const MAX_VALUE = 200;

    const handleWidthChange = (val: string) => {
        setWidthInput(val); // always update string
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= MIN_VALUE && num <= MAX_VALUE) {
            setWidth(num);
        }
    };

    const handleHeightChange = (val: string) => {
        setHeightInput(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= MIN_VALUE && num <= MAX_VALUE) {
            setHeight(num);
        }
    };

    const isWidthInvalid = parseInt(widthInput, 10) < MIN_VALUE || parseInt(widthInput, 10) > MAX_VALUE || isNaN(parseInt(widthInput, 10));
    const isHeightInvalid = parseInt(heightInput, 10) < MIN_VALUE || parseInt(heightInput, 10) > MAX_VALUE || isNaN(parseInt(heightInput, 10));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Circle / Ellipse Generator</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label>Width</Label>
                        <Input
                            type="text"
                            value={widthInput}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            placeholder={`${MIN_VALUE}-${MAX_VALUE}`}
                            className={`mt-2 outline-none ${isWidthInvalid ? "border-red-400" : ""}`}
                        />
                    </div>

                    <div>
                        <Label>Height</Label>
                        <Input
                            type="text"
                            value={heightInput}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            placeholder={`${MIN_VALUE}-${MAX_VALUE}`}
                            className={`mt-2 outline-none ${isHeightInvalid ? "border-red-400" : ""}`}
                        />
                    </div>

                    <Tabs value={mode} onValueChange={(v) => setMode(v as CircleMode)}>
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
