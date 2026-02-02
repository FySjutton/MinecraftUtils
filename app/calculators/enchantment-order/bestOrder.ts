import { data as rawData } from "./data";
import { findBestOrderBeamOptimized } from "./beamSearch";

export type EnchantMap = Record<string, number>;
export type BookInput = { id?: string; enchants: EnchantMap; initialWork?: number };
export type TargetInput = { name?: string; enchants?: EnchantMap; initialWork?: number };

export type HumanStep = {
    description: string;
    costLevels: number;
    costXp: number;
    resultingPriorWorkPenaltyAfterMerge: number;
    resultingEnchants: EnchantMap;
};

export type SearchResult = {
    totalLevels: number;
    totalXp: number;
    finalWork: number;
    steps: HumanStep[];
    combinedEnchants: EnchantMap;
    statesExplored?: number;
};

type EnchantMeta = { levelMax: string; weight: string; incompatible: string[]; items: string[] };
type DataShape = { enchants: Record<string, EnchantMeta>; items: string[] };
const data = rawData as unknown as DataShape;

const MAXIMUM_MERGE_LEVELS = 39;

export function weightFor(enchant: string): number {
    const meta = data.enchants[enchant];
    if (!meta) return 1;
    const v = Number(meta.weight);
    return Number.isFinite(v) && v > 0 ? v : 1;
}

export function experienceForLevels(levels: number): number {
    if (levels <= 0) return 0;
    if (levels <= 16) return levels * levels + 6 * levels;
    if (levels <= 31) return Math.round(2.5 * levels * levels - 40.5 * levels + 360);
    return Math.round(4.5 * levels * levels - 162.5 * levels + 2220);
}

export function priorWorkPenaltyFromWork(work: number): number {
    if (work <= 0) return 0;
    return Math.pow(2, work) - 1;
}

function valueOfEnchants(e: EnchantMap): number {
    let sum = 0;
    for (const [k, v] of Object.entries(e)) {
        sum += weightFor(k) * v;
    }
    return sum;
}

export function enchantmentCost(targetEnchants: EnchantMap, sacrificeEnchants: EnchantMap): number {
    let cost = 0;

    for (const [ename, slevel] of Object.entries(sacrificeEnchants)) {
        const tlevel = targetEnchants[ename] ?? 0;
        const meta = data.enchants[ename];
        const maxLevel = meta ? Number(meta.levelMax) : Number.MAX_SAFE_INTEGER;
        const weight = weightFor(ename);

        let finalLevel = tlevel;
        if (tlevel === 0) {
            finalLevel = slevel;
        } else if (slevel > tlevel) {
            finalLevel = slevel;
        } else if (slevel === tlevel && tlevel < maxLevel) {
            finalLevel = tlevel + 1;
        } else {
            finalLevel = tlevel;
        }

        cost += finalLevel * weight;
    }

    return cost;
}

export function combineEnchantsMaps(left: EnchantMap, right: EnchantMap): EnchantMap {
    const out: EnchantMap = { ...left };
    for (const [ename, rlevel] of Object.entries(right)) {
        const tlevel = out[ename] ?? 0;
        const meta = data.enchants[ename];
        const maxLevel = meta ? Number(meta.levelMax) : Number.MAX_SAFE_INTEGER;
        let finalLevel = tlevel;
        if (tlevel === 0) finalLevel = rlevel;
        else if (rlevel > tlevel) finalLevel = rlevel;
        else if (rlevel === tlevel && tlevel < maxLevel) finalLevel = tlevel + 1;
        else finalLevel = tlevel;
        out[ename] = finalLevel;
    }
    return out;
}

type Node = {
    l: number;
    w: number;
    x: number;
    enchants: EnchantMap;
    id: string;
    isTarget: boolean;
};

type DPEntry = {
    mask: number;
    l: number;
    w: number;
    x: number;
    totalLevels: number;
    enchants: EnchantMap;
    isTarget: boolean;
    trace?: { leftMask: number; rightMask: number; leftIsTarget: boolean; leftWork: number; rightWork: number } | null;
};

type Work2Entry = Record<number, DPEntry>;

function pickBetterEntry(a: DPEntry, b: DPEntry, mode: "levels" | "prior_work"): DPEntry {
    if (mode === "levels") {
        if (a.totalLevels !== b.totalLevels) return a.totalLevels < b.totalLevels ? a : b;
        if (a.x !== b.x) return a.x < b.x ? a : b;
        if (a.w !== b.w) return a.w < b.w ? a : b;
        return a;
    } else {
        if (a.w !== b.w) return a.w < b.w ? a : b;
        if (a.totalLevels !== b.totalLevels) return a.totalLevels < b.totalLevels ? a : b;
        if (a.x !== b.x) return a.x < b.x ? a : b;
        return a;
    }
}

async function findBestOrderExhaustive(
    target: TargetInput | null,
    books: BookInput[],
    mode: "levels" | "prior_work",
    onProgress?: (explored: number, progress: string) => void
): Promise<SearchResult> {
    const nodes: Node[] = books.map((b) => ({
        l: valueOfEnchants(b.enchants),
        w: b.initialWork ?? 0,
        x: 0,
        enchants: { ...b.enchants },
        id: b.id ?? `Book (${Object.keys(b.enchants).map(k => `${k} ${b.enchants[k]}`).join(", ") || "Empty"})`,
        isTarget: false,
    }));

    if (target) {
        nodes.push({
            l: valueOfEnchants(target.enchants ?? {}),
            w: target.initialWork ?? 0,
            x: 0,
            enchants: { ...(target.enchants ?? {}) },
            id: target.name ?? "Target",
            isTarget: true,
        });
    }

    const n = nodes.length;
    if (n === 0) {
        return { totalLevels: 0, totalXp: 0, finalWork: 0, steps: [], combinedEnchants: {}, statesExplored: 0 };
    }

    const fullMask = (1 << n) - 1;
    const dp: Array<Work2Entry | null> = new Array(1 << n).fill(null);
    let statesExplored = 0;
    let lastYield = Date.now();

    for (let i = 0; i < n; i++) {
        const m = 1 << i;
        const entry: DPEntry = {
            mask: m,
            l: nodes[i].l,
            w: nodes[i].w,
            x: nodes[i].x,
            totalLevels: 0,
            enchants: { ...nodes[i].enchants },
            isTarget: nodes[i].isTarget,
            trace: null,
        };
        dp[m] = { [nodes[i].w]: entry };
        statesExplored++;
    }

    for (let mask = 1; mask <= fullMask; mask++) {
        if ((mask & (mask - 1)) === 0) continue;

        const work2entry: Work2Entry = {};

        for (let left = (mask - 1) & mask; left > 0; left = (left - 1) & mask) {
            const right = mask ^ left;
            if (right === 0) continue;

            const leftWork2Entry = dp[left];
            const rightWork2Entry = dp[right];
            if (!leftWork2Entry || !rightWork2Entry) continue;

            for (const [, L] of Object.entries(leftWork2Entry)) {
                for (const [, R] of Object.entries(rightWork2Entry)) {
                    const shouldTryLeftAsTarget = !R.isTarget || L.isTarget;
                    if (shouldTryLeftAsTarget) {
                        const enchCost = enchantmentCost(L.enchants, R.enchants);
                        const mergeLevelCost = enchCost + priorWorkPenaltyFromWork(L.w) + priorWorkPenaltyFromWork(R.w);

                        if (mergeLevelCost <= MAXIMUM_MERGE_LEVELS) {
                            const mergeXp = experienceForLevels(Math.round(mergeLevelCost));
                            const newWork = Math.max(L.w, R.w) + 1;
                            const newEntry: DPEntry = {
                                mask,
                                l: L.l + R.l,
                                w: newWork,
                                x: L.x + R.x + mergeXp,
                                totalLevels: L.totalLevels + R.totalLevels + Math.round(mergeLevelCost),
                                enchants: combineEnchantsMaps(L.enchants, R.enchants),
                                isTarget: L.isTarget || R.isTarget,
                                trace: { leftMask: left, rightMask: right, leftIsTarget: true, leftWork: L.w, rightWork: R.w },
                            };

                            if (!work2entry[newWork] || pickBetterEntry(work2entry[newWork], newEntry, mode) === newEntry) {
                                work2entry[newWork] = newEntry;
                            }
                            statesExplored++;
                        }
                    }

                    const shouldTryRightAsTarget = !L.isTarget || R.isTarget;
                    if (shouldTryRightAsTarget && left !== right) {
                        const enchCost = enchantmentCost(R.enchants, L.enchants);
                        const mergeLevelCost = enchCost + priorWorkPenaltyFromWork(L.w) + priorWorkPenaltyFromWork(R.w);

                        if (mergeLevelCost <= MAXIMUM_MERGE_LEVELS) {
                            const mergeXp = experienceForLevels(Math.round(mergeLevelCost));
                            const newWork = Math.max(L.w, R.w) + 1;
                            const newEntry: DPEntry = {
                                mask,
                                l: L.l + R.l,
                                w: newWork,
                                x: L.x + R.x + mergeXp,
                                totalLevels: L.totalLevels + R.totalLevels + Math.round(mergeLevelCost),
                                enchants: combineEnchantsMaps(R.enchants, L.enchants),
                                isTarget: L.isTarget || R.isTarget,
                                trace: { leftMask: left, rightMask: right, leftIsTarget: false, leftWork: L.w, rightWork: R.w },
                            };

                            if (!work2entry[newWork] || pickBetterEntry(work2entry[newWork], newEntry, mode) === newEntry) {
                                work2entry[newWork] = newEntry;
                            }
                            statesExplored++;
                        }
                    }
                }
            }
        }

        if (Object.keys(work2entry).length > 0) {
            dp[mask] = work2entry;
        }

        const now = Date.now();
        if (now - lastYield > 50) {
            if (onProgress) {
                const progress = (mask / fullMask * 100).toFixed(1);
                onProgress(statesExplored, `${progress}% complete`);
            }
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYield = now;
        }
    }

    const finalWork2Entry = dp[fullMask];
    if (!finalWork2Entry) {
        return { totalLevels: Infinity, totalXp: Infinity, finalWork: Infinity, steps: [], combinedEnchants: {}, statesExplored };
    }

    let bestEntry: DPEntry | null = null;
    for (const entry of Object.values(finalWork2Entry)) {
        if (!bestEntry || pickBetterEntry(bestEntry, entry, mode) === entry) {
            bestEntry = entry;
        }
    }

    if (!bestEntry) {
        return { totalLevels: Infinity, totalXp: Infinity, finalWork: Infinity, steps: [], combinedEnchants: {}, statesExplored };
    }

    const traceOrder: { leftMask: number; rightMask: number; leftIsTarget: boolean; leftWork: number; rightWork: number; nodeMask: number }[] = [];

    function collect(mask: number, entry: DPEntry) {
        if (!entry.trace) return;

        const leftEntry = dp[entry.trace.leftMask]![entry.trace.leftWork];
        const rightEntry = dp[entry.trace.rightMask]![entry.trace.rightWork];

        collect(entry.trace.leftMask, leftEntry);
        collect(entry.trace.rightMask, rightEntry);

        traceOrder.push({
            leftMask: entry.trace.leftMask,
            rightMask: entry.trace.rightMask,
            leftIsTarget: entry.trace.leftIsTarget,
            leftWork: entry.trace.leftWork,
            rightWork: entry.trace.rightWork,
            nodeMask: mask,
        });
    }

    collect(bestEntry.mask, bestEntry);
    const steps = buildHumanSteps(traceOrder, nodes);

    return {
        totalLevels: bestEntry.totalLevels,
        totalXp: Math.round(bestEntry.x),
        finalWork: bestEntry.w,
        steps,
        combinedEnchants: bestEntry.enchants,
        statesExplored,
    };
}

export function buildHumanSteps(
    traceOrder: { leftMask: number; rightMask: number; leftIsTarget: boolean; leftWork: number; rightWork: number; nodeMask: number }[],
    nodes: Node[]
): HumanStep[] {
    const maskEnchants: Record<number, EnchantMap> = {};
    const maskW: Record<number, number> = {};
    const maskLabel: Record<number, string> = {};

    const n = nodes.length;
    for (let i = 0; i < n; i++) {
        const m = 1 << i;
        maskEnchants[m] = { ...nodes[i].enchants };
        maskW[m] = nodes[i].w;
        maskLabel[m] = nodes[i].id;
    }

    const humanSteps: HumanStep[] = [];

    for (const step of traceOrder) {
        const { leftMask, rightMask, leftIsTarget } = step;
        const targetMask = leftIsTarget ? leftMask : rightMask;
        const sacrificeMask = leftIsTarget ? rightMask : leftMask;

        const targetEnchants = maskEnchants[targetMask];
        const sacrificeEnchants = maskEnchants[sacrificeMask];

        if (!targetEnchants || !sacrificeEnchants) {
            console.error("Missing enchants data for mask", { targetMask, sacrificeMask, maskEnchants });
            continue;
        }

        const targetW = maskW[targetMask] ?? 0;
        const sacrificeW = maskW[sacrificeMask] ?? 0;

        const enchCost = enchantmentCost(targetEnchants, sacrificeEnchants);
        const mergeLevelCost = enchCost + priorWorkPenaltyFromWork(targetW) + priorWorkPenaltyFromWork(sacrificeW);
        const mergeXp = experienceForLevels(Math.round(mergeLevelCost));
        const resultingWork = Math.max(targetW, sacrificeW) + 1;
        const resultingPenalty = priorWorkPenaltyFromWork(resultingWork);

        const resultingEnchants = combineEnchantsMaps(targetEnchants, sacrificeEnchants);

        const targetLabel = Object.keys(targetEnchants).length > 0
            ? `${maskLabel[targetMask].split(' (')[0]} (${formatEnchants(targetEnchants)})`
            : maskLabel[targetMask];
        const sacrificeLabel = Object.keys(sacrificeEnchants).length > 0
            ? `${maskLabel[sacrificeMask].split(' (')[0]} (${formatEnchants(sacrificeEnchants)})`
            : maskLabel[sacrificeMask];

        const description = `Combine ${targetLabel} with ${sacrificeLabel}`;

        humanSteps.push({
            description,
            costLevels: Math.round(mergeLevelCost),
            costXp: Math.round(mergeXp),
            resultingPriorWorkPenaltyAfterMerge: resultingPenalty,
            resultingEnchants,
        });

        maskEnchants[step.nodeMask] = resultingEnchants;
        maskW[step.nodeMask] = resultingWork;

        const baseLabel = maskLabel[targetMask]?.split(' (')[0] ?? "Unknown";
        maskLabel[step.nodeMask] = baseLabel;
    }

    return humanSteps;
}

function formatEnchants(e: EnchantMap): string {
    const arr = Object.entries(e).map(([k, v]) => `${k} ${v}`);
    return arr.length ? arr.join(", ") : "none";
}

function prepareNodes(target: TargetInput | null, books: BookInput[]): Node[] {
    const nodes: Node[] = books.map((b) => ({
        l: valueOfEnchants(b.enchants),
        w: b.initialWork ?? 0,
        x: 0,
        enchants: { ...b.enchants },
        id: b.id ?? `Book (${Object.keys(b.enchants).map(k => `${k} ${b.enchants[k]}`).join(", ") || "Empty"})`,
        isTarget: false,
    }));

    if (target) {
        nodes.push({
            l: valueOfEnchants(target.enchants ?? {}),
            w: target.initialWork ?? 0,
            x: 0,
            enchants: { ...(target.enchants ?? {}) },
            id: target.name ?? "Target",
            isTarget: true,
        });
    }

    return nodes;
}

export async function findBestOrder(
    target: TargetInput | null,
    books: BookInput[],
    mode: "levels" | "prior_work" = "levels",
    beamWidth: number | null = null,
    onProgress?: (explored: number, progress: string) => void
): Promise<SearchResult> {
    if (beamWidth === null) {
        return findBestOrderExhaustive(target, books, mode, onProgress);
    } else {
        const nodes = prepareNodes(target, books);
        return findBestOrderBeamOptimized(nodes, mode, beamWidth, {
            experienceForLevels,
            priorWorkPenaltyFromWork,
            enchantmentCost,
            combineEnchantsMaps,
            buildHumanSteps,
        }, onProgress);
    }
}