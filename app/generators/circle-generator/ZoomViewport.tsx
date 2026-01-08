"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export function ZoomViewport({ children }: { children: React.ReactNode }) {

    return (
        <div className="relative w-full h-[500px] border rounded-lg bg-background">
        <TransformWrapper
            minScale={0.2}
    maxScale={6}
    wheel={{ step: 0.1 }}
    doubleClick={{ disabled: true }}
    panning={{ velocityDisabled: true }}
    centerOnInit
    limitToBounds={false}
    >
    <TransformComponent
        wrapperClass="!w-full !h-full"
    contentClass="flex items-center justify-center"
        >
        {children}
        </TransformComponent>
        </TransformWrapper>
        </div>
);
}
