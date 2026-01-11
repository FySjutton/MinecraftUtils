"use client";

import React, { useState, useMemo } from "react";
import { ShapeOptions, isShapeFilled } from "./ShapeGenerator";
import { ThemeName, themes } from "@/app/generators/shape-generator/styling/themes";
import { ShapeGridBackground } from "@/app/generators/shape-generator/styling/ShapeGridBackground";

const CELL = 14;
const GAP = 2;
const PADDING = 6;

interface Cell { x: number; y: number; }
type Orientation = "horizontal" | "vertical";

interface Group {
    cells: Cell[];
    orientation: Orientation;
}

interface Props {
    options: ShapeOptions;
    theme: ThemeName;
    checks: Map<string, boolean>;
    setChecks: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
}

export function InteractiveShapeGroups({ options, theme, checks, setChecks }: Props) {
    const { width, height } = options;

    const [hoveredGroup, setHoveredGroup] = useState<Group | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    const { backgroundColor, checkedColor, cellColor, borderColor, textColor, pattern } = themes[theme];

    // Precompute groups for “thin” / “thick” modes
    const groups = useMemo<Group[]>(() => {
        if (options.mode === "filled") return [];
        const out: Group[] = [];

        // horizontal runs
        for (let y = 0; y < height; y++) {
            let run: Cell[] = [];
            for (let x = 0; x < width; x++) {
                if (isShapeFilled(x, y, options)) run.push({ x, y });
                else if (run.length >= 2) { out.push({ cells: run, orientation: "horizontal" }); run = []; }
                else run = [];
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "horizontal" });
        }

        // vertical runs
        for (let x = 0; x < width; x++) {
            let run: Cell[] = [];
            for (let y = 0; y < height; y++) {
                if (isShapeFilled(x, y, options)) run.push({ x, y });
                else if (run.length >= 2) { out.push({ cells: run, orientation: "vertical" }); run = []; }
                else run = [];
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "vertical" });
        }

        return out;
    }, [options, width, height]);

    const cellToGroup = useMemo(() => {
        const map = new Map<string, Group>();
        for (const g of groups) {
            for (const c of g.cells) {
                const k = `${c.x},${c.y}`;
                const prev = map.get(k);
                if (!prev || prev.cells.length < g.cells.length) map.set(k, g);
            }
        }
        return map;
    }, [groups]);

    const toggleCell = (x: number, y: number) => {
        setChecks(prev => {
            const newMap = new Map(prev);
            const key = `${x},${y}`;
            newMap.set(key, !newMap.get(key));
            return newMap;
        });
    };

    const toggleGroup = (g: Group) => {
        setChecks(prev => {
            const newMap = new Map(prev);
            const trueCount = g.cells.filter(c => newMap.get(`${c.x},${c.y}`)).length;
            const majorityIsTrue = trueCount > g.cells.length / 2;
            const nextValue = !majorityIsTrue;

            g.cells.forEach(c => newMap.set(`${c.x},${c.y}`, nextValue));
            return newMap;
        });
    };

    return (
        <svg
            viewBox={`0 0 ${(CELL + GAP) * width + 2 * PADDING} ${(CELL + GAP) * height + 2 * PADDING}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            className="rounded-sm"
        >
            <defs>{pattern}</defs>

            <rect
                x={0}
                y={0}
                width={(CELL + GAP) * width + 2 * PADDING}
                height={(CELL + GAP) * height + 2 * PADDING}
                fill={backgroundColor}
            />

            <ShapeGridBackground
                width={width}
                height={height}
                cellSize={CELL}
                gap={GAP}
                theme={theme}
                options={options}
                padding={PADDING}
            />

            <g>
                {Array.from({ length: height }).map((_, y) =>
                    Array.from({ length: width }).map((_, x) => {
                        if (!isShapeFilled(x, y, options)) return null;

                        const key = `${x},${y}`;
                        const isBuilt = checks.get(key) ?? false;

                        const gGroup = cellToGroup.get(key) ?? null;
                        const inGroup = hoveredGroup?.cells.some(c => c.x === x && c.y === y);
                        const isHoveredCell = hoveredCell?.x === x && hoveredCell?.y === y;

                        return (
                            <g key={`cell-${x}-${y}`}>
                                <rect
                                    x={x * (CELL + GAP) + PADDING + 1}
                                    y={y * (CELL + GAP) + PADDING + 1}
                                    width={CELL}
                                    height={CELL}
                                    rx={3}
                                    fill={isBuilt ? checkedColor : cellColor}
                                    stroke={borderColor ?? "transparent"}
                                    strokeWidth={borderColor ? 1 : 0}
                                    onClick={() => toggleCell(x, y)}
                                    onMouseEnter={() => { setHoveredCell({ x, y }); setHoveredGroup(gGroup); }}
                                    onMouseLeave={() => { setHoveredCell(null); setHoveredGroup(null); }}
                                    onContextMenu={e => { e.preventDefault(); if (gGroup) toggleGroup(gGroup); }}
                                />

                                {pattern && (
                                    <rect
                                        x={x * (CELL + GAP) + PADDING + 1}
                                        y={y * (CELL + GAP) + PADDING + 1}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        fill={`url(#${pattern.props.id})`}
                                        pointerEvents="none"
                                    />
                                )}

                                {(inGroup || isHoveredCell) && (
                                    <rect
                                        x={x * (CELL + GAP) + PADDING + 1}
                                        y={y * (CELL + GAP) + PADDING + 1}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        className="fill-black/30 pointer-events-none"
                                    />
                                )}

                                {inGroup && (
                                    <text
                                        x={x * (CELL + GAP) + CELL / 2 + PADDING + 0.5}
                                        y={y * (CELL + GAP) + CELL / 2 + PADDING + 4.5}
                                        textAnchor="middle"
                                        fontSize={9}
                                        fill={textColor}
                                        pointerEvents="none"
                                    >
                                        {hoveredGroup!.cells.length}
                                    </text>
                                )}
                            </g>
                        );
                    })
                )}
            </g>
        </svg>
    );
}
