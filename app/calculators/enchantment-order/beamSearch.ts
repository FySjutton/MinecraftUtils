import type {EnchantMap, SearchResult, Trace} from "./bestOrder";

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

function stateKey(state: BeamState): string {
    // Create a canonical key that's independent of the order items appear in the array
    // This prevents counting the same configuration multiple times
    const itemKeys = state.items.map(item => {
        // Sort enchantment keys for consistency
        const enchantKeys = Object.keys(item.enchants).sort();
        const enchantLevels = enchantKeys.map(k => item.enchants[k]);

        // Create a signature: enchantments, their levels, work, and target status
        return `${enchantKeys.join(',')}:${enchantLevels.join(',')}:w${item.w}:t${item.isTarget ? 1 : 0}`;
    }).sort().join('|');

    return itemKeys;
}

function compareStates(a: BeamState, b: BeamState, mode: "levels" | "xp" | "prior_work"): number {
    if (mode === "levels") {
        // Optimize for fewest levels
        if (a.totalLevels !== b.totalLevels) return a.totalLevels - b.totalLevels;
        if (a.totalXp !== b.totalXp) return a.totalXp - b.totalXp;
        // Prefer solutions with fewer items remaining (closer to done)
        return a.items.length - b.items.length;
    } else if (mode === "xp") {
        // Optimize for least experience points
        if (a.totalXp !== b.totalXp) return a.totalXp - b.totalXp;
        if (a.totalLevels !== b.totalLevels) return a.totalLevels - b.totalLevels;
        return a.items.length - b.items.length;
    } else {
        // Optimize for least prior work penalty
        const maxWorkA = Math.max(...a.items.map(i => i.w));
        const maxWorkB = Math.max(...b.items.map(i => i.w));
        if (maxWorkA !== maxWorkB) return maxWorkA - maxWorkB;
        if (a.totalLevels !== b.totalLevels) return a.totalLevels - b.totalLevels;
        if (a.totalXp !== b.totalXp) return a.totalXp - b.totalXp;
        return a.items.length - b.items.length;
    }
}

export async function findBestOrderBeamOptimized(
    target: string,
    nodes: Node[],
    mode: "levels" | "xp" | "prior_work",
    beamWidth: number,
    {
        experienceForLevels,
        priorWorkPenaltyFromWork,
        enchantmentCost,
        combineEnchantsMaps,
        buildSteps,
    }: {
        experienceForLevels: (levels: number) => number;
        priorWorkPenaltyFromWork: (work: number) => number;
        enchantmentCost: (target: EnchantMap, sacrifice: EnchantMap) => number;
        combineEnchantsMaps: (left: EnchantMap, right: EnchantMap) => EnchantMap;
        buildSteps: (traceOrder: any[], nodes: Node[]) => any[];
    },
    onProgress?: (explored: number, progress: string) => void
): Promise<SearchResult> {
    const n = nodes.length;
    if (n === 0) {
        return { totalLevels: 0, totalXp: 0, finalWork: 0, steps: [], targetItemName: target, combinedEnchants: {}, statesExplored: 0 };
    }

    let statesExplored = 0;
    let lastYield = Date.now();
    let lastProgressUpdate = Date.now();

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

    let iterationCount = 0;

    // Continue until we have states with only 1 item
    while (beam.length > 0 && beam[0].items.length > 1) {
        iterationCount++;

        // Use a Map to deduplicate by canonical state key
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

                            const key = stateKey(newState);
                            const existing = seenKeys.get(key);

                            // Only keep this state if it's better than what we've seen
                            if (!existing || compareStates(newState, existing, mode) < 0) {
                                seenKeys.set(key, newState);
                                // Only count as explored if it's a NEW unique state
                                if (!existing) {
                                    statesExplored++;
                                }
                            }
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

                            const key = stateKey(newState);
                            const existing = seenKeys.get(key);

                            // Only keep this state if it's better than what we've seen
                            if (!existing || compareStates(newState, existing, mode) < 0) {
                                seenKeys.set(key, newState);
                                // Only count as explored if it's a NEW unique state
                                if (!existing) {
                                    statesExplored++;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Collect unique states and sort
        const newStates = Array.from(seenKeys.values());

        // If no valid merges were found, we can't combine everything
        if (newStates.length === 0) {
            break;
        }

        newStates.sort((a, b) => compareStates(a, b, mode));

        // Keep only top beamWidth states
        beam = newStates.slice(0, beamWidth);

        // Update progress more frequently but still yield regularly
        const now = Date.now();
        if (onProgress && now - lastProgressUpdate > 100) {
            const remainingItems = beam[0].items.length;
            onProgress(statesExplored, `${n - remainingItems + 1}/${n} items merged`);
            lastProgressUpdate = now;
        }

        // Yield to browser more frequently for better responsiveness
        if (now - lastYield > 16) { // ~60fps
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYield = now;
        }
    }

    // Find best final state
    if (beam.length === 0 || beam[0].items.length !== 1) {
        // Couldn't combine everything - return error state
        return {
            totalLevels: Infinity,
            totalXp: Infinity,
            finalWork: Infinity,
            steps: [],
            targetItemName: target,
            combinedEnchants: {},
            statesExplored,
            error: "No valid solution found - enchantments may be impossible to combine with current settings"
        };
    }

    const bestState = beam[0];
    const finalItem = bestState.items[0];

    // Reconstruct steps from trace
    const traceOrder: Trace[] = [];
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
    const steps = buildSteps(traceOrder, nodes);

    return {
        totalLevels: bestState.totalLevels,
        totalXp: Math.round(bestState.totalXp),
        finalWork: finalItem.w,
        steps,
        targetItemName: target,
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