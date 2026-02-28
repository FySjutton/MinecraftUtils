"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TodoItem = {
    text: string;
    done: boolean;
};

type Feature = {
    name: string;
    status: "In Development" | "Planned" | "Finished";
    desc?: string;
    todos?: TodoItem[];
};

type Version = {
    name: string;
    features: Feature[];
};

type RoadmapTool = {
    tool: string;
    versions: Version[];
};

const GIST_URL = "https://gist.githubusercontent.com/FySjutton/53c12ebbd1ca38f65a249ee1f32545d9/raw/roadmap.json";
const CACHE_KEY = "roadmap_cache";
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in ms

function statusColor(status: Feature["status"]): string {
    switch (status) {
        case "In Development":
            return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        case "Finished":
            return "bg-green-500/20 text-green-400 border-green-500/30";
        default:
            return "bg-blue-700/40 text-blue-400 border-blue-600/40";
    }
}

function TodoList({ todos }: { todos: TodoItem[] }) {
    const done = todos.filter((t) => t.done).length;
    const pct = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0;

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-zinc-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }}/>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                    {done}/{todos.length}
                </span>
            </div>

            <ul className="space-y-1">
                {todos.map((todo, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                        {todo.done ? (<CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />) : (<Circle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-600" />)}
                        <span className={cn(todo.done ? "line-through text-zinc-600" : "text-zinc-400")}>{todo.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    const [open, setOpen] = useState(false);
    const hasDetails = !!(feature.desc || (feature.todos && feature.todos.length > 0));

    return (
        <div className={cn(
            "w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors",
            hasDetails && "cursor-pointer hover:border-zinc-700 hover:bg-zinc-900"
        )} onClick={() => hasDetails && setOpen((v) => !v)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {hasDetails && (
                        <span className="shrink-0 text-zinc-600">
                            {open ? (<ChevronDown className="w-3.5 h-3.5" />) : (<ChevronRight className="w-3.5 h-3.5" />)}
                        </span>
                    )}
                    <span className="text-sm font-medium text-zinc-200 truncate">{feature.name}</span>
                </div>
                <span className={cn("shrink-0 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border whitespace-nowrap", statusColor(feature.status))}>
                    {feature.status}
                </span>
            </div>

            {open && (
                <div className="mt-2 pl-5 w-full overflow-hidden">
                    {feature.desc && (
                        <p className="text-xs text-zinc-500 leading-relaxed break-words">{feature.desc}</p>
                    )}
                    {feature.todos && feature.todos.length > 0 && (
                        <TodoList todos={feature.todos} />
                    )}
                </div>
            )}
        </div>
    );
}

function VersionSection({ version }: { version: Version }) {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-zinc-500 px-1">
                {version.name}
            </h3>
            <div className="space-y-1.5">
                {version.features.map((f, i) => (
                    <FeatureCard key={i} feature={f} />
                ))}
            </div>
        </div>
    );
}

function ToolCard({ tool }: { tool: RoadmapTool }) {
    const allFeatures = tool.versions.flatMap((v) => v.features);
    const inDev = allFeatures.filter((f) => f.status === "In Development").length;
    const done = allFeatures.filter((f) => f.status === "Finished").length;

    return (
        <Card className="border-zinc-800 bg-zinc-950 flex-1 max-w-130 self-start">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg font-bold text-zinc-100">{tool.tool}</CardTitle>
                    <div className="flex gap-2">
                        {inDev > 0 && (
                            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                                {inDev} active
                            </span>
                        )}
                        {done > 0 && (
                            <span className="text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                                {done} done
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {tool.versions.map((v, i) => (
                    <VersionSection key={i} version={v} />
                ))}
            </CardContent>
        </Card>
    );
}

function RoadmapSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <Card key={i} className="border-zinc-800 bg-zinc-950">
                    <CardHeader>
                        <Skeleton className="h-6 w-40 bg-zinc-800" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {[1, 2, 3].map((j) => (
                            <Skeleton key={j} className="h-10 w-full bg-zinc-800/70 rounded-lg" />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function RoadmapPage() {
    const [data, setData] = useState<RoadmapTool[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRoadmap() {
            try {
                // Check cache
                const raw = localStorage.getItem(CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as { ts: number; data: RoadmapTool[] };
                    if (Date.now() - parsed.ts < CACHE_TTL) {
                        setData(parsed.data);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch fresh
                const res = await fetch(GIST_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: RoadmapTool[] = await res.json();

                localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: json }));
                setData(json);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchRoadmap();
    }, []);

    return (
        <div className="mx-auto px-4 py-6">
            {loading && (
                <div className="mt-6">
                    <RoadmapSkeleton />
                </div>
            )}

            {error && (
                <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Failed to load roadmap: {error}
                </div>
            )}

            {data && (
                <div className="mt-6 space-y-4 flex flex-wrap justify-center gap-4">
                    {data.map((tool, i) => (
                        <ToolCard key={i} tool={tool} />
                    ))}
                </div>
            )}
        </div>
    );
}