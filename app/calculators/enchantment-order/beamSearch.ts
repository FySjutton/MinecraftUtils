import type { EnchantMap, SearchResult } from "./bestOrder";

type Node = {
    l: number;
    w: number;
    x: number;
    enchants: EnchantMap;
    id: string;
    isTarget: boolean;
};

// Represents a partial solution with some items combined
type BeamState = {
    // The current set of "items" we have (some might be pre-merged)
    items: CombinedItem[];
    totalLevels: number;
    totalXp: number;
};

// An item (either original or result of merges)
type CombinedItem = {
    w: number;
    x: number;
    enchants: EnchantMap;
    isTarget: boolean;
    originalIndices: number[]; // which original nodes this represents
    trace: MergeTrace | null;
};

type MergeTrace = {
    left: CombinedItem;
    right: CombinedItem;
    leftWork: number;
    rightWork: number;
    leftIsTarget: boolean;
};

const MAXIMUM_MERGE_LEVELS = 39;

function stateKey(state: BeamState, mode: "levels" | "prior_work"): string {
    // Create a signature for this state to detect duplicates
    const itemsSignature = state.items
        .map(item => {
            const enchantKeys = Object.keys(item.enchants).sort();
            return `${enchantKeys.join(',')}:${item.w}:${item.isTarget ? 1 : 0}`;
        })
        .sort()
        .join('|');

    return `${itemsSignature}`;
}

function compareStates(a: BeamState, b: BeamState, mode: "levels" | "prior_work"): number {
    if (mode === "levels") {
        if (a.totalLevels !== b.totalLevels) return a.totalLevels - b.totalLevels;
        if (a.totalXp !== b.totalXp) return a.totalXp - b.totalXp;
        // Prefer solutions with fewer items remaining (closer to done)
        return a.items.length - b.items.length;
    } else {
        // For prior work mode, prefer lower max work among items
        const maxWorkA = Math.max(...a.items.map(i => i.w));
        const maxWorkB = Math.max(...b.items.map(i => i.w));
        if (maxWorkA !== maxWorkB) return maxWorkA - maxWorkB;
        if (a.totalLevels !== b.totalLevels) return a.totalLevels - b.totalLevels;
        return a.items.length - b.items.length;
    }
}

export async function findBestOrderBeamOptimized(
    nodes: Node[],
    mode: "levels" | "prior_work",
    beamWidth: number,
    {
        experienceForLevels,
        priorWorkPenaltyFromWork,
        enchantmentCost,
        combineEnchantsMaps,
        buildHumanSteps,
    }: {
        experienceForLevels: (levels: number) => number;
        priorWorkPenaltyFromWork: (work: number) => number;
        enchantmentCost: (target: EnchantMap, sacrifice: EnchantMap) => number;
        combineEnchantsMaps: (left: EnchantMap, right: EnchantMap) => EnchantMap;
        buildHumanSteps: (traceOrder: any[], nodes: Node[]) => any[];
    },
    onProgress?: (explored: number, progress: string) => void
): Promise<SearchResult> {
    const n = nodes.length;
    if (n === 0) {
        return { totalLevels: 0, totalXp: 0, finalWork: 0, steps: [], combinedEnchants: {}, statesExplored: 0 };
    }

    let statesExplored = 0;
    let lastYield = Date.now();

    // Initialize: each node is a separate item
    const initialItems: CombinedItem[] = nodes.map((node, idx) => ({
        w: node.w,
        x: 0,
        enchants: { ...node.enchants },
        isTarget: node.isTarget,
        originalIndices: [idx],
        trace: null,
    }));

    let beam: BeamState[] = [{
        items: initialItems,
        totalLevels: 0,
        totalXp: 0,
    }];

    // Continue until we have states with only 1 item
    while (beam.length > 0 && beam[0].items.length > 1) {
        const newStates: BeamState[] = [];
        const seenKeys = new Map<string, BeamState>();

        for (const state of beam) {
            // Try merging each pair of items
            for (let i = 0; i < state.items.length; i++) {
                for (let j = i + 1; j < state.items.length; j++) {
                    const left = state.items[i];
                    const right = state.items[j];

                    // Try left as target
                    const shouldTryLeftAsTarget = !right.isTarget || left.isTarget;
                    if (shouldTryLeftAsTarget) {
                        const merged = tryMerge(left, right, true, {
                            experienceForLevels,
                            priorWorkPenaltyFromWork,
                            enchantmentCost,
                            combineEnchantsMaps,
                        });

                        if (merged) {
                            const newItems = [
                                ...state.items.slice(0, i),
                                ...state.items.slice(i + 1, j),
                                ...state.items.slice(j + 1),
                                merged.item
                            ];

                            const newState: BeamState = {
                                items: newItems,
                                totalLevels: state.totalLevels + merged.levels,
                                totalXp: state.totalXp + merged.xp,
                            };

                            const key = stateKey(newState, mode);
                            const existing = seenKeys.get(key);

                            if (!existing || compareStates(newState, existing, mode) < 0) {
                                seenKeys.set(key, newState);
                            }

                            statesExplored++;
                        }
                    }

                    // Try right as target
                    const shouldTryRightAsTarget = !left.isTarget || right.isTarget;
                    if (shouldTryRightAsTarget) {
                        const merged = tryMerge(right, left, false, {
                            experienceForLevels,
                            priorWorkPenaltyFromWork,
                            enchantmentCost,
                            combineEnchantsMaps,
                        });

                        if (merged) {
                            const newItems = [
                                ...state.items.slice(0, i),
                                ...state.items.slice(i + 1, j),
                                ...state.items.slice(j + 1),
                                merged.item
                            ];

                            const newState: BeamState = {
                                items: newItems,
                                totalLevels: state.totalLevels + merged.levels,
                                totalXp: state.totalXp + merged.xp,
                            };

                            const key = stateKey(newState, mode);
                            const existing = seenKeys.get(key);

                            if (!existing || compareStates(newState, existing, mode) < 0) {
                                seenKeys.set(key, newState);
                            }

                            statesExplored++;
                        }
                    }
                }
            }
        }

        // Collect unique states and sort
        for (const state of seenKeys.values()) {
            newStates.push(state);
        }
        newStates.sort((a, b) => compareStates(a, b, mode));

        // Keep only top beamWidth states
        beam = newStates.slice(0, beamWidth);

        if (onProgress && beam.length > 0) {
            const remainingItems = beam[0].items.length;
            onProgress(statesExplored, `${n - remainingItems + 1}/${n} items merged`);
        }

        // Yield to browser
        const now = Date.now();
        if (now - lastYield > 50) {
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYield = now;
        }

        // Safety check
        if (newStates.length === 0) {
            break;
        }
    }

    // Find best final state
    if (beam.length === 0) {
        return { totalLevels: Infinity, totalXp: Infinity, finalWork: Infinity, steps: [], combinedEnchants: {}, statesExplored };
    }

    const bestState = beam[0];

    if (bestState.items.length !== 1) {
        // Couldn't combine everything
        return { totalLevels: Infinity, totalXp: Infinity, finalWork: Infinity, steps: [], combinedEnchants: {}, statesExplored };
    }

    const finalItem = bestState.items[0];

    // Reconstruct steps from trace
    const traceOrder: any[] = [];
    function collectTrace(item: CombinedItem) {
        if (!item.trace) return;

        collectTrace(item.trace.left);
        collectTrace(item.trace.right);

        // Build masks for this merge
        const leftMask = item.trace.left.originalIndices.reduce((mask, idx) => mask | (1 << idx), 0);
        const rightMask = item.trace.right.originalIndices.reduce((mask, idx) => mask | (1 << idx), 0);
        const nodeMask = leftMask | rightMask;

        traceOrder.push({
            leftMask,
            rightMask,
            leftIsTarget: item.trace.leftIsTarget,
            leftWork: item.trace.leftWork,
            rightWork: item.trace.rightWork,
            nodeMask,
        });
    }

    collectTrace(finalItem);
    const steps = buildHumanSteps(traceOrder, nodes);

    return {
        totalLevels: bestState.totalLevels,
        totalXp: Math.round(bestState.totalXp),
        finalWork: finalItem.w,
        steps,
        combinedEnchants: finalItem.enchants,
        statesExplored,
    };
}

function tryMerge(
    target: CombinedItem,
    sacrifice: CombinedItem,
    leftIsTarget: boolean,
    helpers: {
        experienceForLevels: (levels: number) => number;
        priorWorkPenaltyFromWork: (work: number) => number;
        enchantmentCost: (target: EnchantMap, sacrifice: EnchantMap) => number;
        combineEnchantsMaps: (left: EnchantMap, right: EnchantMap) => EnchantMap;
    }
): { item: CombinedItem; levels: number; xp: number } | null {
    const enchCost = helpers.enchantmentCost(target.enchants, sacrifice.enchants);
    const mergeLevelCost = enchCost +
        helpers.priorWorkPenaltyFromWork(target.w) +
        helpers.priorWorkPenaltyFromWork(sacrifice.w);

    if (mergeLevelCost > MAXIMUM_MERGE_LEVELS) {
        return null;
    }

    const mergeXp = helpers.experienceForLevels(Math.round(mergeLevelCost));
    const newWork = Math.max(target.w, sacrifice.w) + 1;

    const newItem: CombinedItem = {
        w: newWork,
        x: target.x + sacrifice.x + mergeXp,
        enchants: helpers.combineEnchantsMaps(target.enchants, sacrifice.enchants),
        isTarget: target.isTarget || sacrifice.isTarget,
        originalIndices: [...target.originalIndices, ...sacrifice.originalIndices].sort((a, b) => a - b),
        trace: {
            left: leftIsTarget ? target : sacrifice,
            right: leftIsTarget ? sacrifice : target,
            leftWork: target.w,
            rightWork: sacrifice.w,
            leftIsTarget,
        },
    };

    return {
        item: newItem,
        levels: Math.round(mergeLevelCost),
        xp: mergeXp,
    };
}