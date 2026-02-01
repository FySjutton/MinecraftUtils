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
    getShapeOptions, generators, shapeModes
} from "./ShapeGenerator";
import {InteractiveShapeGroups} from "./ShapeSvg";

import { ShapeInputs } from "./ShapeInputs";
import {
    enumParser,
    objectParser,
    useUrlUpdateEmitter
} from "@/lib/urlParsers";
import {useQueryState} from "nuqs";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";
import {checksParser} from "@/app/generators/shape-generator/urlCheckParser";

export default function ShapeGeneratorPage({ circleOnly }: { circleOnly: boolean }) {
    useUrlUpdateEmitter()

    const shapeParser = useMemo(() => enumParser(shapes).withDefault(circleOnly ? "Circle" : "Hexagon"), [circleOnly]);
    const [shape, setShape] = useQueryState("shape", shapeParser);
    const svgRef = useRef<SVGSVGElement>(null);

    const defaults = createDefaults(shape);
    const optionsParser = useMemo(() => objectParser<ShapeOptions>({
        shape: { type: enumParser(shapes), default: defaults.shape },
        mode: { type: enumParser(shapeModes), default: defaults.mode },
        rotation: { type: "number", default: defaults.rotation },
        thickness: { type: "number", default: defaults.thickness },
        width: { type: "number", default: defaults.width },
        height: { type: "number", default: defaults.height },

        // Circle-specific
        lockRatio: { type: "bool", default: defaults.lockRatio },

        // Polygon-specific
        sides: { type: "number", default: defaults.sides },

        // Quadrilateral-specific
        topWidth: { type: "number", default: defaults.topWidth },
        bottomWidth: { type: "number", default: defaults.bottomWidth },
        skew: { type: "number", default: defaults.skew },
    }).withDefault(getShapeOptions(circleOnly ? "Circle" : "Hexagon")), [circleOnly, defaults]);
    const [options, setOptions] = useQueryState("options", optionsParser);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState<ThemeName>(defaultTheme);

    const { width, height } = useMemo(() => generators[options.shape].getSize(options), [options]);
    const checkParser = useMemo(() => checksParser(width, height).withDefault([]), [height, width]);
    const [checks, setChecks] = useQueryState("checks", checkParser);

    const shapeMap = useMemo(() => {
        const newMap = new Map<string, boolean>();
        const checksSet = new Set(checks);

        const { width, height } = options;

        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cx = x - centerX;
                const cy = y - centerY;

                if (isShapeFilled(cx, cy, shape, options)) {
                    const key = `${cx},${cy}`;
                    newMap.set(key, checksSet.has(key));
                }
            }
        }

        return newMap;
    }, [checks, options, shape]);

    const reset = () => {
        setOptions(createDefaults(shape));
        setShape(circleOnly ? "Circle" : "Hexagon");
        setChecks([]);
    };

    const setShapeAction = (shape: Shape) => {
        setOptions(getShapeOptions(shape));
        setShape(shape);
    };

    const totalSlots = shapeMap.size;
    const checkedSlots = checks.length

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
                                    let sides = "";
                                    if (isPolygon(item)) {
                                        sides = getPolygon(item).sides.toString();
                                    } else if (item === "Polygon") {
                                        sides = "n"
                                    } else if (item == "Quadrilateral") {
                                        sides = "4"
                                    }
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

            <Card>
                <CardHeader>
                    <CardTitle>Copy current shape and progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <CopyShareLinkInput label="" />
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
                    <ZoomViewport cellWidth={generators[shape].getSize(options).width} cellHeight={generators[shape].getSize(options).height} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen}>
                        <InteractiveShapeGroups ref={svgRef} options={options} theme={theme} checks={checks} setChecks={setChecks} shape={shape} />
                    </ZoomViewport>
                </CardContent>
            </Card>
        </div>
    );
}
