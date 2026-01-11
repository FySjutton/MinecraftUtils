"use client";

import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

const CELL = 14;
const GAP = 2;
const CELL_TOTAL = CELL + GAP;
const MAX_CELL_PX = 25;

interface Props {
    children: React.ReactNode;
    cellWidth: number;
    cellHeight: number;
    isFullscreen: boolean;
    setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ZoomViewport({ children, cellWidth, cellHeight, isFullscreen, setIsFullscreen }: Props) {
    const outerRef = useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = useState<number | null>(null);

    const getAvailableWidth = () => {
        if (outerRef.current) return outerRef.current.getBoundingClientRect().width;
        return null;
    };

    useLayoutEffect(() => {
        const update = () => {
            const w = getAvailableWidth();
            if (w && w > 0) setAvailableWidth(w);
        };

        update();

        const observer = new ResizeObserver(update);
        if (outerRef.current) observer.observe(outerRef.current);

        window.addEventListener("resize", update);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, []);

    const canvasW = cellWidth * CELL_TOTAL - GAP;
    const canvasH = cellHeight * CELL_TOTAL - GAP;

    const maxBaseScale = MAX_CELL_PX / CELL;

    const fitScale = useMemo(() => {
        if (!availableWidth) return null;
        return Math.min(availableWidth / canvasW, availableWidth / canvasH);
    }, [availableWidth, canvasW, canvasH]);

    if (!fitScale) {
        return <div ref={outerRef} className="w-full overflow-hidden" />;
    }

    const scale = Math.min(fitScale, maxBaseScale);

    const effectiveWrapperWidth =
        fitScale > maxBaseScale
            ? canvasW * maxBaseScale
            : availableWidth;

    const wrapperHeight = canvasH * scale;

    const content = (
        <div style={{ width: `${effectiveWrapperWidth}px`, height: `${wrapperHeight}px` }} className="max-w-full mx-auto my-2">
            <TransformWrapper
                key={`${cellWidth}x${cellHeight}x${effectiveWrapperWidth}x${scale}`}
                initialScale={scale}
                minScale={scale}
                maxScale={scale * 50}
                centerOnInit
                limitToBounds
                wheel={{ step: 0.15 }}
                smooth={false}
                panning={{ velocityDisabled: true }}
                zoomAnimation={{ disabled: true }}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div style={{ width: canvasW, height: canvasH }}>
                        {children}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );

    const FullscreenOverlay = () => {
        const fullscreenRef = useRef<HTMLDivElement>(null);
        const [fsWidth, setFsWidth] = useState<number>(0);
        const [fsHeight, setFsHeight] = useState<number>(0);

        useEffect(() => {
            if (!isFullscreen) return;

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setIsFullscreen(false);
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
            };
        }, []);
        
        useLayoutEffect(() => {
            const update = () => {
                if (fullscreenRef.current) {
                    const rect = fullscreenRef.current.getBoundingClientRect();
                    setFsWidth(rect.width - 16);
                    setFsHeight(rect.height - 16);
                }
            };
            update();
            window.addEventListener("resize", update);
            return () => window.removeEventListener("resize", update);
        }, []);

        const fsScale = fsWidth && fsHeight ? Math.min(fsWidth / canvasW, fsHeight / canvasH) : 1;

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black/50 p-4">
                <Card className="w-full h-full max-w-[none] max-h-[none] flex flex-col">
                    <CardHeader>
                        <CardTitle>Fullscreen Mode</CardTitle>
                        <CardAction>
                            <Button variant="outline" onClick={() => setIsFullscreen(false)}>Close</Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent
                        ref={fullscreenRef}
                        className="flex-1 flex justify-center items-center overflow-hidden"
                    >
                        <div style={{ width: fsWidth, height: fsHeight }}>
                            <TransformWrapper
                                key={`fullscreen-${canvasW}x${canvasH}x${fsScale}`}
                                initialScale={fsScale}
                                minScale={fsScale}
                                maxScale={fsScale * 50}
                                centerOnInit
                                limitToBounds
                                wheel={{ step: 0.15 }}
                                smooth={false}
                                panning={{ velocityDisabled: true }}
                                zoomAnimation={{ disabled: true }}
                            >
                                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                    <div style={{ width: canvasW, height: canvasH }}>{children}</div>
                                </TransformComponent>
                            </TransformWrapper>
                        </div>
                    </CardContent>
                </Card>
            </div>,
            document.body
        );
    };

    return (
        <div ref={outerRef} className="w-full overflow-hidden relative border">
            {content}
            {isFullscreen && <FullscreenOverlay />}
        </div>
    );
}
