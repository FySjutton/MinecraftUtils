"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

const CELL = 14;
const GAP = 2;
const CELL_TOTAL = CELL + GAP;
const MAX_CELL_PX = 25;

interface Props {
    children: React.ReactNode;
    cellWidth: number;
    cellHeight: number;
}

export function ZoomViewport({ children, cellWidth, cellHeight }: Props) {
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

    return (
        <div ref={outerRef} className="w-full overflow-hidden relative border border-stone-700 rounded-lg bg-stone-800">
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
        </div>
    );
}