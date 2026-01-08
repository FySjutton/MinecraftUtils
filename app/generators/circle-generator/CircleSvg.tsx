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

    return (
        <svg
            viewBox={`${-PADDING} ${-PADDING} ${(CELL + GAP) * width + 2 * PADDING} ${(CELL + GAP) * height + 2 * PADDING}`}
            width="100%"
            height="100%"
            style={{ userSelect: "none" }}
        >
            <g transform={`translate(${PADDING},${PADDING})`}>

                {Array.from({ length: height }).map((_, y) =>
                    Array.from({ length: width }).map((_, x) => {
                        if (!isCircleFilled(x, y, options)) return null;

                        const isBuilt = built[y]?.[x] ?? false;
                        const g = hoveredGroup;
                        const inGroup = g?.cells.some(c => c.x === x && c.y === y);
                        const isHoveredCell = hoveredCell?.x === x && hoveredCell?.y === y;
                        const cellGroup = cellToGroup.get(`${x},${y}`) ?? null;

                        return (
                            <g key={`cell-${x}-${y}`}>
                                <rect
                                    x={x * (CELL + GAP)}
                                    y={y * (CELL + GAP)}
                                    width={CELL}
                                    height={CELL}
                                    rx={3}
                                    className={isBuilt ? "fill-purple-600" : "fill-red-500"}
                                    onClick={() => toggleCell(x, y)}
                                    onMouseEnter={() => {
                                        setHoveredCell({ x, y });
                                        setHoveredGroup(cellGroup);
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredCell(null);
                                        setHoveredGroup(null);
                                    }}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        if (cellGroup) toggleGroup(cellGroup);
                                    }}
                                />

                                {inGroup && (
                                    <rect
                                        x={x * (CELL + GAP)}
                                        y={y * (CELL + GAP)}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        className="fill-black/30 pointer-events-none"
                                    />
                                )}

                                {isHoveredCell && (
                                    <rect
                                        x={x * (CELL + GAP)}
                                        y={y * (CELL + GAP)}
                                        width={CELL}
                                        height={CELL}
                                        rx={3}
                                        className="fill-black/30 pointer-events-none"
                                    />
                                )}

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
            </g>
        </svg>
    );
}
