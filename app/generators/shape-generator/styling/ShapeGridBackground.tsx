import {ShapeOptions, isShapeFilled} from "@/app/generators/shape-generator/ShapeGenerator";
import React from "react";
import {ThemeName, themes} from "@/app/generators/shape-generator/styling/themes";

interface Props {
    width: number;
    height: number;
    cellSize: number;
    gap: number;
    theme: ThemeName;
    padding?: number;
    options: ShapeOptions;
}

export function ShapeGridBackground({ width, height, cellSize, gap, theme, padding = 6, options }: Props) {
    const totalWidth = width * (cellSize + gap);
    const totalHeight = height * (cellSize + gap);

    const getColors = (theme: ThemeName) => themes[theme];
    const { gridLineColor, gridCellColor } = getColors(theme);

    const elements: React.ReactNode[] = [];

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // vertical center line
    if (width % 2 === 1) {
        for (let y = 0; y < height; y++) {
            if (!isShapeFilled(centerX, y, options)) {
                elements.push(
                    <rect
                        key={`center-col-${centerX}-${y}`}
                        x={centerX * (cellSize + gap) + padding + 1}
                        y={y * (cellSize + gap) + padding + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={gridCellColor}
                        opacity={0.5}
                    />
                );
            }
        }
    } else {
        const cx = width / 2;
        elements.push(
            <line
                key="center-vertical-even"
                x1={cx * (cellSize + gap) - gap / 2 + padding + 1}
                y1={padding}
                x2={cx * (cellSize + gap) - gap / 2 + padding + 1}
                y2={totalHeight + padding}
                stroke={gridCellColor}
                strokeWidth={2}
                opacity={0.5}
            />
        );
    }

    if (height % 2 === 1) {
        for (let x = 0; x < width; x++) {
            if (!isShapeFilled(x, centerY, options)) {
                elements.push(
                    <rect
                        key={`center-row-${centerY}-${x}`}
                        x={x * (cellSize + gap) + padding + 1}
                        y={centerY * (cellSize + gap) + padding + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={gridCellColor}
                        opacity={0.5}
                    />
                );
            }
        }
    } else {
        const cy = height / 2;
        elements.push(
            <line
                key="center-horizontal-even"
                x1={padding}
                y1={cy * (cellSize + gap) - gap / 2 + padding + 1}
                x2={totalWidth + padding}
                y2={cy * (cellSize + gap) - gap / 2 + padding + 1}
                stroke={gridCellColor}
                strokeWidth={2}
                opacity={0.5}
            />
        );
    }


    // regular grid lines
    for (let x = 0; x <= width; x++) {
        elements.push(
            <line
                key={`v-${x}`}
                x1={x * (cellSize + gap) + padding}
                y1={padding}
                x2={x * (cellSize + gap) + padding}
                y2={totalHeight + padding}
                stroke={gridLineColor}
                strokeWidth={0.5}
            />
        );
    }
    for (let y = 0; y <= height; y++) {
        elements.push(
            <line
                key={`h-${y}`}
                x1={padding}
                y1={y * (cellSize + gap) + padding}
                x2={totalWidth + padding}
                y2={y * (cellSize + gap) + padding}
                stroke={gridLineColor}
                strokeWidth={0.5}
            />
        );
    }

    return <g pointerEvents="none">{elements}</g>;
}
