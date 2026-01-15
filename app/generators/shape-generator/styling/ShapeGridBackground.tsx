import { isShapeFilled, Shape, ShapeOptions } from "@/app/generators/shape-generator/ShapeGenerator";
import React from "react";
import { ThemeName, themes } from "@/app/generators/shape-generator/styling/themes";

interface Props {
    shape: Shape;
    width: number;
    height: number;
    cellSize: number;
    gap: number;
    theme: ThemeName;
    padding?: number;
    options: ShapeOptions;
}

export function ShapeGridBackground({
                                        shape,
                                        width,
                                        height,
                                        cellSize,
                                        gap,
                                        theme,
                                        padding = 6,
                                        options,
                                    }: Props) {
    const totalWidth = width * (cellSize + gap);
    const totalHeight = height * (cellSize + gap);

    const getColors = (theme: ThemeName) => themes[theme];
    const { gridLineColor, gridCellColor } = getColors(theme);

    const elements: React.ReactNode[] = [];

    // offset so grid is centered around 0,0
    const offsetX = -totalWidth / 2;
    const offsetY = -totalHeight / 2;

    // vertical center line (x = 0)
    if (width % 2 === 1) {
        const x = 0;
        for (let iy = 0; iy < height; iy++) {
            const y = iy - Math.floor(height / 2);
            if (!isShapeFilled(x, y, shape, options)) {
                elements.push(
                    <rect
                        key={`center-col-${x}-${y}`}
                        x={offsetX + (x + Math.floor(width / 2)) * (cellSize + gap) + 1}
                        y={offsetY + (y + Math.floor(height / 2)) * (cellSize + gap) + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={gridCellColor}
                        opacity={0.5}
                    />
                );
            }
        }
    } else {
        const x = 0; // line at center
        const lineX = offsetX + (x + width / 2) * (cellSize + gap) - gap / 2 + 1;

        elements.push(
            <line
                key="center-vertical-even"
                x1={lineX}
                y1={offsetY}
                x2={lineX}
                y2={offsetY + totalHeight}
                stroke={gridCellColor}
                strokeWidth={2}
                opacity={0.5}
            />
        );
    }

    // horizontal center line (y = 0)
    if (height % 2 === 1) {
        const y = 0;
        for (let ix = 0; ix < width; ix++) {
            const x = ix - Math.floor(width / 2);
            if (!isShapeFilled(x, y, shape, options)) {
                elements.push(
                    <rect
                        key={`center-row-${y}-${x}`}
                        x={offsetX + (x + Math.floor(width / 2)) * (cellSize + gap) + 1}
                        y={offsetY + (y + Math.floor(height / 2)) * (cellSize + gap) + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={gridCellColor}
                        opacity={0.5}
                    />
                );
            }
        }
    } else {
        const y = 0; // line at center
        const lineY = offsetY + (y + height / 2) * (cellSize + gap) - gap / 2 + 1;

        elements.push(
            <line
                key="center-horizontal-even"
                x1={offsetX}
                y1={lineY}
                x2={offsetX + totalWidth}
                y2={lineY}
                stroke={gridCellColor}
                strokeWidth={2}
                opacity={0.5}
            />
        );
    }

    // regular vertical grid lines
    for (let ix = 0; ix <= width; ix++) {
        const x = ix - Math.floor(width / 2);
        const gx = offsetX + (x + Math.floor(width / 2)) * (cellSize + gap);

        elements.push(
            <line
                key={`v-${x}`}
                x1={gx}
                y1={offsetY}
                x2={gx}
                y2={offsetY + totalHeight}
                stroke={gridLineColor}
                strokeWidth={0.5}
            />
        );
    }

    // regular horizontal grid lines
    for (let iy = 0; iy <= height; iy++) {
        const y = iy - Math.floor(height / 2);
        const gy = offsetY + (y + Math.floor(height / 2)) * (cellSize + gap);

        elements.push(
            <line
                key={`h-${y}`}
                x1={offsetX}
                y1={gy}
                x2={offsetX + totalWidth}
                y2={gy}
                stroke={gridLineColor}
                strokeWidth={0.5}
            />
        );
    }

    return <g pointerEvents="none">{elements}</g>;
}
