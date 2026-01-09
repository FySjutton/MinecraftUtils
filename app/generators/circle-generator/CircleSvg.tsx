"use client";

import React, { useState, useMemo } from "react";
import { CircleOptions, isCircleFilled } from "./CircleGenerator";
import {ThemeName, themes} from "@/app/generators/circle-generator/styling/themes";
import {CircleGridBackground} from "@/app/generators/circle-generator/styling/CircleGridBackground";

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
    options: CircleOptions;
    theme: ThemeName;
    checks: boolean[][];
    setChecks: React.Dispatch<React.SetStateAction<boolean[][]>>;
}

export function InteractiveCircleGroups({ options, theme, checks, setChecks }: Props) {
    const { width, height } = options;

    const [hoveredGroup, setHoveredGroup] = useState<Group | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    const getColors = (theme: ThemeName) => themes[theme];
    const { backgroundColor, checkedColor, cellColor, borderColor, textColor, pattern } = getColors(theme);

    const groups = useMemo<Group[]>(() => {
        if (options.mode === "filled") return [];
        const out: Group[] = [];

        for (let y = 0; y < height; y++) {
            let run: Cell[] = [];
            for (let x = 0; x < width; x++) {
                if (isCircleFilled(x, y, options)) run.push({ x, y });
                else if (run.length >= 2) { out.push({ cells: run, orientation: "horizontal" }); run = []; }
                else run = [];
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "horizontal" });
        }

        for (let x = 0; x < width; x++) {
            let run: Cell[] = [];
            for (let y = 0; y < height; y++) {
                if (isCircleFilled(x, y, options)) run.push({ x, y });
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
        setChecks(b => {
            const n = b.map(r => [...r]);
            n[y][x] = !n[y][x];
            return n;
        });
    };

    const toggleGroup = (g: Group) => {
        setChecks(b => {
            const n = b.map(r => [...r]);

            let trueCount = 0;
            for (const c of g.cells) {
                if (n[c.y][c.x]) trueCount++;
            }

            const majorityIsTrue = trueCount > g.cells.length / 2;
            const nextValue = !majorityIsTrue;

            g.cells.forEach(c => {
                n[c.y][c.x] = nextValue;
            });

            return n;
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
            <defs>
                {pattern}
            </defs>
            <rect
                x={0}
                y={0}
                width={(CELL + GAP) * width + 2 * PADDING}
                height={(CELL + GAP) * height + 2 * PADDING}
                fill={backgroundColor}
            />

            {/* Background grid */}
            <CircleGridBackground width={width} height={height} cellSize={CELL} gap={GAP} theme={theme} options={options} padding={PADDING} />

            {/* Interactive cells */}
            <g>
                {Array.from({ length: height }).map((_, y) =>
                    Array.from({ length: width }).map((_, x) => {
                        if (!isCircleFilled(x, y, options)) return null;

                        const isBuilt = checks[y]?.[x] ?? false;
                        const g = hoveredGroup;
                        const inGroup = g?.cells.some(c => c.x === x && c.y === y);
                        const isHoveredCell = hoveredCell?.x === x && hoveredCell?.y === y;
                        const cellGroup = cellToGroup.get(`${x},${y}`) ?? null;

                        return (
                            <g key={`cell-${x}-${y}`}>
                                {/* base color */}
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
                                    onMouseEnter={() => { setHoveredCell({ x, y }); setHoveredGroup(cellGroup); }}
                                    onMouseLeave={() => { setHoveredCell(null); setHoveredGroup(null); }}
                                    onContextMenu={e => { e.preventDefault(); if (cellGroup) toggleGroup(cellGroup); }}
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

                                {inGroup && (
                                    <rect
                                        x={x * (CELL + GAP) + PADDING + 1}
                                        y={y * (CELL + GAP) + PADDING + 1}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        className="fill-black/30 pointer-events-none"
                                    />
                                )}

                                {isHoveredCell && (
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
                                        {g!.cells.length}
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
