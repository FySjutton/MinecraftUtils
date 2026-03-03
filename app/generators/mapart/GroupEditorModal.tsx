'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputField } from '@/components/inputs/InputField';
import { ColorPicker } from '@/components/inputs/ColorPicker';
import { BlockSelection, Brightness, PaletteConfig, PaletteGroup, PaletteBlock, BlockNBT } from './utils/types';
import { numberToHex } from './color/matching';
import { scaleRGB, rgbToHex } from './utils/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GroupEditorModalProps {
    paletteConfig: PaletteConfig;
    onPaletteChange: (config: PaletteConfig) => void;
    blockSelection: BlockSelection;
    onBlockSelectionChange: (sel: BlockSelection) => void;
    onClose: () => void;
}

function packedRGBToHex(color: number): string {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return rgbToHex(r, g, b);
}

function hexToPackedRGB(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r << 16) | (g << 8) | b;
}

function nextCustomGroupId(config: PaletteConfig): number {
    const maxId = config.groups.reduce((max, g) => Math.max(max, g.groupId), 0);
    return Math.max(1000, maxId + 1);
}

// NBT key-value editor for a single block
function NBTEditor({ nbt, onChange }: { nbt: BlockNBT; onChange: (nbt: BlockNBT) => void }) {
    const entries = Object.entries(nbt);

    const addProperty = () => {
        onChange({ ...nbt, '': '' });
    };

    const updateKey = (oldKey: string, newKey: string) => {
        const newNbt: BlockNBT = {};
        for (const [k, v] of Object.entries(nbt)) {
            newNbt[k === oldKey ? newKey : k] = v;
        }
        onChange(newNbt);
    };

    const updateValue = (key: string, value: string) => {
        onChange({ ...nbt, [key]: value });
    };

    const removeProperty = (key: string) => {
        const next = { ...nbt };
        delete next[key];
        onChange(next);
    };

    return (
        <div className="space-y-1 pl-4 border-l-2 border-muted ml-2 mt-1">
            <Label className="text-xs text-muted-foreground">Block State Properties (NBT)</Label>
            {entries.map(([key, value], idx) => (
                <div key={idx} className="flex items-center gap-1">
                    <input
                        className="flex-1 h-7 text-xs rounded border bg-background px-2"
                        placeholder="key"
                        value={key}
                        onChange={e => updateKey(key, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">:</span>
                    <input
                        className="flex-1 h-7 text-xs rounded border bg-background px-2"
                        placeholder="value"
                        value={value}
                        onChange={e => updateValue(key, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeProperty(key)}>
                        <Trash2 size={12} />
                    </Button>
                </div>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addProperty}>
                <Plus size={12} className="mr-1" />Add Property
            </Button>
        </div>
    );
}

// Editor for a single group
function GroupEditor({
    group, onGroupChange, onDeleteGroup, blockSelection, onBlockSelectionChange,
}: {
    group: PaletteGroup;
    onGroupChange: (group: PaletteGroup) => void;
    onDeleteGroup: () => void;
    blockSelection: BlockSelection;
    onBlockSelectionChange: (sel: BlockSelection) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
    const [newBlockName, setNewBlockName] = useState('');
    const [colorHex, setColorHex] = useState(() => packedRGBToHex(group.color));

    // Sync color changes to parent
    React.useEffect(() => {
        const packed = hexToPackedRGB(colorHex);
        if (packed !== group.color) {
            onGroupChange({ ...group, color: packed });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorHex]);

    const updateLabel = (label: string) => {
        onGroupChange({ ...group, label });
    };

    const addBlock = () => {
        if (!newBlockName.trim()) return;
        const name = newBlockName.trim().toLowerCase().replace(/\s+/g, '_');
        if (group.blocks.some(b => b.name === name)) return;
        onGroupChange({ ...group, blocks: [...group.blocks, { name }] });
        // Auto-select the new block if group had no selection
        if (blockSelection[group.groupId] === undefined || blockSelection[group.groupId] === null) {
            onBlockSelectionChange({ ...blockSelection, [group.groupId]: name });
        }
        setNewBlockName('');
    };

    const removeBlock = (idx: number) => {
        const block = group.blocks[idx];
        const newBlocks = group.blocks.filter((_, i) => i !== idx);
        onGroupChange({ ...group, blocks: newBlocks });
        // If the removed block was selected, select the first remaining or null
        if (blockSelection[group.groupId] === block.name) {
            onBlockSelectionChange({
                ...blockSelection,
                [group.groupId]: newBlocks.length > 0 ? newBlocks[0].name : null,
            });
        }
    };

    const updateBlockNBT = (idx: number, nbt: BlockNBT) => {
        const newBlocks = [...group.blocks];
        newBlocks[idx] = { ...newBlocks[idx], nbt: Object.keys(nbt).length > 0 ? nbt : undefined };
        onGroupChange({ ...group, blocks: newBlocks });
    };

    const toggleBrightness = (b: Brightness) => {
        const current = group.brightness;
        const next = current.includes(b) ? current.filter(x => x !== b) : [...current, b];
        if (next.length === 0) return;
        onGroupChange({ ...group, brightness: next });
    };

    const allBrightnesses = group.groupId === 11
        ? [Brightness.HIGH]
        : [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH];

    const brightnessLabels: Record<number, string> = {
        [Brightness.LOW]: 'Low',
        [Brightness.NORMAL]: 'Normal',
        [Brightness.HIGH]: 'High',
    };

    return (
        <div className="border rounded-md p-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(e => !e)}>
                <div className="flex gap-0.5">
                    {allBrightnesses.map(b => (
                        <div
                            key={b}
                            className={`w-4 h-4 rounded border ${!group.brightness.includes(b) ? 'opacity-25' : ''}`}
                            style={{ backgroundColor: numberToHex(scaleRGB(group.color, b)) }}
                        />
                    ))}
                </div>
                <span className="text-sm font-medium flex-1">
                    {group.label ?? `Group ${group.groupId + 1}`}
                    {group.isCustom && <span className="text-xs text-muted-foreground ml-1">(custom)</span>}
                </span>
                <span className="text-xs text-muted-foreground">{group.blocks.length} blocks</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {expanded && (
                <div className="mt-3 space-y-3">
                    {/* Group settings */}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Label className="text-xs">Label</Label>
                            <InputField
                                value={group.label ?? `Group ${group.groupId + 1}`}
                                onChange={updateLabel}
                                variant="text"
                                placeholder="Group name"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Color</Label>
                            <ColorPicker hex={colorHex} setHex={setColorHex} initialValue={colorHex} />
                        </div>
                    </div>

                    {/* Brightness toggles */}
                    {allBrightnesses.length > 1 && (
                        <div>
                            <Label className="text-xs">Allowed Brightnesses</Label>
                            <div className="flex gap-2 mt-1">
                                {allBrightnesses.map(b => {
                                    const isEnabled = group.brightness.includes(b);
                                    return (
                                        <button
                                            key={b}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors ${isEnabled ? 'bg-primary/10 border-primary' : 'opacity-50 border-muted'}`}
                                            onClick={() => toggleBrightness(b)}
                                        >
                                            <div
                                                className="w-3 h-3 rounded border"
                                                style={{ backgroundColor: numberToHex(scaleRGB(group.color, b)) }}
                                            />
                                            {brightnessLabels[b]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Blocks list */}
                    <div>
                        <Label className="text-xs">Blocks</Label>
                        <div className="space-y-1 mt-1">
                            {group.blocks.map((block, idx) => (
                                <div key={`${block.name}-${idx}`}>
                                    <div className="flex items-center gap-2 p-1.5 rounded border">
                                        <GripVertical size={12} className="text-muted-foreground shrink-0" />
                                        <span className="text-xs flex-1 truncate">{block.name}</span>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0"
                                                        onClick={() => setExpandedBlock(expandedBlock === idx ? null : idx)}
                                                    >
                                                        {expandedBlock === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit NBT properties</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 text-destructive"
                                            onClick={() => removeBlock(idx)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                    {expandedBlock === idx && (
                                        <NBTEditor
                                            nbt={block.nbt ?? {}}
                                            onChange={nbt => updateBlockNBT(idx, nbt)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add block */}
                        <div className="flex gap-2 mt-2">
                            <input
                                className="flex-1 h-8 text-xs rounded border bg-background px-2"
                                placeholder="Block name (e.g. stone_bricks)"
                                value={newBlockName}
                                onChange={e => setNewBlockName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') {
                                    addBlock();
                                } }}
                            />
                            <Button variant="outline" size="sm" className="h-8" onClick={addBlock}>
                                <Plus size={14} className="mr-1" />Add
                            </Button>
                        </div>
                    </div>

                    {/* Delete group (custom only) */}
                    {group.isCustom && (
                        <>
                            <Separator />
                            <Button variant="destructive" size="sm" onClick={onDeleteGroup}>
                                <Trash2 size={14} className="mr-1" />Delete Group
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export function GroupEditorModal({
    paletteConfig, onPaletteChange, blockSelection, onBlockSelectionChange, onClose,
}: GroupEditorModalProps) {
    const [localConfig, setLocalConfig] = useState<PaletteConfig>(() => JSON.parse(JSON.stringify(paletteConfig)));
    const [localSelection, setLocalSelection] = useState<BlockSelection>({ ...blockSelection });
    const [newGroupLabel, setNewGroupLabel] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#808080');

    const updateGroup = useCallback((groupId: number, updated: PaletteGroup) => {
        setLocalConfig(prev => ({
            groups: prev.groups.map(g => g.groupId === groupId ? updated : g),
        }));
    }, []);

    const deleteGroup = useCallback((groupId: number) => {
        setLocalConfig(prev => ({
            groups: prev.groups.filter(g => g.groupId !== groupId),
        }));
        setLocalSelection(prev => {
            const next = { ...prev };
            delete next[groupId];
            return next;
        });
    }, []);

    const addCustomGroup = () => {
        const label = newGroupLabel.trim() || `Custom Group`;
        const groupId = nextCustomGroupId(localConfig);
        const color = hexToPackedRGB(newGroupColor);
        const newGroup: PaletteGroup = {
            groupId,
            color,
            blocks: [],
            brightness: [Brightness.LOW, Brightness.NORMAL, Brightness.HIGH],
            isCustom: true,
            label,
        };
        setLocalConfig(prev => ({ groups: [...prev.groups, newGroup] }));
        setNewGroupLabel('');
        setNewGroupColor('#808080');
    };

    const handleSave = () => {
        onPaletteChange(localConfig);
        onBlockSelectionChange(localSelection);
        onClose();
    };

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Customize Palette</DialogTitle>
                    <DialogDescription>
                        Edit groups, blocks, colors, brightnesses, and NBT properties.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {localConfig.groups.map(group => (
                        <GroupEditor
                            key={group.groupId}
                            group={group}
                            onGroupChange={updated => updateGroup(group.groupId, updated)}
                            onDeleteGroup={() => deleteGroup(group.groupId)}
                            blockSelection={localSelection}
                            onBlockSelectionChange={setLocalSelection}
                        />
                    ))}
                </div>

                <Separator className="my-2" />

                {/* Add custom group */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Add Custom Group</Label>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <input
                                className="w-full h-8 text-sm rounded border bg-background px-2"
                                placeholder="Group name"
                                value={newGroupLabel}
                                onChange={e => setNewGroupLabel(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addCustomGroup(); }}
                            />
                        </div>
                        <ColorPicker hex={newGroupColor} setHex={setNewGroupColor} initialValue="#808080" />
                        <Button variant="outline" size="sm" className="h-8" onClick={addCustomGroup}>
                            <Plus size={14} className="mr-1" />Add Group
                        </Button>
                    </div>
                </div>

                <Separator className="my-2" />

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
