"use client";

import React, { useState, useMemo } from "react";
import {findBestOrder, type EnchantMap, type BookInput, type TargetInput, type SearchResult} from "./bestOrder";
import { data } from "./data";
import { Button } from "@/components/ui/button";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {Sparkles, Trash2, Play, StopCircle, XCircle, ArrowBigRight, Plus} from "lucide-react";
import { ComboBox } from "@/components/ComboBox";
import ImageObj from "next/image";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";

type EnchantNamespace = keyof typeof data.enchants;

interface SelectedEnchant {
    namespace: EnchantNamespace;
    level: number;
}

type EnchantEntry = [EnchantNamespace, number];
type EnchantGroup = EnchantEntry[];

const BEAM_SEARCH_THRESHOLD = 9;

const searchPresets = [
    { name: 'Very Fast', beamWidth: 100, description: 'Quick approximation' },
    { name: 'Fast', beamWidth: 500, description: 'Good balance' },
    { name: 'Normal', beamWidth: 2000, description: 'Middle ground' },
    { name: 'Thorough', beamWidth: 5000, description: 'More accurate' },
    { name: 'Exhaustive', beamWidth: null, description: 'All combinations' },
];

const formatEnchantName = (enchantNamespace: string): string => {
    return (data.enchants as Record<string, {name: string}>)[enchantNamespace].name;
};

export const EnchantmentPlanner: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>("");
    const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchant[]>([]);
    const [allowIncompatible, setAllowIncompatible] = useState(false);
    const [optimizeMode, setOptimizeMode] = useState<"levels" | "xp" | "prior_work">("xp");
    const [searchPreset, setSearchPreset] = useState<string>("Exhaustive");

    const [result, setResult] = useState<SearchResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationStats, setCalculationStats] = useState<{
        combinations: number;
        duration: number;
        method: string;
    } | null>(null);
    const [liveStats, setLiveStats] = useState<{
        statesExplored: number;
        currentProgress: string;
    }>({ statesExplored: 0, currentProgress: '' });
    const [error, setError] = useState<string | null>(null);

    const availableItems = useMemo(() => Object.keys(data.items) || [], []);

    const currentPreset = useMemo(() =>
            searchPresets.find(p => p.name === searchPreset),
        [searchPreset]
    );

    const shouldWarnExhaustive = searchPreset === "Exhaustive" && selectedEnchants.length > BEAM_SEARCH_THRESHOLD;

    const calculateOrder = async () => {
        if (selectedEnchants.length === 0) return;

        setIsCalculating(true);
        setResult(null);
        setError(null);
        setCalculationStats(null);
        setLiveStats({ statesExplored: 0, currentProgress: '' });

        const startTime = performance.now();

        try {
            const books: BookInput[] = selectedEnchants.map((e) => {
                const enchantMap: EnchantMap = {};
                enchantMap[e.namespace as string] = e.level;
                return {
                    id: `Book (${e.namespace} ${e.level})`,
                    enchants: enchantMap,
                    initialWork: 0,
                };
            });

            const target: TargetInput = {
                name: selectedItem,
                enchants: {},
                initialWork: 0,
            };

            const beamWidth = currentPreset?.beamWidth ?? null;

            // Progress callback for live stats
            const onProgress = (explored: number, progress: string) => {
                setLiveStats({ statesExplored: explored, currentProgress: progress });
            };

            const searchResult = await findBestOrder(selectedItem, target, books, optimizeMode, beamWidth, onProgress);

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            // Check if the result indicates an error (Infinity values)
            if (searchResult.totalLevels === Infinity || searchResult.error) {
                setError(searchResult.error || "No valid solution found. The enchantments may be impossible to combine within the 39 level limit. Try removing some enchantments or using a different combination.");
                setResult(null);
            } else {
                setResult(searchResult);
                setCalculationStats({
                    combinations: searchResult.statesExplored || 0,
                    duration,
                    method: beamWidth === null ? 'Exhaustive' : `Beam Search (width: ${beamWidth})`,
                });
            }
        } catch (err) {
            console.error("Error calculating enchantment order:", err);
            setError("An unexpected error occurred during calculation. Please try again with fewer enchantments or a faster search preset.");
        } finally {
            setIsCalculating(false);
        }
    };

    const applicableEnchants = useMemo<EnchantGroup[]>(() => {
        const entries: {
            namespace: EnchantNamespace;
            maxLevel: number;
            incompatible: EnchantNamespace[];
        }[] = [];

        for (const [namespace, enchantData] of Object.entries(data.enchants)) {
            const items = enchantData.items as string[];

            if (!items.includes(selectedItem) && selectedItem !== "book") continue;

            entries.push({
                namespace: namespace as EnchantNamespace,
                maxLevel: Number(enchantData.levelMax),
                incompatible: (enchantData.incompatible as EnchantNamespace[]) ?? [],
            });
        }

        const groups: EnchantGroup[] = [];

        for (const entry of entries) {
            let group = groups.find(g =>
                g.some(([ns]) => entry.incompatible.includes(ns))
            );

            if (!group) {
                group = [];
                groups.push(group);
            }

            group.push([entry.namespace, entry.maxLevel]);
        }

        for (const group of groups) {
            group.sort((a, b) => b[1] - a[1]);
        }

        groups.sort((a, b) => b[0][1] - a[0][1]);

        return groups;
    }, [selectedItem]);

    const isIncompatibleWithSelected = (namespace: EnchantNamespace, incompatibleList: string[]): boolean => {
        if (allowIncompatible) return false;
        return selectedEnchants.some(selected =>
            incompatibleList.includes(selected.namespace as string)
        );
    };

    const toggleEnchant = (namespace: EnchantNamespace, level: number, incompatibleList: string[]) => {
        const existing = selectedEnchants.find(e => e.namespace === namespace);

        if (existing) {
            if (existing.level === level) {
                setSelectedEnchants(prev => prev.filter(e => e.namespace !== namespace));
            } else {
                setSelectedEnchants(prev => prev.map(e =>
                    e.namespace === namespace ? { ...e, level } : e
                ));
            }
        } else {
            if (isIncompatibleWithSelected(namespace, incompatibleList)) {
                alert(`${formatEnchantName(namespace)} is incompatible with your currently selected enchantments.`);
                return;
            }

            setSelectedEnchants(prev => [...prev, { namespace, level }]);
        }

        // Clear results when enchantments change
        setResult(null);
        setError(null);
        setCalculationStats(null);
    };

    const isSelected = (namespace: EnchantNamespace, level: number): boolean => {
        const enchant = selectedEnchants.find(e => e.namespace === namespace);
        return enchant?.level === level;
    };

    const hasEnchant = (namespace: EnchantNamespace): boolean => {
        return selectedEnchants.some(e => e.namespace === namespace);
    };

    const clearAll = () => {
        setSelectedEnchants([]);
        setResult(null);
        setError(null);
        setCalculationStats(null);
    };

    return (
        <div className="space-y-3">
            {/* Item Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Select Item</CardTitle>
                    <CardDescription>Choose the item you want to enchant</CardDescription>
                </CardHeader>
                <CardContent>
                    <ComboBox
                        items={availableItems}
                        value={selectedItem}
                        onChange={(value) => {
                            setSelectedItem(value);
                            setSelectedEnchants([]);
                            setResult(null);
                            setError(null);
                            setCalculationStats(null);
                        }}
                        getDisplayName={(value) => (data.items as Record<string, string>)[value]}
                        placeholder="Select an item"
                        placeholderSearch="Select an item"
                        renderIcon={(item) => {
                            return <ImageObj
                                src={`/assets/tool/enchanting/${item}.png`}
                                alt={item}
                                fill
                                objectFit="cover"
                                className="image-pixelated"
                            />
                        }}
                    />
                </CardContent>
            </Card>

            {/* Enchantment Selection */}
            { selectedItem && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. Select Enchantments</CardTitle>
                        <CardDescription>Click level buttons to select enchantments</CardDescription>
                        <CardAction>
                            {selectedEnchants.length > 0 && (
                                <Button variant="destructive" size="sm" onClick={clearAll}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear All
                                </Button>
                            )}
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 mb-4 ml-1">
                            <Checkbox
                                id="allow-incompatible"
                                checked={allowIncompatible}
                                onCheckedChange={(checked: boolean) => setAllowIncompatible(checked)}
                            />
                            <Label htmlFor="allow-incompatible" className="cursor-pointer">
                                Allow incompatible enchantments
                            </Label>
                        </div>
                        <div className="space-y-3">
                            {applicableEnchants.map((group, groupIndex) => (
                                <React.Fragment key={groupIndex}>
                                    {group.map(([namespace, maxLevel]) => {
                                        const incompatible = group
                                            .map(([ns]) => ns)
                                            .filter(ns => ns !== namespace);

                                        const isDisabled = isIncompatibleWithSelected(namespace, incompatible) && !hasEnchant(namespace);

                                        return (
                                            <Card
                                                key={namespace}
                                                className={`flex flex-row flex-wrap gap-3 px-3 py-1 items-center ${groupIndex % 2 == 0 ? "bg-popover" : "bg-accent"} ${isDisabled ? "bg-muted/50 border-muted opacity-60" : ""}`}
                                            >
                                                <span className="min-w-[200px] w-fit font-medium">
                                                    {formatEnchantName(namespace)}
                                                </span>

                                                <div className="flex gap-2 flex-wrap w-fit bg-card p-2 rounded-xl pr-auto">
                                                    {Array.from({ length: maxLevel }, (_, i) => i + 1).map(
                                                        level => (
                                                            <Button key={level} size="sm" variant={isSelected(namespace, level) ? "default" : "outline"} onClick={() => toggleEnchant(namespace, level, incompatible)} disabled={isDisabled} className="min-w-[40px]">
                                                                {level}
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Selected Enchantments Summary */}
            {selectedEnchants.length > 0 && (
                <Card className="flex gap-0 p-4">
                    <CardContent className="flex flex-wrap items-center p-0 pl-2">
                        <Sparkles className="h-4 w-4" />
                        <div className="w-fit font-semibold ml-2">
                            Selected: {selectedEnchants.length} enchantment{selectedEnchants.length !== 1 ? 's' : ''}
                        </div>
                        <div className="w-full flex flex-wrap gap-2 mt-2">
                            {selectedEnchants.map((e) => (
                                <Badge key={e.namespace} variant="secondary">
                                    {formatEnchantName(e.namespace)} {e.level}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Calculate Section */}
            {selectedEnchants.length > 0 && (
                <Card className="gap-4">
                    <CardHeader>
                        <CardTitle>3. Calculate Order</CardTitle>
                        {shouldWarnExhaustive && (
                            <CardDescription>
                                <span className="text-yellow-500">
                                    ⚠️ Warning: {selectedEnchants.length} enchantments with exhaustive mode may take a very long time. Consider using a faster preset.
                                </span>
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm"><span className="font-semibold">Select which search preset you want to use.</span> A measurement between accuracy and speed. Exhaustive recommended for most inputs.</p>
                        <ComboBox
                            items={searchPresets.map(p => p.name)}
                            value={searchPreset}
                            onChange={setSearchPreset}
                            placeholder="Select preset"
                            className="w-full"
                            renderItem={item => {
                                const preset = searchPresets.find(p => p.name === item);
                                return (
                                    <p className={`text-xs ${item === "Exhaustive" ? "text-red-400" : "text-gray-400"}`}>
                                        {preset?.description}
                                    </p>
                                );
                            }}
                        />

                        <div className="space-y-3">
                            <p className="text-sm font-semibold">Optimize for:</p>
                            <Tabs value={optimizeMode} onValueChange={v => setOptimizeMode(v as "levels" | "xp" | "prior_work")} className="w-full h-auto">
                                <TabsList className="flex-wrap h-auto">
                                    <TabsTrigger value="xp">Least Experience (XP)</TabsTrigger>
                                    <TabsTrigger value="levels">Least Levels</TabsTrigger>
                                    <TabsTrigger value="prior_work">Least Prior Work Penalty</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex gap-2 items-center">
                            <Button onClick={calculateOrder} disabled={isCalculating || selectedEnchants.length === 0} variant="outline">
                                {isCalculating ? (
                                    <><StopCircle className="h-4 w-4 mr-2 animate-spin" />Calculating...</>
                                ) : (
                                    <><Play className="h-4 w-4 mr-2" />Calculate</>
                                )}
                            </Button>
                        </div>

                        {isCalculating && liveStats.statesExplored > 0 && (
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-3">
                                <span>States explored: <span className="text-foreground">{liveStats.statesExplored.toLocaleString()}</span></span>
                                {liveStats.currentProgress && (
                                    <>
                                        <span>•</span>
                                        <span>{liveStats.currentProgress}</span>
                                    </>
                                )}
                            </div>
                        )}

                        {calculationStats && !isCalculating && (
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-3">
                                <span>Method: <span className="text-foreground">{calculationStats.method}</span></span>
                                <span>•</span>
                                <span>States explored: <span className="text-foreground">{calculationStats.combinations.toLocaleString()}</span></span>
                                <span>•</span>
                                <span>Duration: <span className="text-foreground">{calculationStats.duration}ms</span></span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-semibold mb-1">No Solution Found</div>
                        <div>{error}</div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Results Display */}
            {result && !error && (
                <div className="space-y-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Optimal Order</CardTitle>
                            <CardDescription>Follow these steps in order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Card className="mb-2 py-2">
                                <CardContent className="px-2">
                                    <div className="flex gap-2 justify-evenly text-center flex-wrap">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Levels</p>
                                            <p className="text-xl font-bold">{result.totalLevels}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total XP</p>
                                            <p className="text-xl font-bold">{result.totalXp.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Final Prior Work</p>
                                            <p className="text-xl font-bold">{Math.pow(2, result.finalWork) - 1} levels</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {result.steps.map((step, idx) => {
                                const isTooExpensive = step.costLevels > 39;

                                return (
                                    <div key={idx}>
                                        <Card className="flex py-4 gap-2 mb-2">
                                            <CardHeader>
                                                <CardTitle>Step {idx + 1}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-4 max-[400]:px-2">
                                                <div className="flex flex-wrap gap-y-4 items-center">
                                                    <EnchantingEntry
                                                        image={step.targetedItem ? result.targetItemName : "enchanted_book"}
                                                        targetedItem={step.targetedItem}
                                                        enchants={step.targetItemEnchants}
                                                        result={result}
                                                    />

                                                    <div className="flex items-center">
                                                        <Plus className="w-6" />
                                                        <EnchantingEntry
                                                            image="enchanted_book"
                                                            targetedItem={false}
                                                            enchants={step.sacrificeItemEnchants}
                                                            result={result}
                                                        />
                                                    </div>

                                                    <div className="flex items-center">
                                                        <ArrowBigRight className="w-6" />
                                                        <EnchantingEntry
                                                            image={step.targetedItem ? result.targetItemName : "enchanted_book"}
                                                            targetedItem={step.targetedItem}
                                                            enchants={step.resultingEnchants}
                                                            result={result}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="ml-2 mt-2 flex text-xs gap-x-4 flex-wrap whitespace-nowrap">
                                                    <div><span className="font-bold">Cost:</span> <span className="font-semibold text-gray-300">{step.costLevels} levels</span> <span className="text-blue-200">({step.costXp.toLocaleString()} xp)</span></div>
                                                    <div className="font-bold">Work Penalty After: <span className="font-semibold text-gray-300">{step.resultingPriorPenalty} levels</span></div>
                                                </div>
                                                {isTooExpensive && (
                                                    <Alert variant="destructive" className="mt-2">
                                                        ⚠️ This step would be &#34;Too Expensive!&#34; in Minecraft (cost exceeds 39 levels)
                                                    </Alert>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Information</CardTitle>
                    <CardDescription className="mt-2 text-sm text-gray-300 space-y-2">
                        <p>
                            This tool calculates the optimal order for combining enchantments on any item in Minecraft.
                            It provides detailed step-by-step instructions to minimize experience, levels, or prior work penalties,
                            helping you avoid “Too Expensive!” anvil operations.
                        </p>
                        <p>Modes available:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <strong>Least Experience (XP):</strong> Minimizes the total experience cost needed across all steps. Useful if you want to spend the least XP, but may not prevent “Too Expensive!” steps.
                            </li>
                            <li>
                                <strong>Least Levels:</strong> Minimizes the total level cost per step. Helps reduce the number of levels you need to spend, this is mostly the same as experience, although less accurate if you receive levels regularly, but prior work penalties can still push steps above 39 levels.
                            </li>
                            <li>
                                <strong>Least Prior Work Penalty:</strong> Minimizes the exponential growth of the prior work penalty. This is the safest mode to reduce the chance of hitting the 39-level limit on any step.
                            </li>
                        </ul>
                        <br/><p>The utility has multiple different presents for different ways of accuracy vs speed.</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <strong>Exhaustive:</strong> This checks every single combination possible, and gives you the best solution. This is the recommended present for any simple inputs (up to about 9 different enchantments on the same tool).
                            </li>
                            <li>
                                <strong>Beam Presents:</strong> This uses a much faster methods than the exhaustive mode, but often will not find the best solution. This is recommended for really large inputs where the exhaustive would take far too long.
                            </li>
                        </ul>
                        <br/><p><strong>Why use this tool?</strong></p>
                        <p>This utility focuses mostly on advanced accuracy, often giving more accurate results than other similar tools. We also focus more on making the tool easily usable, with simple menus and helpful responses.</p>
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};

function EnchantingEntry({image, targetedItem, enchants}: { image: string, targetedItem: boolean, enchants: EnchantMap, result: SearchResult }) {
    return (
        <Card className="mx-2 p-0 py-2">
            <CardContent className="flex min-h-10 max-h-18 items-center pl-3 pr-1">
                <div className="relative min-w-8 h-8">
                    <ImageObj
                        src={`/assets/tool/enchanting/${image}.png`}
                        alt={image}
                        fill={true}
                        style={{ objectFit: 'contain' }}
                        className="image-pixelated"
                    />
                </div>
                <div className={`flex flex-wrap gap-x-1 gap-y-1 max-h-19 overflow-y-auto w-min pr-2 ${!targetedItem ? "ml-1" : ""}`}>
                    {enchants && Object.keys(enchants).length > 0 ? (
                        Object.entries(enchants).map(([name, level], index) => (
                            <Badge key={index} variant="outline" className="w-fit flex-shrink-0">
                                {formatEnchantName(name)} {level}
                            </Badge>
                        ))
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}

export default EnchantmentPlanner;