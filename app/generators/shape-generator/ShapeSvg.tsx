"use client";

import React, {useState, useMemo, forwardRef, useCallback} from "react";
import { generators, isShapeFilled, Shape, ShapeOptions } from "./ShapeGenerator";
import { ThemeName, themes } from "@/app/generators/shape-generator/styling/themes";
import { ShapeGridBackground } from "@/app/generators/shape-generator/styling/ShapeGridBackground";

const CELL = 14;
const GAP = 2;
const PADDING = 6;

export interface Cell {
    x: number;
    y: number;
}

type Orientation = "horizontal" | "vertical";

export interface Group {
    cells: Cell[];
    orientation: Orientation;
}

interface Props {
    shape: Shape;
    options: ShapeOptions;
    theme: ThemeName;
    checks: string[];
    setChecks: React.Dispatch<React.SetStateAction<string[]>>;
    ref?: React.RefObject<SVGSVGElement>;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

export const InteractiveShapeGroups = forwardRef<SVGSVGElement, Props>(({ shape, options, theme, checks, setChecks }, ref) => {
    const { width, height } = generators[options.shape].getSize(options);

    const [hoveredGroup, setHoveredGroup] = useState<Group | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    const { backgroundColor, checkedColor, cellColor, borderColor, textColor, pattern } = themes[theme];

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    const gridToShape = useCallback(
        (ix: number, iy: number) => ({
            x: ix - centerX,
            y: iy - centerY,
        }),
        [centerX, centerY]
    );

    const groups = useMemo<Group[]>(() => {
        if (options.mode === "filled") return [];

        const out: Group[] = [];

        for (let iy = 0; iy < height; iy++) {
            let run: Cell[] = [];
            for (let ix = 0; ix < width; ix++) {
                const { x: sx, y: sy } = gridToShape(ix, iy);
                if (isShapeFilled(sx, sy, shape, options)) {
                    run.push({ x: ix, y: iy });
                } else {
                    if (run.length >= 2) out.push({ cells: run, orientation: "horizontal" });
                    run = [];
                }
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "horizontal" });
        }

        for (let ix = 0; ix < width; ix++) {
            let run: Cell[] = [];
            for (let iy = 0; iy < height; iy++) {
                const { x: sx, y: sy } = gridToShape(ix, iy);
                if (isShapeFilled(sx, sy, shape, options)) {
                    run.push({ x: ix, y: iy });
                } else {
                    if (run.length >= 2) out.push({ cells: run, orientation: "vertical" });
                    run = [];
                }
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "vertical" });
        }

        return out;
    }, [options, height, width, gridToShape, shape]);

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
        const key = cellKey(x, y);

        setChecks(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const toggleGroup = (g: Group) => {
        setChecks(prev => {
            const prevSet = new Set(prev);

            const trueCount = g.cells.filter(c =>
                prevSet.has(cellKey(c.x, c.y))
            ).length;

            const majorityIsTrue = trueCount > g.cells.length / 2;
            const nextValue = !majorityIsTrue;

            const next = new Set(prevSet);

            g.cells.forEach(c => {
                const key = cellKey(c.x, c.y);
                if (nextValue) next.add(key);
                else next.delete(key);
            });

            return Array.from(next);
        });
    };

    const W = (CELL + GAP) * width + 2 * PADDING;
    const H = (CELL + GAP) * height + 2 * PADDING;

    return (
        <svg
            ref={ref}
            viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`}
            width="100%"
            height="100%"
            className="rounded-sm"
        >
            <defs>{pattern}</defs>

            <rect
                x={-(CELL + GAP) * width / 2 - PADDING}
                y={-(CELL + GAP) * height / 2 - PADDING}
                width={(CELL + GAP) * width + 2 * PADDING}
                height={(CELL + GAP) * height + 2 * PADDING}
                fill={backgroundColor}
            />

            <ShapeGridBackground
                shape={shape}
                width={width}
                height={height}
                cellSize={CELL}
                gap={GAP}
                theme={theme}
                options={options}
                padding={PADDING}
            />

            <g>
                {Array.from({ length: height }).map((_, iy) =>
                    Array.from({ length: width }).map((_, ix) => {
                        const { x: sx, y: sy } = gridToShape(ix, iy);

                        if (!isShapeFilled(sx, sy, shape, options)) return null;

                        const key = `${ix},${iy}`;
                        const isBuilt = checks.includes(key);

                        const gGroup = cellToGroup.get(key) ?? null;
                        const inGroup = hoveredGroup?.cells.some(c => c.x === ix && c.y === iy);
                        const isHoveredCell = hoveredCell?.x === ix && hoveredCell?.y === iy;

                        const Xcenter = (ix - centerX) * (CELL + GAP);
                        const Ycenter = (iy - centerY) * (CELL + GAP);

                        const cx = Xcenter - CELL / 2;
                        const cy = Ycenter - CELL / 2;

                        return (
                            <g key={`cell-${ix}-${iy}`}>
                                <rect
                                    x={cx}
                                    y={cy}
                                    width={CELL}
                                    height={CELL}
                                    rx={3}
                                    fill={isBuilt ? checkedColor : cellColor}
                                    stroke={borderColor ?? "transparent"}
                                    strokeWidth={borderColor ? 1 : 0}
                                    onClick={() => toggleCell(ix, iy)}
                                    onMouseEnter={() => {
                                        setHoveredCell({ x: ix, y: iy });
                                        setHoveredGroup(gGroup);
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredCell(null);
                                        setHoveredGroup(null);
                                    }}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        if (gGroup) toggleGroup(gGroup);
                                    }}
                                />

                                {pattern && (
                                    <rect
                                        x={cx}
                                        y={cy}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        fill={`url(#${pattern.props.id})`}
                                        pointerEvents="none"
                                    />
                                )}

                                {(inGroup || isHoveredCell) && (
                                    <rect
                                        x={cx}
                                        y={cy}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        className="fill-black/30 pointer-events-none"
                                    />
                                )}

                                {inGroup && (
                                    <text
                                        x={cx + CELL / 2}
                                        y={cy + CELL / 2 + 3.5}
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
});

InteractiveShapeGroups.displayName = "InteractiveShapeGroups";
