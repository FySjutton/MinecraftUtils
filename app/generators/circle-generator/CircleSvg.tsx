"use client";

import { useState, useMemo } from "react";
import { CircleOptions, isCircleFilled } from "./CircleGenerator";

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
}

export function InteractiveCircleGroups({ options }: Props) {
    const { width, height } = options;

    const [built, setBuilt] = useState<boolean[][]>(
        Array.from({ length: height }, () => Array.from({ length: width }, () => false))
    );

    const [hoveredGroup, setHoveredGroup] = useState<Group | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    /* ---------------- groups ---------------- */

    const groups = useMemo<Group[]>(() => {
        if (options.mode === "filled") return [];
        const out: Group[] = [];

        // horizontal
        for (let y = 0; y < height; y++) {
            let run: Cell[] = [];
            for (let x = 0; x < width; x++) {
                if (isCircleFilled(x, y, options)) run.push({ x, y });
                else if (run.length >= 2) {
                    out.push({ cells: run, orientation: "horizontal" });
                    run = [];
                } else run = [];
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "horizontal" });
        }

        // vertical
        for (let x = 0; x < width; x++) {
            let run: Cell[] = [];
            for (let y = 0; y < height; y++) {
                if (isCircleFilled(x, y, options)) run.push({ x, y });
                else if (run.length >= 2) {
                    out.push({ cells: run, orientation: "vertical" });
                    run = [];
                } else run = [];
            }
            if (run.length >= 2) out.push({ cells: run, orientation: "vertical" });
        }

        return out;
    }, [options, width, height]);

    /* ---------- cell → longest group ---------- */

    const cellToGroup = useMemo(() => {
        const map = new Map<string, Group>();
        for (const g of groups) {
            for (const c of g.cells) {
                const k = `${c.x},${c.y}`;
                const prev = map.get(k);
                if (!prev || prev.cells.length < g.cells.length) {
                    map.set(k, g);
                }
            }
        }
        return map;
    }, [groups]);

    const groupBounds = (g: Group) => {
        const xs = g.cells.map(c => c.x);
        const ys = g.cells.map(c => c.y);
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
        };
    };

    /* ---------------- toggles ---------------- */

    const toggleCell = (x: number, y: number) => {
        setBuilt(b => {
            const n = b.map(r => [...r]);
            n[y][x] = !n[y][x];
            return n;
        });
    };

    const toggleGroup = (g: Group) => {
        setBuilt(b => {
            const n = b.map(r => [...r]);
            const any = g.cells.some(c => n[c.y][c.x]);
            g.cells.forEach(c => (n[c.y][c.x] = !any));
            return n;
        });
    };

    /* ---------------- render ---------------- */

    return (
        <svg
            viewBox={`${-PADDING} ${-PADDING} ${(CELL + GAP) * width + 2 * PADDING} ${(CELL + GAP) * height + 2 * PADDING}`}
            width={(CELL + GAP) * width + 2 * PADDING}
            height={(CELL + GAP) * height + 2 * PADDING}
            style={{ userSelect: "none" }}
            onContextMenu={e => e.preventDefault()}
        >
            <g transform={`translate(${PADDING},${PADDING})`}>

                {/* cells */}
                {Array.from({ length: height }).map((_, y) =>
                    Array.from({ length: width }).map((_, x) => {
                        if (!isCircleFilled(x, y, options)) return null;

                        const isBuilt = built[y]?.[x] ?? false;
                        const g = hoveredGroup;
                        const inGroup = g?.cells.some(c => c.x === x && c.y === y);
                        const isHoveredCell = hoveredCell?.x === x && hoveredCell?.y === y;

                        return (
                            <g key={`cell-${x}-${y}`}>
                                <rect
                                    x={x * (CELL + GAP)}
                                    y={y * (CELL + GAP)}
                                    width={CELL}
                                    height={CELL}
                                    rx={3}
                                    className={
                                        isHoveredCell
                                            ? "fill-black"
                                            : inGroup
                                                ? "fill-neutral-800"
                                                : isBuilt
                                                    ? "fill-purple-600"
                                                    : "fill-red-500"
                                    }
                                    onClick={() => toggleCell(x, y)}
                                    onMouseEnter={() => {
                                        setHoveredCell({ x, y });
                                        setHoveredGroup(cellToGroup.get(`${x},${y}`) ?? null);
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredCell(null);
                                        setHoveredGroup(null);
                                    }}
                                />

                                {inGroup && (
                                    <text
                                        x={x * (CELL + GAP) + CELL / 2}
                                        y={y * (CELL + GAP) + CELL / 2 + 4}
                                        textAnchor="middle"
                                        fontSize={9}
                                        fill="yellow"
                                        pointerEvents="none"
                                    >
                                        {g!.cells.length}
                                    </text>
                                )}
                            </g>
                        );
                    })
                )}

                {/* group hit areas (covers gaps) */}
                {groups.map((g, i) => {
                    const { minX, minY, maxX, maxY } = groupBounds(g);
                    return (
                        <rect
                            key={`hit-${i}`}
                            x={minX * (CELL + GAP)}
                            y={minY * (CELL + GAP)}
                            width={(maxX - minX + 1) * (CELL + GAP) - GAP}
                            height={(maxY - minY + 1) * (CELL + GAP) - GAP}
                            fill="transparent"
                            onMouseEnter={() => setHoveredGroup(g)}
                            onMouseLeave={() => setHoveredGroup(null)}
                            onContextMenu={e => {
                                e.preventDefault();
                                toggleGroup(g);
                            }}
                        />
                    );
                })}
            </g>
        </svg>
    );
}
