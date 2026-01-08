"use client";

import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const CELL = 14;
const GAP = 2;
const CELL_TOTAL = CELL + GAP;

interface Props {
    children: React.ReactNode;
    width: number;  // cell count
    height: number; // cell count
}

export function ZoomViewport({ children, width, height }: Props) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [vp, setVp] = useState({ w: 500, h: 500 });

    useLayoutEffect(() => {
        if (!viewportRef.current) return;

        const ro = new ResizeObserver(entries => {
            const r = entries[0].contentRect;
            if (r.width > 0 && r.height > 0) {
                setVp({ w: r.width, h: r.height });
            }
        });

        ro.observe(viewportRef.current);
        return () => ro.disconnect();
    }, []);

    const { minScale, maxScale } = useMemo(() => {
        const canvasW = width * CELL_TOTAL - GAP;
        const canvasH = height * CELL_TOTAL - GAP;

        const fitScale = Math.min(
            vp.w / canvasW,
            vp.h / canvasH
        );

        const cellFillScale = Math.min(
            vp.w / CELL,
            vp.h / CELL
        );

        return {
            minScale: Math.max(0.05, fitScale),
            maxScale: Math.max(fitScale * 5, cellFillScale),
        };
    }, [vp, width, height]);

    return (
        <div
            ref={viewportRef}
            className="relative w-full h-[500px] border rounded-lg bg-background overflow-hidden"
        >
            <TransformWrapper
                minScale={minScale}
                maxScale={maxScale}
                initialScale={minScale}
                wheel={{ step: 1 }}
                doubleClick={{ disabled: true }}
                panning={{ velocityDisabled: true }}
                limitToBounds={true}
                smooth={false}
                centerOnInit={true}
            >
                <TransformComponent
                    wrapperClass="!w-full !h-full"
                >
                    {children}
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
