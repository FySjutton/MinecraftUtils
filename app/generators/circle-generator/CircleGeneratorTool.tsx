"use client";

import React, { useState, useMemo } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { InteractiveCircleGroups } from "./CircleSvg";
import { CircleMode, CircleOptions, isCircleFilled } from "./CircleGenerator";
import { ZoomViewport } from "@/app/generators/circle-generator/ZoomViewport";
import { ComboBox } from "@/components/ComboBox";
import { defaultTheme, ThemeName, themeNames } from "@/app/generators/circle-generator/styling/themes";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { LucideLock, LucideUnlock } from "lucide-react";
import {download2DSchematic} from "@/lib/schematics/schematic2d";

export default function CircleGeneratorPage() {
    const [width, setWidth] = useState(15);
    const [height, setHeight] = useState(15);
    const [widthInput, setWidthInput] = useState(`${width}`);
    const [heightInput, setHeightInput] = useState(`${height}`);
    const [mode, setMode] = useState<CircleMode>("thick");
    const [thickness, setThickness] = useState(1);
    const [thicknessInput, setThicknessInput] = useState(`${thickness}`);
    const [isThicknessValid, setIsThicknessValid] = useState(true);
    const [theme, setTheme] = useState<ThemeName>(defaultTheme);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lockRatio, setLockRatio] = useState(true);

    const MIN_VALUE = 3;
    const [checks, setChecks] = useState<Map<string, boolean>>(new Map());

    const circleOptions: CircleOptions = {
        width,
        height,
        mode,
        thickness: mode == "thick" ? thickness : undefined,
    };

    const circleMap = useMemo(() => {
        const newMap = new Map<string, boolean>();
        const oldChecks = new Map(checks);

        const options: CircleOptions = {
            width,
            height,
            mode,
            thickness: mode == "thick" ? thickness : undefined,
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isCircleFilled(x, y, options)) {
                    const key = `${x},${y}`;
                    newMap.set(key, oldChecks.get(key) ?? false);
                }
            }
        }

        return newMap;
    }, [width, height, mode, thickness, checks]);

    const reset = () => {
        setWidth(15);
        setHeight(15);
        setWidthInput("15");
        setHeightInput("15");
        setMode("thick");
        setThickness(1);
        setThicknessInput("1");
        setIsThicknessValid(true);
        setChecks(new Map());
    };

    const handleWidthChange = (value: string) => {
        setWidthInput(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= MIN_VALUE) {
            setWidth(num);
            if (lockRatio) {
                setHeight(num);
                setHeightInput(num.toString());
            }
        }
    };

    const handleHeightChange = (value: string) => {
        setHeightInput(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= MIN_VALUE) {
            setHeight(num);
            if (lockRatio) {
                setWidth(num);
                setWidthInput(num.toString());
            }
        }
    };

    const totalSlots = circleMap.size;
    const checkedSlots = Array.from(circleMap.values()).filter(v => v).length;

    const exportSchematic = () => {
        const grid: boolean[][] = [];

        for (let y = 0; y < height; y++) {
            const row: boolean[] = [];
            for (let x = 0; x < width; x++) {
                const key = `${x},${y}`;
                row.push(circleMap.has(key));
            }
            grid.push(row);
        }

        download2DSchematic(grid, `minecraftutils_circle.schem`);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Circle / Ellipse Generator</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={reset}>Reset</Button>
                        <Button variant="outline" onClick={exportSchematic}>Export Schematic</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <Label>Width</Label>
                            <Input
                                type="text"
                                value={widthInput}
                                onChange={(e) => handleWidthChange(e.target.value)}
                                placeholder={`${MIN_VALUE}+`}
                                className="mt-2 outline-none"
                            />
                        </div>
                        <Button type="button" onClick={() => setLockRatio(!lockRatio)} className="mt-6" variant="outline">
                            {lockRatio ? <LucideLock /> : <LucideUnlock />}
                        </Button>
                        <div className="flex-1">
                            <Label>Height</Label>
                            <Input
                                type="text"
                                value={heightInput}
                                onChange={(e) => handleHeightChange(e.target.value)}
                                placeholder={`${MIN_VALUE}+`}
                                className="mt-2 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center max-[450]:block">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as CircleMode)} className="mr-2">
                            <TabsList className="max-[450]:w-full">
                                <TabsTrigger value="thick">Thick</TabsTrigger>
                                <TabsTrigger value="thin">Thin</TabsTrigger>
                                <TabsTrigger value="filled">Filled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {mode == "thick" && (
                            <InputGroup className="max-[450]:mt-2">
                                <InputGroupInput
                                    type="text"
                                    value={thicknessInput}
                                    onChange={(e) => {
                                        setThicknessInput(e.target.value);
                                        const num = parseInt(e.target.value, 10);
                                        if (!isNaN(num) && num >= 1) setThickness(num);
                                    }}
                                    placeholder="1+"
                                    className={`outline-none ${isThicknessValid ? "" : "border-red-500 border-2"}`}
                                />
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

            <Card className="gap-0 pb-0">
                <CardHeader>
                    <CardTitle>Circle Output</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={() => setIsFullscreen(true)}>Fullscreen</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="p-4 w-full">
                    <Card className="gap-0 mb-4">
                        <CardHeader>
                            <CardTitle>Circle Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>
                                <span className="font-bold">Blocks:</span>
                                {` ${totalSlots} (${totalSlots >= 64 ? `${Math.floor(totalSlots / 64)} stack${totalSlots / 64 < 2 ? "" : "s"}` : ""}${totalSlots % 64 != 0 && totalSlots >= 64 ? " and " : ""}${totalSlots % 64 != 0 ? `${totalSlots % 64} blocks` : ""})`}
                            </p>
                            <p>
                                <span className="font-bold">Progress:</span>
                                {` ${checkedSlots} / ${totalSlots} (${Math.round(checkedSlots / totalSlots * 10000) / 100}%)`}
                            </p>
                        </CardContent>
                    </Card>
                    <ZoomViewport cellWidth={width} cellHeight={height} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen}>
                        <InteractiveCircleGroups
                            options={circleOptions}
                            theme={theme}
                            checks={circleMap}
                            setChecks={setChecks}
                        />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
