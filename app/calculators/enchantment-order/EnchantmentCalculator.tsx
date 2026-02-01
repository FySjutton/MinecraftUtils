"use client";

import React, { useState, useMemo } from "react";
import { findBestOrder, type EnchantMap, type BookInput, type TargetInput } from "./bestOrder";
import { data } from "./data";

type EnchantNamespace = keyof typeof data.enchants;

interface EnchantData {
    levelMax: number;
    weight: number;
    incompatible: EnchantNamespace[];
    items: string[];
}

interface SelectedEnchant {
    namespace: EnchantNamespace;
    level: number;
}

export const EnchantmentPlanner: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>("diamond_pickaxe");
    const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchant[]>([]);

    // Get all available items from data
    const availableItems = useMemo(() => {
        return data.items || [];
    }, []);

    // Calculate result using useMemo instead of useEffect to avoid ESLint warning
    const result = useMemo(() => {
        if (!selectedEnchants || selectedEnchants.length === 0) {
            return null;
        }

        try {
            // Convert selected enchants to books
            const books: BookInput[] = selectedEnchants.map((e) => {
                const enchantMap: EnchantMap = {};
                enchantMap[e.namespace as string] = e.level;
                return {
                    id: `Book (${e.namespace} ${e.level})`,
                    enchants: enchantMap,
                    initialWork: 0,
                };
            });

            // Create target item
            const target: TargetInput = {
                name: selectedItem.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                enchants: {},
                initialWork: 0,
            };

            // Find best order
            return findBestOrder(target, books, "levels");
        } catch (err) {
            console.error("Error calculating enchantment order:", err);
            return null;
        }
    }, [selectedEnchants, selectedItem]);

    // Get applicable enchantments for selected item
    const applicableEnchants = useMemo(() => {
        const enchantments: Array<{ namespace: EnchantNamespace; maxLevel: number }> = [];

        for (const [namespace, enchantData] of Object.entries(data.enchants)) {
            const items = enchantData.items as string[];
            if (items.includes(selectedItem) || selectedItem === "book") {
                enchantments.push({
                    namespace: namespace as EnchantNamespace,
                    maxLevel: Number(enchantData.levelMax),
                });
            }
        }

        // Sort alphabetically
        enchantments.sort((a, b) => a.namespace.localeCompare(b.namespace));

        return enchantments;
    }, [selectedItem]);

    const toggleEnchant = (namespace: EnchantNamespace, level: number) => {
        setSelectedEnchants(prev => {
            const existing = prev.find(e => e.namespace === namespace);

            if (existing) {
                if (existing.level === level) {
                    // Remove if clicking the same level
                    return prev.filter(e => e.namespace !== namespace);
                } else {
                    // Update to new level
                    return prev.map(e =>
                        e.namespace === namespace ? { ...e, level } : e
                    );
                }
            } else {
                // Add new enchantment
                return [...prev, { namespace, level }];
            }
        });
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
    };

    const formatEnchants = (enchants: EnchantMap): string => {
        const entries = Object.entries(enchants);
        if (entries.length === 0) return "none";
        return entries.map(([name, level]) => `${name} ${level}`).join(", ");
    };

    const formatItemName = (itemNamespace: string): string => {
        return itemNamespace
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h1>Minecraft Enchantment Order Calculator</h1>

            {/* Item Selection */}
            <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                <h3>1. Select Item</h3>
                <select
                    value={selectedItem}
                    onChange={(e) => {
                        setSelectedItem(e.target.value);
                        setSelectedEnchants([]); // Clear enchants when changing item
                    }}
                    style={{
                        padding: "10px 15px",
                        fontSize: "16px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        minWidth: "250px",
                        cursor: "pointer"
                    }}
                >
                    {availableItems.map(item => (
                        <option key={item} value={item}>
                            {formatItemName(item)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Enchantment Selection UI */}
            <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3>2. Select Enchantments & Levels</h3>
                    {selectedEnchants.length > 0 && (
                        <button
                            onClick={clearAll}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px"
                            }}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {applicableEnchants.length === 0 ? (
                    <p style={{ color: "#666", fontStyle: "italic" }}>No enchantments available for this item.</p>
                ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                        {applicableEnchants.map(({ namespace, maxLevel }) => (
                            <div key={namespace} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                padding: "12px",
                                backgroundColor: hasEnchant(namespace) ? "#e3f2fd" : "white",
                                borderRadius: "6px",
                                border: hasEnchant(namespace) ? "2px solid #2196F3" : "1px solid #ddd"
                            }}>
                                <span style={{
                                    minWidth: "180px",
                                    fontWeight: hasEnchant(namespace) ? "600" : "500",
                                    fontSize: "15px"
                                }}>
                                    {namespace.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                    {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => toggleEnchant(namespace, level)}
                                            style={{
                                                padding: "8px 14px",
                                                border: isSelected(namespace, level) ? "2px solid #4CAF50" : "1px solid #ccc",
                                                borderRadius: "4px",
                                                backgroundColor: isSelected(namespace, level) ? "#4CAF50" : "white",
                                                color: isSelected(namespace, level) ? "white" : "#333",
                                                cursor: "pointer",
                                                fontWeight: isSelected(namespace, level) ? "bold" : "normal",
                                                fontSize: "14px",
                                                minWidth: "40px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected(namespace, level)) {
                                                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected(namespace, level)) {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                }
                                            }}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Enchantments Summary */}
            {selectedEnchants.length > 0 && (
                <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#fff3e0", borderRadius: "8px", border: "1px solid #ffb74d" }}>
                    <h4 style={{ marginTop: 0 }}>Selected: {selectedEnchants.length} enchantment{selectedEnchants.length !== 1 ? 's' : ''}</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {selectedEnchants.map((e) => (
                            <span key={e.namespace} style={{
                                padding: "6px 12px",
                                backgroundColor: "#ff9800",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontWeight: "500"
                            }}>
                                {e.namespace.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {e.level}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div style={{ marginTop: "30px" }}>
                    <div style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f0f9ff", borderRadius: "8px", border: "2px solid #0284c7" }}>
                        <h3 style={{ marginTop: 0, color: "#0c4a6e" }}>📊 Summary</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", color: "#0f172a" }}>
                            <div>
                                <strong>Total Levels:</strong> {result.totalLevels}
                            </div>
                            <div>
                                <strong>Total XP:</strong> {result.totalXp.toLocaleString()}
                            </div>
                            <div>
                                <strong>Final Prior Work:</strong> {Math.pow(2, result.finalWork) - 1} levels
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #ddd" }}>
                        <h3 style={{ color: "#0f172a" }}>📝 Optimal Order (Follow These Steps)</h3>
                        <ol style={{ lineHeight: "2", paddingLeft: "20px" }}>
                            {result.steps.map((step, idx) => (
                                <li key={idx} style={{ marginBottom: "20px", paddingLeft: "10px" }}>
                                    <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>
                                        {step.description}
                                    </div>
                                    <div style={{
                                        fontSize: "14px",
                                        color: "#334155",
                                        marginLeft: "10px",
                                        borderLeft: "3px solid #cbd5e1",
                                        paddingLeft: "15px"
                                    }}>
                                        <div>💰 Cost: <strong style={{ color: "#0f172a" }}>{step.costLevels} levels</strong> ({step.costXp.toLocaleString()} xp)</div>
                                        <div>⚙️ Prior Work Penalty After: <strong style={{ color: "#0f172a" }}>{step.resultingPriorWorkPenaltyAfterMerge} levels</strong></div>
                                        <div>✨ Result: <span style={{ color: "#0f172a" }}>{formatEnchants(step.resultingEnchants)}</span></div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}

            {!result && selectedEnchants.length === 0 && (
                <div style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "18px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "2px dashed #cbd5e1"
                }}>
                    👆 Select an item and enchantments above to calculate the optimal anvil order
                </div>
            )}
        </div>
    );
};

export default EnchantmentPlanner;