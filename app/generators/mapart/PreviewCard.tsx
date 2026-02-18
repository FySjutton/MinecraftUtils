"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProcessingStats, BlockSelection, ALIASES } from "./utils/utils";
import { findImageAsset } from "@/lib/images/getImageAsset";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TILE = 16;

interface Props {
    isProcessing: boolean;
    processedImageData: ImageData | null;
    processingStats: ProcessingStats | null;
    groupIdMap: number[][] | null;
    blockSelection: BlockSelection;
}

export function PreviewCard({ isProcessing, processedImageData, processingStats, groupIdMap, blockSelection }: Props) {
    const [textureMode, setTextureMode] = useState<"preview" | "textures">("preview");
    const [isFullscreen, setIsFullscreen] = useState(false);

    const cardViewportRef = useRef<HTMLDivElement>(null);
    const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);

    const fsViewportRef = useRef<HTMLDivElement>(null);
    const [fsSize, setFsSize] = useState<{ w: number; h: number } | null>(null);

    const textureCanvasRef = useRef<HTMLCanvasElement>(null);
    const fsTextureCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());

    const isPreview = textureMode === "preview";

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

    const drawTextures = (canvas: HTMLCanvasElement) => {
        if (!groupIdMap || !processingStats) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { width, height } = processingStats;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const needed = new Map<number, string>();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const gId = groupIdMap[y][x];
                if (needed.has(gId) || imgCacheRef.current.has(gId)) continue;
                const blockName = blockSelection[gId] as string | undefined;
                if (!blockName) continue;
                const aliased = blockName in ALIASES ? ALIASES[blockName] : blockName;
                needed.set(gId, findImageAsset(`2d_${aliased}`, "block") as string);
            }
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

    // Card texture canvas — redraws when mode/data changes
    useEffect(() => {
        if (isPreview || !textureCanvasRef.current) return;
        drawTextures(textureCanvasRef.current);
    }, [textureMode, groupIdMap, blockSelection, processingStats]);

    // Fullscreen texture canvas — callback ref draws immediately on mount,
    // and this effect redraws when data/mode changes while fullscreen is open
    useEffect(() => {
        if (!isFullscreen || isPreview || !fsTextureCanvasRef.current) return;
        drawTextures(fsTextureCanvasRef.current);
    }, [isFullscreen, textureMode, groupIdMap, blockSelection, processingStats]);

    // Callback ref for the fullscreen texture canvas: fires when the portal canvas mounts
    const fsMountRef = (el: HTMLCanvasElement | null) => {
        (fsTextureCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
        if (el && !isPreview) drawTextures(el);
    };

    const canvasW = processingStats ? (!isPreview ? processingStats.width * TILE  : processingStats.width)  : 1;
    const canvasH = processingStats ? (!isPreview ? processingStats.height * TILE : processingStats.height) : 1;

    const fitScale = (availW: number, availH: number) => Math.min(availW / canvasW, availH / canvasH);
    const cardScale = cardSize ? fitScale(cardSize.w, cardSize.h) : null;
    const fsScale   = fsSize   ? fitScale(fsSize.w,   fsSize.h)   : null;

    const cardCanvas = !isPreview
        ? <canvas ref={textureCanvasRef} width={canvasW} height={canvasH} style={{ imageRendering: "pixelated", display: "block" }} />
        : <canvas width={canvasW} height={canvasH} style={{ imageRendering: "pixelated", display: "block" }} ref={(el) => { if (el && processedImageData) el.getContext("2d")?.putImageData(processedImageData, 0, 0); }} />;

    const fsCanvas = !isPreview
        ? <canvas ref={fsMountRef} width={canvasW} height={canvasH} style={{ imageRendering: "pixelated", display: "block" }} />
        : <canvas width={canvasW} height={canvasH} style={{ imageRendering: "pixelated", display: "block" }} ref={(el) => { if (el && processedImageData) el.getContext("2d")?.putImageData(processedImageData, 0, 0); }} />;

    const modeToggle = (
        <Tabs value={textureMode} onValueChange={v => setTextureMode(v as "preview" | "textures")} className="w-full h-auto">
            <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="textures">Textures</TabsTrigger>
            </TabsList>
        </Tabs>
    );

    return (
        <>
            <Card id="preview" className="pb-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Preview
                        {isProcessing && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
                    </CardTitle>
                    {processingStats && !isProcessing && (
                        <CardAction className="flex items-center gap-2">
                            {modeToggle}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(true)}>
                                <Maximize2 size={15} />
                            </Button>
                        </CardAction>
                    )}
                </CardHeader>
                <CardContent className="w-full p-0 m-0">
                    <div className="aspect-square p-2 relative">
                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60 rounded-md">
                                <Loader2 className="animate-spin text-muted-foreground" size={32} />
                            </div>
                        )}
                        <div ref={cardViewportRef} className="w-full h-full">
                            {processingStats && cardScale !== null && (
                                <TransformWrapper key={`card-${canvasW}x${canvasH}-${cardScale}`} initialScale={cardScale} minScale={cardScale} maxScale={cardScale * 50} centerOnInit limitToBounds wheel={{ step: 0.15 }} smooth={false} panning={{ velocityDisabled: true }} zoomAnimation={{ disabled: true }}>
                                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                        {cardCanvas}
                                    </TransformComponent>
                                </TransformWrapper>
                            )}
                        </div>
                    </div>
                    {processingStats ? (
                        <div className="px-5 py-3">
                            <div className="flex justify-between text-sm"><span>Dimensions:</span><span className="font-mono">{processingStats.width} × {processingStats.height}</span></div>
                            <div className="flex justify-between text-sm"><span>Total Blocks:</span><span className="font-mono">{processingStats.totalBlocks.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm"><span>Unique Colors:</span><span className="font-mono">{processingStats.uniqueBlocks}</span></div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-xs px-5 py-3">Processing…</p>
                    )}
                </CardContent>
            </Card>

            {isFullscreen && processingStats && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
                    <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
                        <span className="font-semibold text-sm">Preview — Fullscreen</span>
                        <div className="flex items-center gap-2">
                            {modeToggle}
                            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                                Close <kbd className="ml-1 text-xs opacity-50">Esc</kbd>
                            </Button>
                        </div>
                    </div>
                    <div ref={fsViewportRef} className="flex-1 overflow-hidden p-4">
                        {fsScale !== null && (
                            <TransformWrapper key={`fs-${canvasW}x${canvasH}-${fsScale}`} initialScale={fsScale} minScale={fsScale} maxScale={fsScale * 50} centerOnInit limitToBounds wheel={{ step: 0.15 }} smooth={false} panning={{ velocityDisabled: true }} zoomAnimation={{ disabled: true }}>
                                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                    {fsCanvas}
                                </TransformComponent>
                            </TransformWrapper>
                        )}
                    </div>
                    <div className="px-5 py-2 border-t text-xs text-muted-foreground flex gap-6 shrink-0">
                        <span>{processingStats.width} × {processingStats.height} px</span>
                        <span>{processingStats.totalBlocks.toLocaleString()} blocks</span>
                        <span>{processingStats.uniqueBlocks} unique colors</span>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}