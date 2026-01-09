"use client";

import React, {useLayoutEffect, useMemo, useRef, useState} from "react";
import {TransformComponent, TransformWrapper} from "react-zoom-pan-pinch";

const CELL = 14;
const GAP = 2;
const CELL_TOTAL = CELL + GAP;

interface Props {
    children: React.ReactNode;
    width: number;
    height: number;
}

export function ZoomViewport({ children, width, height }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const update = () => {
            setWrapperWidth(ref.current!.getBoundingClientRect().width);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);

    const canvasW = width * CELL_TOTAL - GAP;
    const canvasH = height * CELL_TOTAL - GAP;

    const scale = useMemo(() => {
        if (!wrapperWidth) return 1;
        return Math.min(wrapperWidth / canvasW, wrapperWidth / canvasH);
    }, [wrapperWidth, canvasW, canvasH]);

    const wrapperHeight = canvasH * scale;

    return (
        <div
            ref={ref}
            className="w-full overflow-hidden"
            style={{ height: `${wrapperHeight}px`, maxHeight: `${wrapperWidth}px` }}
        >
            <TransformWrapper
                key={`${width}x${height}x${scale}`}
                initialScale={scale}
                minScale={scale}
                maxScale={scale * 50}
                centerOnInit
                limitToBounds={true}
                wheel={{ step: 0.15 }}
                smooth={false}
                panning={{ velocityDisabled: true }}
                zoomAnimation={{ disabled: true } }
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div style={{ width: canvasW, height: canvasH }}>
                        {children}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
