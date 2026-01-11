"use client";

import React, {useState, useMemo, useRef} from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { InteractiveShapeGroups } from "./ShapeSvg";
import {ShapeMode, ShapeOptions, isShapeFilled, shapes, Shape} from "./ShapeGenerator";
import { ZoomViewport } from "@/app/generators/shape-generator/ZoomViewport";
import { ComboBox } from "@/components/ComboBox";
import { defaultTheme, ThemeName, themeNames } from "@/app/generators/shape-generator/styling/themes";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { LucideLock, LucideUnlock } from "lucide-react";
import {ExportCard} from "@/app/generators/shape-generator/ExportCard";

export default function ShapeGeneratorPage({ circleOnly }: { circleOnly: boolean }) {
    const [shape, setShape] = useState<Shape>(circleOnly ? "Circle" : "Hexagon");
    const [sides, setSides] = useState(6);
    const [width, setWidth] = useState(shape == "Polygon" ? 45 : 15);
    const [height, setHeight] = useState(shape == "Polygon" ? 45 : 15);
    const [widthInput, setWidthInput] = useState(`${width}`);
    const [heightInput, setHeightInput] = useState(`${height}`);
    const [mode, setMode] = useState<ShapeMode>("thick");
    const [thickness, setThickness] = useState(1);
    const [thicknessInput, setThicknessInput] = useState(`${thickness}`);
    const [isThicknessValid, setIsThicknessValid] = useState(true);
    const [theme, setTheme] = useState<ThemeName>(defaultTheme);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lockRatio, setLockRatio] = useState(true);
    const [sidesInput, setSidesInput] = useState(`${sides}`);

    const MIN_VALUE = 3;
    const [checks, setChecks] = useState<Map<string, boolean>>(new Map());

    const svgRef = useRef<SVGSVGElement>(null);

    const shapeOptions: ShapeOptions = useMemo(() => {
        return { shape, width, height, mode, thickness: mode == "thick" ? thickness : undefined, sides };
    }, [height, mode, shape, sides, thickness, width]);

    const shapeMap = useMemo(() => {
        const newMap = new Map<string, boolean>();
        const oldChecks = new Map(checks);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isShapeFilled(x, y, shapeOptions)) {
                    const key = `${x},${y}`;
                    newMap.set(key, oldChecks.get(key) ?? false);
                }
            }
        }

        return newMap;
    }, [checks, height, width, shapeOptions]);

    const reset = () => {
        setWidth(15);
        setHeight(15);
        setWidthInput("15");
        setHeightInput("15");
        setSidesInput("6");
        setSides(6);
        setMode("thick");
        setThickness(1);
        setThicknessInput("1");
        setIsThicknessValid(true);
        setChecks(new Map());
    };

    const setShapeAction = (shape: Shape) => {
        setShape(shape);
        setHeight(shape == "Polygon" ? 45 : 15);
        setWidth(shape == "Polygon" ? 45 : 15);
    }

    const setLock = (newState: boolean) => {
        if (newState) {
            setHeight(width)
            setHeightInput(widthInput)
        }
        setLockRatio(newState);
    }

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

    const handleSidesChange = (value: string) => {
        setSidesInput(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setSides(num);
        }
    };

    const totalSlots = shapeMap.size;
    const checkedSlots = Array.from(shapeMap.values()).filter(v => v).length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{circleOnly ? "Circle / Ellipse" : "Shape"} Generator</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={reset}>Reset</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!circleOnly && (
                        <div>
                            <Label>Shape</Label>
                            <ComboBox
                                items={shapes}
                                value={shape as string}
                                onChange={(value) => setShapeAction(value as Shape)}
                                placeholder="Select shape"
                                className="mt-2"
                            />
                        </div>
                    )}

                    {shape == "Polygon" && (
                        <div className="flex-1">
                            <Label>Sides</Label>
                            <Input
                                type="text"
                                value={sides}
                                onChange={(e) => handleSidesChange(e.target.value)}
                                placeholder={`3+`}
                                className="mt-2 outline-none"
                            />
                        </div>
                    )}
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
                        <Button type="button" onClick={() => setLock(!lockRatio)} className="mt-6" variant="outline">
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
                        <Tabs value={mode} onValueChange={(v) => setMode(v as ShapeMode)} className="mr-2">
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
                    <ExportCard shapeMap={shapeMap} width={width} height={height} circleOnly={circleOnly} svgRef={svgRef} />
                </CardContent>
            </Card>

            <Card className="gap-0 pb-0">
                <CardHeader>
                    <CardTitle>{circleOnly ? "Circle" : "Shape"} Output</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={() => setIsFullscreen(true)}>Fullscreen</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="p-4 w-full">
                    <Card className="gap-0 mb-4">
                        <CardHeader>
                            <CardTitle>{circleOnly ? "Circle" : "Shape"} Stats</CardTitle>
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
                        <InteractiveShapeGroups
                            ref={svgRef}
                            options={shapeOptions}
                            theme={theme}
                            checks={shapeMap}
                            setChecks={setChecks}
                        />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
