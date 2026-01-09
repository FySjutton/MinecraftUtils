"use client";

import React, { useState } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { InteractiveCircleGroups } from "./CircleSvg";
import { CircleMode, CircleOptions } from "./CircleGenerator";
import { ZoomViewport } from "@/app/generators/circle-generator/ZoomViewport";
import {ComboBox} from "@/components/ComboBox";
import {defaultTheme, ThemeName, themeNames} from "@/app/generators/circle-generator/styling/themes";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group";

export default function CircleGeneratorPage() {
    const [width, setWidth] = useState(15);
    const [height, setHeight] = useState(15);
    const [widthInput, setWidthInput] = useState(`${width}`);
    const [heightInput, setHeightInput] = useState(`${height}`);
    const [mode, setMode] = useState<CircleMode>("thick");
    const [thickness, setThickness] = useState(1);
    const [theme, setTheme] = useState<ThemeName>(defaultTheme);

    const MIN_VALUE = 3;
    const MAX_VALUE = 200;
    const MIN_THICKNESS = 1;
    const MAX_THICKNESS = 20;

    const emptyChecks = (): boolean[][] => {
        return Array.from({ length: height }, () => Array.from({ length: width }, () => false))
    }

    const [checks, setChecks] = useState<boolean[][]>(emptyChecks());

    const handleWidthChange = (val: string) => {
        setWidthInput(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= MIN_VALUE && num <= MAX_VALUE) setWidth(num);
    };

    const handleHeightChange = (val: string) => {
        setHeightInput(val);
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= MIN_VALUE && num <= MAX_VALUE) setHeight(num);
    };

    const handleThicknessChange = (val: string) => {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= MIN_THICKNESS && num <= MAX_THICKNESS) setThickness(num);
    };

    const circleOptions: CircleOptions = {
        width,
        height,
        mode,
        thickness: mode === "thick" ? thickness : undefined,
    };

    const reset = () => {
        setWidth(15);
        setHeight(15);
        setWidthInput("15");
        setHeightInput("15");
        setMode("thick");
        setThickness(1);
        setTheme(defaultTheme);
        setChecks(emptyChecks());
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Circle / Ellipse Generator</CardTitle>
                    <CardAction><Button variant="outline" onClick={reset}>Reset</Button></CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Width</Label>
                        <Input type="text" value={widthInput} onChange={(e) => handleWidthChange(e.target.value)} placeholder={`${MIN_VALUE}-${MAX_VALUE}`} className="mt-2 outline-none"/>
                    </div>
                    <div>
                        <Label>Height</Label>
                        <Input type="text" value={heightInput} onChange={(e) => handleHeightChange(e.target.value)} placeholder={`${MIN_VALUE}-${MAX_VALUE}`} className="mt-2 outline-none"/>
                    </div>
                    <div className="flex items-center">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as CircleMode)}>
                            <TabsList>
                                <TabsTrigger value="thick">Thick</TabsTrigger>
                                <TabsTrigger value="thin">Thin</TabsTrigger>
                                <TabsTrigger value="filled">Filled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {mode === "thick" && (
                            <InputGroup className="ml-2">
                                <InputGroupInput type="number" value={thickness} onChange={(e) => handleThicknessChange(e.target.value)} min={1} max={10}/>
                                <InputGroupAddon align="inline-end">Border Thickness</InputGroupAddon>
                            </InputGroup>
                        )}
                    </div>
                    <div>
                        <Label>Theme</Label>
                        <ComboBox
                            items={themeNames}
                            value={theme}
                            onChange={(value) => setTheme(value)}
                            placeholder="Select theme"
                            placeholderSearch="Search theme..."
                            className="mt-2"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 w-full">
                    <ZoomViewport cellWidth={width} cellHeight={height}>
                        <InteractiveCircleGroups options={circleOptions} theme={theme} checks={checks} setChecks={setChecks} />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
