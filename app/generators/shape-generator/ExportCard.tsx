"use client";

import React, {useState, RefObject, useEffect} from "react";
import {Card, CardHeader, CardTitle, CardContent, CardAction, CardDescription} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { download2DSchematic } from "@/lib/schematics/schematic2d";
import {ComboBox} from "@/components/ComboBox";
import {createPortal} from "react-dom";

interface ExportCardProps {
    shapeMap: Map<string, boolean>;
    width: number;
    height: number;
    circleOnly: boolean;
    svgRef: RefObject<SVGSVGElement | null>;
}

export const exports: string[] = ["Schematic", "PNG", "SVG"];
export type ExportType = (typeof exports)[number];

export function ExportCard({ shapeMap, width, height, circleOnly, svgRef }: ExportCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exportType, setExportType] = useState<ExportType>(exports[0]);
    const [blockName, setBlockName] = useState("minecraft:stone");
    const [pngScaleName, setPngScaleName] = useState("Medium");
    const [pngScale, setPngScale] = useState(20);

    const openPopup = () => {
        setIsOpen(true);
        setPngScale(20)
        setPngScaleName("Medium");
        setExportType(exports[0]);
        setBlockName("minecraft:stone");
    }

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleExport = async () => {
        if (exportType === "Schematic") {
            const grid: boolean[][] = [];

            const xOffset = Math.floor(width / 2);
            const yOffset = Math.floor(height / 2);

            for (let y = 0; y < height; y++) {
                const row: boolean[] = [];
                for (let x = 0; x < width; x++) {
                    const cx = x - xOffset;
                    const cy = y - yOffset;

                    const key = `${cx},${cy}`;
                    row.push(shapeMap.has(key));
                }
                grid.push(row);
            }

            download2DSchematic(
                grid,
                circleOnly ? "minecraftutils_circle.schem" : "minecraftutils_shape.schem",
                blockName
            );
        }


        if ((exportType === "PNG" || exportType === "SVG") && svgRef.current) {
            const svgElement = svgRef.current;
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            if (exportType === "SVG") {
                const blob = new Blob([svgString], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = circleOnly ? "minecraftutils_circle.svg" : "minecraftutils_shape.svg";
                link.click();
                URL.revokeObjectURL(url);
            }

            if (exportType === "PNG") {
                const canvas = document.createElement("canvas");
                const size = Math.max(width, height)
                setPngScale(Math.floor(pngScaleName == "Low" ? Math.min(20, 500 / size) : (pngScaleName == "Medium" ? Math.min(45, 1000 / size) : Math.min(70, 2500 / size))));
                canvas.width = width * pngScale;
                canvas.height = height * pngScale;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const img = new Image();
                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);

                    const link = document.createElement("a");
                    link.download = circleOnly ? "minecraftutils_circle.png" : "minecraftutils_shape.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                };
                img.src = url;
            }
        }

        setIsOpen(false);
    };

    return (
        <div className="w-full flex justify-center mt-8">
            <Button variant="outline" onClick={() => openPopup()} className="w-full max-w-[500]">
                Export
            </Button>

            {isOpen && (
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 w-full h-full backdrop-blur">
                        <Card className="min-w-96 relative max-[420]:w-full max-[420]:min-w-0 mx-4">
                            <CardHeader>
                                <CardTitle className="">Export Options</CardTitle>
                                <CardDescription className="">Select export type, and click download to start the download.</CardDescription>
                                <CardAction className="flex justify-between mt-2 ml-4">
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                                </CardAction>
                            </CardHeader>

                            <CardContent>
                                {/* Export type dropdown */}
                                <div className="flex flex-col space-y-2">
                                    <label className="font-semibold">Export Type</label>
                                    <ComboBox
                                        items={exports}
                                        value={exportType}
                                        onChange={(value) => setExportType(value as ExportType)}
                                        placeholder="Select export type"
                                        renderItem={item => (<p>{item == "Schematic" ? ".schem" : (item == "PNG" ? ".png" : ".svg")}</p>)}
                                    />
                                </div>

                                {/* Schematic block size input */}
                                {exportType === "Schematic" && (
                                    <div className="flex flex-col space-y-2">
                                        <label className="font-semibold mt-4">Block Type</label>
                                        <Input
                                            value={blockName}
                                            onChange={(e) => {
                                                setBlockName(e.target.value);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* PNG scale input */}
                                {exportType === "PNG" && (
                                    <div className="flex flex-col space-y-2">
                                        <label className="font-semibold mt-4">PNG Resolution</label>
                                        <ComboBox
                                            items={["Low", "Medium", "High"]}
                                            value={pngScaleName}
                                            onChange={(value) => {
                                                setPngScaleName(value as string);
                                                const size = Math.max(width, height)
                                                const factor = Math.floor(value == "Low" ? Math.min(20, 500 / size) : (value == "Medium" ? Math.min(45, 1000 / size) : Math.min(70, 2500 / size)))
                                                setPngScale(factor)
                                            }}
                                            renderItem={item => {
                                                const size = Math.max(width, height)
                                                const factor = Math.floor(item == "Low" ? Math.min(20, 500 / size) : (item == "Medium" ? Math.min(45, 1000 / size) : Math.min(70, 2500 / size)))
                                                return <p>{width * factor}x{factor * height}</p>;
                                            }}
                                            placeholder="Select png size"
                                        />
                                    </div>
                                )}
                                <Button onClick={handleExport} className="mt-4 w-full">Download</Button>
                            </CardContent>
                        </Card>
                    </div>,
                    document.body
                )
            )}
        </div>
    );
}
