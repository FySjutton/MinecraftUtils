"use client";

import { useState, useMemo } from "react";
import { CircleOptions, isCircleFilled } from "./CircleGenerator";

const CELL = 14;
const GAP = 2;
const PADDING = 5;

interface Cell { x: number; y: number; }
type Orientation = "horizontal" | "vertical" | "single";

interface Group { cells: Cell[]; orientation: Orientation; }

interface InteractiveCircleGroupsProps { options: CircleOptions; }

export function InteractiveCircleGroups({ options }: InteractiveCircleGroupsProps) {
    const width = options.width;
    const height = options.height;

    const [built, setBuilt] = useState<boolean[][]>(
        Array.from({ length: height }, () => Array.from({ length: width }, () => false))
    );
    const [hoveredGroup, setHoveredGroup] = useState<Group | null>(null);

    const groups: Group[] = useMemo(() => {
        if (options.mode === "filled") return [];
        const result: Group[] = [];

        for (let y = 0; y < height; y++) {
            let group: Cell[] = [];
            for (let x = 0; x < width; x++) {
                if (isCircleFilled(x, y, options)) group.push({ x, y });
                else if (group.length) { result.push({ cells: group, orientation: "horizontal" }); group = []; }
            }
            if (group.length) result.push({ cells: group, orientation: "horizontal" });
        }

        for (let x = 0; x < width; x++) {
            let group: Cell[] = [];
            for (let y = 0; y < height; y++) {
                if (isCircleFilled(x, y, options)) group.push({ x, y });
                else if (group.length) { result.push({ cells: group, orientation: "vertical" }); group = []; }
            }
            if (group.length) result.push({ cells: group, orientation: "vertical" });
        }

        return result;
    }, [options, width, height]);

    const cellToGroups = useMemo(() => {
        const map = new Map<string, { horizontal?: Group; vertical?: Group }>();
        groups.forEach(g => {
            g.cells.forEach(c => {
                const key = `${c.x},${c.y}`;
                const existing = map.get(key) || {};
                if (g.orientation === "horizontal") {
                    if (!existing.horizontal || existing.horizontal.cells.length < g.cells.length) existing.horizontal = g;
                } else {
                    if (!existing.vertical || existing.vertical.cells.length < g.cells.length) existing.vertical = g;
                }
                map.set(key, existing);
            });
        });
        return map;
    }, [groups]);

    const chooseLongestGroupForCell = (x: number, y: number): Group | null => {
        if (!isCircleFilled(x, y, options)) return null;
        const g = cellToGroups.get(`${x},${y}`);
        const h = g?.horizontal, v = g?.vertical;
        const hOK = h?.cells.length >= 2;
        const vOK = v?.cells.length >= 2;

        if (hOK && vOK) return h!.cells.length >= v!.cells.length ? h! : v!;
        if (hOK) return h!;
        if (vOK) return v!;
        return { cells: [{ x, y }], orientation: "single" }; // isolated
    };

    const groupBounds = (group: Group) => {
        const xs = group.cells.map(c => c.x);
        const ys = group.cells.map(c => c.y);
        return {
            minX: Math.min(...xs), maxX: Math.max(...xs),
            minY: Math.min(...ys), maxY: Math.max(...ys),
            centerX: group.cells.reduce((s,c)=>s+c.x,0)/group.cells.length,
            centerY: group.cells.reduce((s,c)=>s+c.y,0)/group.cells.length
        };
    };

    const toggleCell = (x: number, y: number) => {
        setBuilt(prev => { const copy = prev.map(r=>[...r]); copy[y][x]=!copy[y][x]; return copy; });
    };

    const toggleGroup = (group: Group) => {
        setBuilt(prev => {
            const copy = prev.map(r=>[...r]);
            const anyBuilt = group.cells.some(c=>copy[c.y][c.x]);
            group.cells.forEach(c=>copy[c.y][c.x]=!anyBuilt);
            return copy;
        });
    };

    return (
        <svg
            viewBox={`${-PADDING} ${-PADDING} ${(CELL+GAP)*width+2*PADDING} ${(CELL+GAP)*height+2*PADDING}`}
            width={(CELL+GAP)*width+2*PADDING}
            height={(CELL+GAP)*height+2*PADDING}
            style={{ userSelect:"none" }}
            onContextMenu={e=>e.preventDefault()}
        >
            <g transform={`translate(${PADDING},${PADDING})`}>
                {Array.from({length:height}).map((_,y)=>
                    Array.from({length:width}).map((_,x)=>{
                        if(!isCircleFilled(x,y,options)) return null;
                        const isBuilt = built[y][x];
                        return (
                            <rect
                                key={`cell-${x}-${y}`}
                                x={x*(CELL+GAP)}
                                y={y*(CELL+GAP)}
                                width={CELL} height={CELL} rx={2}
                                className={`cursor-pointer transition ${isBuilt?"fill-purple-600":"fill-red-500"}`}
                                onClick={e=>{if(e.button===0) toggleCell(x,y);}}
                                onContextMenu={e=>{e.preventDefault(); const g = chooseLongestGroupForCell(x,y); if(g) toggleGroup(g);}}
                                onMouseEnter={()=>setHoveredGroup(chooseLongestGroupForCell(x,y))}
                                onMouseLeave={()=>setHoveredGroup(null)}
                            />
                        );
                    })
                )}

                {hoveredGroup && hoveredGroup.cells.length>=2 && (()=>{
                    const {minX,minY,maxX,maxY,centerX,centerY} = groupBounds(hoveredGroup);
                    return (
                        <g key={`hover-${minX}-${minY}`}>
                            <rect
                                x={minX*(CELL+GAP)-2} y={minY*(CELL+GAP)-2}
                                width={(maxX-minX+1)*(CELL+GAP)-GAP+4}
                                height={(maxY-minY+1)*(CELL+GAP)-GAP+4}
                                fill="none" stroke="yellow" strokeWidth={1.6} rx={0} pointerEvents="none"
                            />
                            <text
                                x={centerX*(CELL+GAP)+CELL/2} y={centerY*(CELL+GAP)+CELL/2+4}
                                textAnchor="middle" fontSize={10} fontWeight="bold" fill="yellow" pointerEvents="none"
                            >
                                {hoveredGroup.cells.length}
                            </text>
                        </g>
                    );
                })()}
            </g>
        </svg>
    );
}
