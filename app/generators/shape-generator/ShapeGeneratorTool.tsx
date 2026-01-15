"use client";

import React, { useState, useMemo, useRef } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZoomViewport } from "@/app/generators/shape-generator/ZoomViewport";
import { ComboBox } from "@/components/ComboBox";
import { defaultTheme, ThemeName, themeNames } from "@/app/generators/shape-generator/styling/themes";
import { ExportCard } from "@/app/generators/shape-generator/ExportCard";

import {
    shapes,
    Shape,
    isPolygon,
    getPolygon,
    isShapeFilled,
    ShapeOptions,
    createDefaults,
    getShapeOptions
} from "./ShapeGenerator";
import { InteractiveShapeGroups } from "./ShapeSvg";

import { ShapeInputs } from "./ShapeInputs";

export default function ShapeGeneratorPage({ circleOnly }: { circleOnly: boolean }) {
    const [shape, setShape] = useState<Shape>(circleOnly ? "Circle" : "Hexagon");
    const [checks, setChecks] = useState<Map<string, boolean>>(new Map());
    const svgRef = useRef<SVGSVGElement>(null);

    const [options, setOptions] = useState<ShapeOptions>(getShapeOptions(circleOnly ? "Circle" : "Hexagon"));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState<ThemeName>(defaultTheme);

    const shapeMap = useMemo(() => {
        const newMap = new Map<string, boolean>();
        const oldChecks = new Map(checks);

        const width = options.width;
        const height = options.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isShapeFilled(x, y, shape, options)) {
                    const key = `${x},${y}`;
                    newMap.set(key, oldChecks.get(key) ?? false);
                }
            }
        }
        return newMap;
    }, [checks, options, shape]);

    const reset = () => {
        setOptions(createDefaults(shape));
        setShape(circleOnly ? "Circle" : "Hexagon");
        setChecks(new Map());
    };

    const setShapeAction = (shape: Shape) => {
        setOptions(getShapeOptions(shape));
        setShape(shape);
    };

    const totalSlots = shapeMap.size;
    const checkedSlots = Array.from(shapeMap.values()).filter(v => v).length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{circleOnly ? "Circle / Ellipse" : "Shape"} Generator</CardTitle>
                    <CardAction><Button variant="outline" onClick={reset}>Reset</Button></CardAction>
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
                                renderItem={item => {
                                    const sides = isPolygon(item) ? getPolygon(item).sides : (item === "Polygon" ? "n" : "");
                                    return <div>{sides && <p className="text-gray-400">{sides} sides</p>}</div>;
                                }}
                            />
                        </div>
                    )}

                    <ShapeInputs
                        shape={shape}
                        options={options}
                        setOptionsAction={setOptions}
                    />

                    <div>
                        <Label>Theme</Label>
                        <ComboBox
                            items={themeNames}
                            value={theme}
                            onChange={setTheme}
                            placeholder="Select theme"
                            placeholderSearch="Search theme..."
                            className="mt-2"
                        />
                    </div>

                    <ExportCard shapeMap={shapeMap} width={options.width} height={options.height} circleOnly={circleOnly} svgRef={svgRef} />
                </CardContent>
            </Card>

            <Card className="gap-0 pb-0">
                <CardHeader>
                    <CardTitle>{circleOnly ? "Circle" : "Shape"} Output</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={() => {setIsFullscreen(true)}}>Fullscreen</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="p-4 w-full">
                    <Card className="gap-0 mb-4">
                        <CardHeader>
                            <CardTitle>{circleOnly ? "Circle" : "Shape"} Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p><span className="font-bold">Blocks:</span> {totalSlots}</p>
                            <p><span className="font-bold">Progress:</span> {checkedSlots} / {totalSlots}</p>
                        </CardContent>
                    </Card>
                    <ZoomViewport cellWidth={options.width} cellHeight={options.height} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen}>
                        <InteractiveShapeGroups ref={svgRef} options={options} theme={theme} checks={shapeMap} setChecks={setChecks} shape={shape} />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
