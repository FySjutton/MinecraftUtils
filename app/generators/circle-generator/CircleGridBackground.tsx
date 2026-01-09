import {CircleOptions, isCircleFilled} from "@/app/generators/circle-generator/CircleGenerator";
import React from "react";

interface Props {
    width: number;
    height: number;
    cellSize: number;
    gap: number;
    theme: "default" | "arcade" | "blueprint";
    padding?: number;
    options: CircleOptions; // add this
}

export function CircleGridBackground({ width, height, cellSize, gap, theme, padding = 6, options }: Props) {
    const totalWidth = width * (cellSize + gap);
    const totalHeight = height * (cellSize + gap);

    const gridColor = () => {
        switch (theme) {
            case "default": return "rgb(41,41,41)";
            case "arcade": return "#112612";
            case "blueprint": return "#566670";
        }
    };
    const centerColor = () => {
        switch (theme) {
            case "default": return "rgb(166,166,166)";
            case "arcade": return "#6aa66c";
            case "blueprint": return "#1a2c96";
        }
    };
    const elements: React.ReactNode[] = [];

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    if (width % 2 === 1) {
        for (let y = 0; y < height; y++) {
            if (!isCircleFilled(centerX, y, options)) {
                elements.push(
                    <rect
                        key={`center-col-${centerX}-${y}`}
                        x={centerX * (cellSize + gap) + padding + 1}
                        y={y * (cellSize + gap) + padding + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={centerColor()}
                        opacity={0.5}
                    />
                );
            }
        }
    }

    // horizontal center row
    if (height % 2 === 1) {
        for (let x = 0; x < width; x++) {
            if (!isCircleFilled(x, centerY, options)) { // only draw if no circle
                elements.push(
                    <rect
                        key={`center-row-${centerY}-${x}`}
                        x={x * (cellSize + gap) + padding + 1}
                        y={centerY * (cellSize + gap) + padding + 1}
                        width={cellSize}
                        height={cellSize}
                        fill={centerColor()}
                        opacity={0.5}
                    />
                );
            }
        }
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
                stroke={gridColor()}
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
                stroke={gridColor()}
                strokeWidth={0.5}
            />
        );
    }

    return <g pointerEvents="none">{elements}</g>;
}
