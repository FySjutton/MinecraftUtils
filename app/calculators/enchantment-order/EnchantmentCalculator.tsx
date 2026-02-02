"use client";

import React, { useState, useMemo } from "react";
import { findBestOrder, type EnchantMap, type BookInput, type TargetInput, type SearchResult } from "./bestOrder";
import { data } from "./data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trash2, AlertCircle, Play, StopCircle } from "lucide-react";
import { ComboBox } from "@/components/ComboBox";

type EnchantNamespace = keyof typeof data.enchants;

interface SelectedEnchant {
    namespace: EnchantNamespace;
    level: number;
}

const ENCHANTMENT_LIMIT = 10;
const BEAM_SEARCH_THRESHOLD = 10;

const searchPresets = [
    { name: 'Very Fast', beamWidth: 100, description: 'Quick approximation' },
    { name: 'Fast', beamWidth: 500, description: 'Good balance' },
    { name: 'Normal', beamWidth: 2000, description: 'Recommended' },
    { name: 'Thorough', beamWidth: 5000, description: 'More accurate' },
    { name: 'Exhaustive', beamWidth: null, description: 'All combinations' },
];

export const EnchantmentPlanner: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>("diamond_pickaxe");
    const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchant[]>([]);
    const [allowIncompatible, setAllowIncompatible] = useState(false);
    const [allowMoreThan10, setAllowMoreThan10] = useState(false);
    const [optimizeMode, setOptimizeMode] = useState<"levels" | "prior_work">("levels");
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

    const availableItems = useMemo(() => data.items || [], []);

    const formatItemName = (itemNamespace: string): string => {
        return itemNamespace
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    const currentPreset = useMemo(() =>
            searchPresets.find(p => p.name === searchPreset),
        [searchPreset]
    );

    const shouldWarnExhaustive = searchPreset === "Exhaustive" && selectedEnchants.length > BEAM_SEARCH_THRESHOLD;

    const calculateOrder = async () => {
        if (selectedEnchants.length === 0) return;

        setIsCalculating(true);
        setResult(null);
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
                name: formatItemName(selectedItem),
                enchants: {},
                initialWork: 0,
            };

            const beamWidth = currentPreset?.beamWidth ?? null;

            // Progress callback for live stats
            const onProgress = (explored: number, progress: string) => {
                setLiveStats({ statesExplored: explored, currentProgress: progress });
            };

            const searchResult = await findBestOrder(target, books, optimizeMode, beamWidth, onProgress);

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            setResult(searchResult);
            setCalculationStats({
                combinations: searchResult.statesExplored || 0,
                duration,
                method: beamWidth === null ? 'Exhaustive' : `Beam Search (width: ${beamWidth})`,
            });
        } catch (err) {
            console.error("Error calculating enchantment order:", err);
        } finally {
            setIsCalculating(false);
        }
    };

    const applicableEnchants = useMemo(() => {
        const enchantments: Array<{ namespace: EnchantNamespace; maxLevel: number; incompatible: string[] }> = [];

        for (const [namespace, enchantData] of Object.entries(data.enchants)) {
            const items = enchantData.items as string[];
            if (items.includes(selectedItem) || selectedItem === "book") {
                enchantments.push({
                    namespace: namespace as EnchantNamespace,
                    maxLevel: Number(enchantData.levelMax),
                    incompatible: enchantData.incompatible as string[],
                });
            }
        }

        enchantments.sort((a, b) => a.namespace.localeCompare(b.namespace));
        return enchantments;
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
            if (!allowMoreThan10 && selectedEnchants.length >= ENCHANTMENT_LIMIT) {
                alert(`You cannot select more than ${ENCHANTMENT_LIMIT} enchantments. Enable "Allow more than 10 enchantments" to bypass this limit.`);
                return;
            }

            if (isIncompatibleWithSelected(namespace, incompatibleList)) {
                alert(`${formatEnchantName(namespace)} is incompatible with your currently selected enchantments.`);
                return;
            }

            setSelectedEnchants(prev => [...prev, { namespace, level }]);
        }

        // Clear results when enchantments change
        setResult(null);
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
        setCalculationStats(null);
    };

    const formatEnchants = (enchants: EnchantMap): string => {
        const entries = Object.entries(enchants);
        if (entries.length === 0) return "none";
        return entries.map(([name, level]) => `${formatEnchantName(name)} ${level}`).join(", ");
    };

    const formatEnchantName = (enchantNamespace: string): string => {
        return enchantNamespace
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
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
                            setCalculationStats(null);
                        }}
                        getDisplayName={(value) => formatItemName(value)}
                        placeholder="Select an item"
                    />
                </CardContent>
            </Card>

            {/* Options */}
            <Card>
                <CardHeader>
                    <CardTitle>2. Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allow-incompatible"
                                checked={allowIncompatible}
                                onCheckedChange={(checked: boolean) => setAllowIncompatible(checked)}
                            />
                            <Label htmlFor="allow-incompatible" className="cursor-pointer">
                                Allow incompatible enchantments
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allow-many"
                                checked={allowMoreThan10}
                                onCheckedChange={(checked: boolean) => setAllowMoreThan10(checked)}
                            />
                            <Label htmlFor="allow-many" className="cursor-pointer">
                                Allow more than {ENCHANTMENT_LIMIT} enchantments
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Optimize for:</Label>
                        <RadioGroup value={optimizeMode} onValueChange={(value: "levels" | "prior_work") => setOptimizeMode(value)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="levels" id="opt-levels" />
                                <Label htmlFor="opt-levels" className="cursor-pointer font-normal">
                                    Least XP/Levels
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="prior_work" id="opt-work" />
                                <Label htmlFor="opt-work" className="cursor-pointer font-normal">
                                    Least Prior Work Penalty
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            {/* Enchantment Selection */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>3. Select Enchantments</CardTitle>
                            <CardDescription>Click level buttons to select enchantments</CardDescription>
                        </div>
                        {selectedEnchants.length > 0 && (
                            <Button variant="destructive" size="sm" onClick={clearAll}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {applicableEnchants.length === 0 ? (
                        <p className="text-muted-foreground italic">No enchantments available for this item.</p>
                    ) : (
                        <div className="space-y-3">
                            {applicableEnchants.map(({ namespace, maxLevel, incompatible }) => {
                                const isDisabled = isIncompatibleWithSelected(namespace, incompatible) && !hasEnchant(namespace);

                                return (
                                    <div
                                        key={namespace}
                                        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-all ${
                                            hasEnchant(namespace)
                                                ? 'bg-primary/10 border-primary'
                                                : isDisabled
                                                    ? 'bg-muted/50 border-muted opacity-60'
                                                    : 'bg-card border-border'
                                        }`}
                                    >
                                        <span className={`min-w-[200px] font-medium ${hasEnchant(namespace) ? 'text-primary' : ''}`}>
                                            {formatEnchantName(namespace)}
                                        </span>
                                        <div className="flex gap-2 flex-wrap">
                                            {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => (
                                                <Button
                                                    key={level}
                                                    size="sm"
                                                    variant={isSelected(namespace, level) ? "default" : "outline"}
                                                    onClick={() => toggleEnchant(namespace, level, incompatible)}
                                                    disabled={isDisabled}
                                                    className="min-w-[40px]"
                                                >
                                                    {level}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Enchantments Summary */}
            {selectedEnchants.length > 0 && (
                <Alert className="mb-6">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-semibold mb-2">
                            Selected: {selectedEnchants.length} enchantment{selectedEnchants.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedEnchants.map((e) => (
                                <Badge key={e.namespace} variant="secondary">
                                    {formatEnchantName(e.namespace)} {e.level}
                                </Badge>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Calculate Section */}
            {selectedEnchants.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>4. Calculate Order</CardTitle>
                        {shouldWarnExhaustive && (
                            <CardDescription>
                                <span className="text-yellow-500">
                                    ⚠️ Warning: {selectedEnchants.length} enchantments with Exhaustive mode may take a very long time. Consider using a faster preset.
                                </span>
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Search Preset:</Label>
                            <ComboBox
                                items={searchPresets.map(p => p.name)}
                                value={searchPreset}
                                onChange={setSearchPreset}
                                placeholder="Select preset"
                                className="w-[300px]"
                                renderItem={item => {
                                    const preset = searchPresets.find(p => p.name === item);
                                    return (
                                        <p className={`text-xs ${item === "Exhaustive" ? "text-red-400" : "text-gray-400"}`}>
                                            {preset?.description}
                                        </p>
                                    );
                                }}
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            <Button
                                onClick={calculateOrder}
                                disabled={isCalculating || selectedEnchants.length === 0}
                                variant="outline"
                            >
                                {isCalculating ? (
                                    <>
                                        <StopCircle className="h-4 w-4 mr-2 animate-spin" />
                                        Calculating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Calculate
                                    </>
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

            {/* Results Display */}
            {result && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Levels</p>
                                    <p className="text-2xl font-bold">{result.totalLevels}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total XP</p>
                                    <p className="text-2xl font-bold">{result.totalXp.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Final Prior Work</p>
                                    <p className="text-2xl font-bold">{Math.pow(2, result.finalWork) - 1} levels</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>📝 Optimal Order</CardTitle>
                            <CardDescription>Follow these steps in order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-4">
                                {result.steps.map((step, idx) => (
                                    <li key={idx} className="border-l-4 border-primary pl-4">
                                        <div className="font-semibold text-base mb-2">
                                            {idx + 1}. {step.description}
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div>
                                                💰 Cost: <span className="font-semibold text-foreground">{step.costLevels} levels</span> ({step.costXp.toLocaleString()} xp)
                                            </div>
                                            <div>
                                                ⚙️ Prior Work Penalty After: <span className="font-semibold text-foreground">{step.resultingPriorWorkPenaltyAfterMerge} levels</span>
                                            </div>
                                            <div>
                                                ✨ Result: <span className="text-foreground">{formatEnchants(step.resultingEnchants)}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!result && selectedEnchants.length === 0 && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-lg text-muted-foreground">
                                Select an item and enchantments above to calculate the optimal anvil order
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EnchantmentPlanner;