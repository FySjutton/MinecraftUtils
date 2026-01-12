"use client";

import React, { useState, useMemo, useRef } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZoomViewport } from "@/app/generators/shape-generator/ZoomViewport";
import { ComboBox } from "@/components/ComboBox";
import { defaultTheme, ThemeName, themeNames } from "@/app/generators/shape-generator/styling/themes";
import { ExportCard } from "@/app/generators/shape-generator/ExportCard";

import { shapes, Shape, isPolygon, getPolygon, isShapeFilled } from "./ShapeGenerator";
import { InteractiveShapeGroups } from "./ShapeSvg";

import { ShapeInputs } from "./ShapeInputs";
import { CircleOptions, PolygonOptions } from "@/app/generators/shape-generator/generators/ShapeGeneratorTypes";

export default function ShapeGeneratorPage({ circleOnly }: { circleOnly: boolean }) {
    const [shape, setShape] = useState<Shape>(circleOnly ? "Circle" : "Hexagon");
    const [checks, setChecks] = useState<Map<string, boolean>>(new Map());
    const svgRef = useRef<SVGSVGElement>(null);

    const [circleOptions, setCircleOptions] = useState<CircleOptions>({
        width: 15,
        height: 15,
        mode: "thick",
        rotation: 0,
        thickness: 1,
        lockRatio: true,
    });

    const [polygonOptions, setPolygonOptions] = useState<PolygonOptions>({
        size: 45,
        sides: 6,
        mode: "thick",
        rotation: 0,
        thickness: 1,
    });

    const [theme, setTheme] = useState<ThemeName>(defaultTheme);

    const currentOptions = useMemo(() => {
        if (shape === "Circle") return circleOptions;
        return polygonOptions;
    }, [shape, circleOptions, polygonOptions]);

    const shapeMap = useMemo(() => {
        const newMap = new Map<string, boolean>();
        const oldChecks = new Map(checks);

        const width = shape === "Circle" ? circleOptions.width : polygonOptions.size;
        const height = shape === "Circle" ? circleOptions.height : polygonOptions.size;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (isShapeFilled(x, y, shape, currentOptions)) {
                    const key = `${x},${y}`;
                    newMap.set(key, oldChecks.get(key) ?? false);
                }
            }
        }
        return newMap;
    }, [checks, currentOptions, shape, circleOptions, polygonOptions]);

    const reset = () => {
        setCircleOptions({
            width: 15,
            height: 15,
            mode: "thick",
            rotation: 0,
            thickness: 1,
            lockRatio: true,
        });
        setPolygonOptions({
            size: 45,
            sides: 6,
            mode: "thick",
            rotation: 0,
            thickness: 1,
        });
        setChecks(new Map());
    };

    const setShapeAction = (newShape: Shape) => {
        setShape(newShape);
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
                        circleOnly={circleOnly}
                        circleOptions={circleOptions}
                        setCircleOptionsAction={setCircleOptions}
                        polygonOptions={polygonOptions}
                        setPolygonOptionsAction={setPolygonOptions}
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

                    <ExportCard shapeMap={shapeMap} width={circleOptions.width} height={circleOptions.height} circleOnly={circleOnly} svgRef={svgRef} />
                </CardContent>
            </Card>

            <Card className="gap-0 pb-0">
                <CardHeader>
                    <CardTitle>{circleOnly ? "Circle" : "Shape"} Output</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={() => {}}>Fullscreen</Button>
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
                    <ZoomViewport cellWidth={circleOptions.width} cellHeight={circleOptions.height} isFullscreen={false} setIsFullscreen={() => {}}>
                        <InteractiveShapeGroups ref={svgRef} options={currentOptions} theme={theme} checks={shapeMap} setChecks={setChecks} />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
