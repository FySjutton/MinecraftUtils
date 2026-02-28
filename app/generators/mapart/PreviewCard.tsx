"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Card, CardContent, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findImageAsset } from "@/lib/images/getImageAsset";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompareSlider, CompareSliderBefore, CompareSliderAfter, CompareSliderHandle } from "@/components/ui/compare-slider";
import {BlockSelection, ProcessingStats} from "@/app/generators/mapart/utils/types";
import {ALIASES} from "@/app/generators/mapart/utils/constants";

const TILE = 16;
type Mode = "preview" | "textures" | "compare";

interface Props {
    isProcessing: boolean;
    processedImageData: ImageData | null;
    processingStats: ProcessingStats | null;
    groupIdMap: number[][] | null;
    blockSelection: BlockSelection;
    sourceImage: string | null;
    originalImage: string | null;
    outputMode: string;
    noobLine: boolean;
    totalBlocks: number;
}

export function PreviewCard({ isProcessing, processedImageData, processingStats, groupIdMap, blockSelection, sourceImage, originalImage, outputMode, noobLine, totalBlocks }: Props) {
    const [mode, setMode] = useState<Mode>("preview");
    const [isFullscreen, setIsFullscreen] = useState(false);

    const cardViewportRef = useRef<HTMLDivElement>(null);
    const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);

    const fsViewportRef = useRef<HTMLDivElement>(null);
    const [fsSize, setFsSize] = useState<{ w: number; h: number } | null>(null);

    const textureCanvasRef = useRef<HTMLCanvasElement>(null);
    const fsTextureCanvasRef = useRef<HTMLCanvasElement>(null);
    const compareCanvasRef = useRef<HTMLCanvasElement>(null);
    const fsCompareCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());

    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const fsPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

    const isTextures = mode === "textures";
    const isCompare = mode === "compare";

    const displayHeight = processingStats ? processingStats.height + (outputMode === "buildable" && noobLine ? 1 : 0) : 0;

    useLayoutEffect(() => {
        if (!cardViewportRef.current) return;
        const obs = new ResizeObserver(() => {
            const r = cardViewportRef.current!.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) setCardSize({ w: r.width, h: r.height });
        });
        obs.observe(cardViewportRef.current);
        return () => obs.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (!isFullscreen) return;
        const update = () => {
            if (!fsViewportRef.current) return;
            const r = fsViewportRef.current.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) setFsSize({ w: r.width, h: r.height });
        };
        update();
        const obs = new ResizeObserver(update);
        if (fsViewportRef.current) obs.observe(fsViewportRef.current);
        return () => obs.disconnect();
    }, [isFullscreen]);

    useEffect(() => {
        if (!isFullscreen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isFullscreen]);

    useEffect(() => {
        if (!processedImageData || isTextures || isCompare) return;
        if (previewCanvasRef.current) {
            previewCanvasRef.current.getContext("2d")?.putImageData(processedImageData, 0, 0);
        }
        if (isFullscreen && fsPreviewCanvasRef.current) {
            fsPreviewCanvasRef.current.getContext("2d")?.putImageData(processedImageData, 0, 0);
        }
    }, [processedImageData, isTextures, isCompare, isFullscreen]);

    const drawTextures = (canvas: HTMLCanvasElement) => {
        if (!groupIdMap || !processingStats) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { width, height } = processingStats;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const needed = new Map<number, string>();
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++) {
                const gId = groupIdMap[y][x];
                if (needed.has(gId) || imgCacheRef.current.has(gId)) continue;
                const blockName = blockSelection[gId] as string | undefined;
                if (!blockName) continue;
                const aliased = blockName in ALIASES ? ALIASES[blockName] : blockName;
                needed.set(gId, findImageAsset(`2d_${aliased}`, "block") as string);
            }

        const draw = () => {
            ctx.imageSmoothingEnabled = false;
            for (let y = 0; y < height; y++)
                for (let x = 0; x < width; x++) {
                    const img = imgCacheRef.current.get(groupIdMap[y][x]);
                    if (img) ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE);
                }
        };

        const toFetch = [...needed.entries()];
        if (toFetch.length === 0) { draw(); return; }
        let remaining = toFetch.length;
        for (const [gId, src] of toFetch) {
            const img = new Image();
            img.onload = img.onerror = () => { if (--remaining === 0) draw(); };
            img.src = src;
            imgCacheRef.current.set(gId, img);
        }
    };

    useEffect(() => {
        if (!isTextures || !textureCanvasRef.current) return;
        drawTextures(textureCanvasRef.current);
    }, [mode, groupIdMap, blockSelection, processingStats]);

    useEffect(() => {
        if (!isFullscreen || !isTextures || !fsTextureCanvasRef.current) return;
        drawTextures(fsTextureCanvasRef.current);
    }, [isFullscreen, mode, groupIdMap, blockSelection, processingStats]);

    const fsMountRef = (el: HTMLCanvasElement | null) => {
        (fsTextureCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
        if (el && isTextures) drawTextures(el);
    };

    const drawCompareAfter = (canvas: HTMLCanvasElement) => {
        if (!processedImageData) return;
        canvas.getContext("2d")?.putImageData(processedImageData, 0, 0);
    };

    useEffect(() => {
        if (!isCompare || !compareCanvasRef.current) return;
        drawCompareAfter(compareCanvasRef.current);
    }, [mode, processedImageData]);

    useEffect(() => {
        if (!isFullscreen || !isCompare || !fsCompareCanvasRef.current) return;
        drawCompareAfter(fsCompareCanvasRef.current);
    }, [isFullscreen, mode, processedImageData]);

    const fsCompareMountRef = (el: HTMLCanvasElement | null) => {
        (fsCompareCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
        if (el && isCompare) drawCompareAfter(el);
    };

    const canvasW = processingStats ? processingStats.width * TILE : 1;
    const canvasH = processingStats ? processingStats.height * TILE : 1;
    const flatW = processingStats ? processingStats.width : 1;
    const flatH = processingStats ? processingStats.height : 1;

    const activeW = isTextures ? canvasW : flatW;
    const activeH = isTextures ? canvasH : flatH;

    const fitScale = (availW: number, availH: number) => Math.min(availW / activeW, availH / activeH);
    const cardScale = cardSize ? fitScale(cardSize.w, cardSize.h) : null;
    const fsScale = fsSize ? fitScale(fsSize.w, fsSize.h) : null;

    const renderCompare = (cmpRef: (el: HTMLCanvasElement | null) => void) => (
        <div className="size-full flex items-center justify-center">
            <CompareSlider
                defaultValue={50}
                style={{
                    height: "100%",
                    width: "auto",
                    maxWidth: "100%",
                    aspectRatio: `${flatW} / ${flatH}`,
                }}
            >
                <CompareSliderBefore>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={originalImage ?? ""}
                        alt="Original"
                        className="size-full"
                        style={{ imageRendering: "pixelated" }}
                    />
                </CompareSliderBefore>
                <CompareSliderAfter>
                    <canvas
                        ref={cmpRef}
                        width={flatW}
                        height={flatH}
                        className="size-full"
                        style={{ imageRendering: "pixelated", display: "block" }}
                    />
                </CompareSliderAfter>
                <CompareSliderHandle />
            </CompareSlider>
        </div>
    );

    const renderZoomable = (
        texRef: (el: HTMLCanvasElement | null) => void,
        scale: number,
        previewRef: React.RefObject<HTMLCanvasElement | null>,
    ) => (
        <TransformWrapper
            key={`${mode}-${activeW}x${activeH}-${scale}`}
            initialScale={scale}
            minScale={scale}
            maxScale={scale * 50}
            centerOnInit
            limitToBounds
            wheel={{ step: scale * 0.8 }}
            smooth={false}
            panning={{ velocityDisabled: true }}
            zoomAnimation={{ disabled: true }}
        >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                {isTextures ? (
                    <canvas
                        ref={texRef}
                        width={canvasW}
                        height={canvasH}
                        style={{ imageRendering: "pixelated", display: "block" }}
                    />
                ) : (
                    <canvas
                        width={flatW}
                        height={flatH}
                        style={{ imageRendering: "pixelated", display: "block" }}
                        ref={(el) => {
                            (previewRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
                            if (el && processedImageData) el.getContext("2d")?.putImageData(processedImageData, 0, 0);
                        }}
                    />
                )}
            </TransformComponent>
        </TransformWrapper>
    );

    const modeToggle = (
        <Tabs value={mode} onValueChange={v => setMode(v as Mode)} className="h-auto">
            <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="textures">Textures</TabsTrigger>
                {originalImage && <TabsTrigger value="compare">Compare</TabsTrigger>}
            </TabsList>
        </Tabs>
    );

    return (
        <>
            <Card id="preview" className="pb-0">
                <CardContent className="w-full p-0 m-0">
                    <div className="flex flex-wrap mx-6">
                        <CardTitle className="flex items-center gap-2 pb-2 mr-auto">
                            Preview
                            {isProcessing && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
                        </CardTitle>
                        {processingStats && !isProcessing && (
                            <CardAction className="flex items-center gap-2">
                                {modeToggle}
                                <Button variant="outline" onClick={() => setIsFullscreen(true)}><Maximize2 size={15} /></Button>
                            </CardAction>
                        )}
                    </div>
                    <div className="aspect-square p-2 relative">
                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60 rounded-md">
                                <Loader2 className="animate-spin text-muted-foreground" size={32} />
                            </div>
                        )}
                        <div ref={cardViewportRef} className="w-full h-full">
                            {processingStats && (
                                isCompare
                                    ? renderCompare((el) => {
                                        (compareCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
                                        if (el) drawCompareAfter(el);
                                    })
                                    : cardScale !== null && renderZoomable(
                                    (el) => {
                                        (textureCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
                                        if (el && isTextures) drawTextures(el);
                                    },
                                    cardScale,
                                    previewCanvasRef,
                                )
                            )}
                        </div>
                    </div>
                    {processingStats ? (
                        <div className="px-5 py-3">
                            <div className="flex justify-between text-sm"><span>Dimensions:</span><span className="font-mono">{processingStats.width} × {displayHeight}</span></div>
                            <div className="flex justify-between text-sm"><span>Total Blocks:</span><span className="font-mono">{totalBlocks.toLocaleString()}</span></div>
                            {outputMode == "buildable" && <div className="flex justify-between text-sm"><span>Unique Colors:</span><span className="font-mono">{processingStats.uniqueBlocks}</span></div>}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-xs px-5 py-3">Processing…</p>
                    )}
                </CardContent>
            </Card>

            {isFullscreen && processingStats && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
                    <div className="flex flex-wrap items-center justify-between px-4 py-2 gap-x-4 gap-y-1 pt-4 border-b shrink-0">
                        <span className="font-semibold text-sm">Fullscreen Mapart Preview</span>
                        <div className="flex flex-wrap justify-center gap-2">
                            {modeToggle}
                            <Button variant="outline" onClick={() => setIsFullscreen(false)}>Close</Button>
                        </div>
                    </div>
                    <div ref={fsViewportRef} className="flex-1 overflow-hidden p-4">
                        {isCompare ? renderCompare(fsCompareMountRef) : fsScale !== null && renderZoomable(fsMountRef, fsScale, fsPreviewCanvasRef)}
                    </div>
                    <div className="px-5 py-2 border-t text-xs text-muted-foreground flex gap-6 shrink-0">
                        <span>{processingStats.width} × {displayHeight} px</span>
                        <span>{totalBlocks.toLocaleString()} blocks</span>
                        {outputMode == "buildable" && <span>{processingStats.uniqueBlocks} unique colors</span>}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}