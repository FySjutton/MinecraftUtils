'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { ComboBox } from '@/components/inputs/dropdowns/ComboBox';
import { InputField } from '@/components/inputs/InputField';
import { BlockSelection, ColorDistanceMethod, ColorDistanceMethods, StaircasingMode, StaircasingModes, SupportBlockMode } from './utils/types';
import { DitheringMethodName, ditheringMethods } from './dithering/types';
import { BLOCK_GROUPS, getEverythingBlockSelection } from './utils/constants';
import { Settings } from './useSettings';
import { MapArea, AreaOverrides, areasOverlap, AREA_COLORS } from './utils/areaTypes';
import { PaletteGroup } from './PaletteComponents';
interface AreaSettingsFormProps {
    area: MapArea;
    onChange: (updated: MapArea) => void;
    globalSettings: Settings;
    globalBlockSelection: BlockSelection;
    outputMode: string;
}

memo(function AreaSettingsForm({ area, onChange, globalSettings, globalBlockSelection, outputMode }: AreaSettingsFormProps) {
    const [localFillColor, setLocalFillColor] = useState(
        area.overrides.fillColor && area.overrides.fillColor !== 'none' ? area.overrides.fillColor : '#ffffff'
    );

    const set = <K extends keyof AreaOverrides>(key: K, value: AreaOverrides[K]) => {
        onChange({ ...area, overrides: { ...area.overrides, [key]: value } });
    };

    const clear = (key: keyof AreaOverrides) => {
        const next = { ...area.overrides };
        delete next[key];
        onChange({ ...area, overrides: next });
    };

    const toggle = (key: keyof AreaOverrides, defaultVal: AreaOverrides[keyof AreaOverrides]) => {
        if (area.overrides[key] !== undefined) clear(key);
        else set(key, defaultVal as never);
    };

    const togglePalette = () => {
        if (area.overrides.blockSelection !== undefined) clear('blockSelection');
        else set('blockSelection', { ...globalBlockSelection });
    };

    const toggleBlockInArea = (groupId: number, blockName: string | null) => {
        const current = area.overrides.blockSelection ?? {};
        const next = { ...current };
        if (blockName === null || next[groupId] === blockName) delete next[groupId];
        else next[groupId] = blockName;
        set('blockSelection', next);
    };

    const isBuilt = outputMode === 'buildable';
    const ov = area.overrides;

    const effectiveFillColor = ov.fillColor !== undefined ? ov.fillColor : globalSettings.fillColor;
    const isTransparentFill = effectiveFillColor === 'none';

    return (
        <div className="space-y-4 pr-1">
            {/* Name */}
            <div>
                <Label className="mb-1 block">Name</Label>
                <Input
                    value={area.name}
                    onChange={e => onChange({ ...area, name: e.target.value })}
                    className="h-8"
                />
            </div>

            <Separator />

            {/* Block Palette */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Block Palette</Label>
                        <p className="text-xs text-muted-foreground">Use a custom block palette for this area.</p>
                    </div>
                    <Switch
                        checked={ov.blockSelection !== undefined}
                        onCheckedChange={togglePalette}
                    />
                </div>
                {ov.blockSelection !== undefined && (
                    <div className="mt-2 max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                        <p className="text-xs text-muted-foreground">
                            {Object.keys(ov.blockSelection).length} / 61 colors enabled
                        </p>
                        {BLOCK_GROUPS.map((group, groupId) => (
                            <PaletteGroup
                                key={groupId}
                                group={group}
                                groupId={groupId}
                                selectedBlock={ov.blockSelection![groupId] ?? null}
                                toggleBlockSelection={toggleBlockInArea}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            {/* Dithering */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Dithering Method</Label>
                    <Switch
                        checked={ov.ditheringMethod !== undefined}
                        onCheckedChange={() => toggle('ditheringMethod', globalSettings.ditheringMethod)}
                    />
                </div>
                <div className={ov.ditheringMethod === undefined ? 'opacity-50 pointer-events-none' : ''}>
                    <ComboBox
                        items={Object.keys(ditheringMethods)}
                        value={ov.ditheringMethod ?? globalSettings.ditheringMethod}
                        onChange={v => set('ditheringMethod', v as DitheringMethodName)}
                        getDisplayName={v => ditheringMethods[v as DitheringMethodName].name}
                        getTooltip={v => ditheringMethods[v as DitheringMethodName].description}
                    />
                </div>
            </div>

            {/* Color Matching */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Color Matching</Label>
                    <Switch
                        checked={ov.colorDistanceMethod !== undefined}
                        onCheckedChange={() => toggle('colorDistanceMethod', globalSettings.colorDistanceMethod)}
                    />
                </div>
                <div className={ov.colorDistanceMethod === undefined ? 'opacity-50 pointer-events-none' : ''}>
                    <ComboBox
                        items={Object.values(ColorDistanceMethod)}
                        value={ov.colorDistanceMethod ?? globalSettings.colorDistanceMethod}
                        onChange={v => set('colorDistanceMethod', v as ColorDistanceMethod)}
                        getDisplayName={v => ColorDistanceMethods[v as ColorDistanceMethod].title}
                        getTooltip={v => ColorDistanceMethods[v as ColorDistanceMethod].description}
                    />
                </div>
            </div>

            {/* Staircasing (buildable only) */}
            {isBuilt && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Label>Staircasing</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon-sm"><Info size={13} /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="max-h-72 overflow-y-auto ring-2 ring-border text-sm">
                                    <PopoverClose asChild>
                                        <div>
                                            <p className="font-bold">Note</p>
                                            <p>Staircasing within an area starts from Y=0, independent of surrounding areas. This is a known limitation.</p>
                                        </div>
                                    </PopoverClose>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Switch
                            checked={ov.staircasingMode !== undefined}
                            onCheckedChange={() => toggle('staircasingMode', globalSettings.staircasingMode)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className={`flex-1 min-w-0 ${ov.staircasingMode === undefined ? 'opacity-50 pointer-events-none' : ''}`}>
                            <ComboBox
                                items={Object.values(StaircasingMode)}
                                value={ov.staircasingMode ?? globalSettings.staircasingMode}
                                onChange={v => set('staircasingMode', v as StaircasingMode)}
                                getDisplayName={v => StaircasingModes[v as StaircasingMode].title.replace('%s', (ov.maxHeight ?? globalSettings.maxHeight).toString())}
                                getTooltip={v => StaircasingModes[v as StaircasingMode].description}
                                className="w-full"
                            />
                        </div>
                        {(ov.staircasingMode === StaircasingMode.VALLEY_CUSTOM || ov.staircasingMode === StaircasingMode.STANDARD_CUSTOM) && (
                            <div className="w-15 flex-none">
                                <InputField
                                    value={ov.maxHeight ?? globalSettings.maxHeight}
                                    onChange={v => set('maxHeight', parseInt(v))}
                                    variant="number"
                                    min={3}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Support Blocks (buildable only) */}
            {isBuilt && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label>Support Blocks</Label>
                        <Switch
                            checked={ov.supportMode !== undefined}
                            onCheckedChange={() => toggle('supportMode', globalSettings.supportMode)}
                        />
                    </div>
                    <div className={ov.supportMode === undefined ? 'opacity-50 pointer-events-none' : ''}>
                        <ComboBox
                            items={Object.values(SupportBlockMode)}
                            value={ov.supportMode ?? globalSettings.supportMode}
                            onChange={v => set('supportMode', v as SupportBlockMode)}
                            getDisplayName={v => v === SupportBlockMode.NONE ? 'None' : v === SupportBlockMode.THIN ? 'All (Thin)' : 'All (Heavy)'}
                        />
                    </div>
                    {ov.supportMode !== undefined && ov.supportMode !== SupportBlockMode.NONE && (
                        <div className="mt-2">
                            <InputField
                                label="Support Block"
                                value={ov.supportBlockName ?? globalSettings.supportBlockName}
                                onChange={v => set('supportBlockName', v)}
                                variant="text"
                                placeholder="e.g. netherrack"
                            />
                        </div>
                    )}
                </div>
            )}

            <Separator />

            {/* Image Preprocessing */}
            <p className="font-semibold text-sm">Image Preprocessing</p>

            {/* Pixel Art */}
            <div className="flex items-center justify-between">
                <div>
                    <Label>Pixel Art Mode</Label>
                    <p className="text-xs text-muted-foreground">Disables smoothing when scaling.</p>
                </div>
                <Switch
                    checked={ov.pixelArt !== undefined ? ov.pixelArt : globalSettings.pixelArt}
                    onCheckedChange={v => {
                        if (ov.pixelArt === undefined && v === globalSettings.pixelArt) return;
                        set('pixelArt', v);
                    }}
                />
            </div>
            {ov.pixelArt !== undefined && (
                <Button variant="outline" size="sm" onClick={() => clear('pixelArt')}>
                    Reset to global
                </Button>
            )}

            {/* Background Fill */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Background Fill</Label>
                    <Switch
                        checked={ov.fillColor !== undefined}
                        onCheckedChange={() => toggle('fillColor', globalSettings.fillColor)}
                    />
                </div>
                {ov.fillColor !== undefined && (
                    <div className="flex items-center gap-3">
                        <Tabs
                            value={isTransparentFill ? 'none' : 'color'}
                            onValueChange={v => {
                                if (v === 'none') set('fillColor', 'none');
                                else set('fillColor', localFillColor);
                            }}
                        >
                            <TabsList>
                                <TabsTrigger value="color">Color</TabsTrigger>
                                <TabsTrigger value="none">None</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {!isTransparentFill && (
                            <input
                                type="color"
                                value={localFillColor}
                                onChange={e => setLocalFillColor(e.target.value)}
                                onBlur={e => set('fillColor', e.target.value)}
                                onMouseUp={e => set('fillColor', (e.target as HTMLInputElement).value)}
                                className="h-9 w-14 cursor-pointer rounded border border-input bg-transparent p-1"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Brightness */}
            <OverridableSlider
                label="Brightness"
                overrideEnabled={ov.brightness !== undefined}
                onToggle={() => toggle('brightness', globalSettings.brightness)}
                value={ov.brightness ?? globalSettings.brightness}
                onChange={v => set('brightness', v)}
                min={0} max={200} step={1}
                unit="%"
            />

            {/* Contrast */}
            <OverridableSlider
                label="Contrast"
                overrideEnabled={ov.contrast !== undefined}
                onToggle={() => toggle('contrast', globalSettings.contrast)}
                value={ov.contrast ?? globalSettings.contrast}
                onChange={v => set('contrast', v)}
                min={0} max={200} step={1}
                unit="%"
            />

            {/* Saturation */}
            <OverridableSlider
                label="Saturation"
                overrideEnabled={ov.saturation !== undefined}
                onToggle={() => toggle('saturation', globalSettings.saturation)}
                value={ov.saturation ?? globalSettings.saturation}
                onChange={v => set('saturation', v)}
                min={0} max={200} step={1}
                unit="%"
            />
        </div>
    );
});

interface OverridableSliderProps {
    label: string;
    overrideEnabled: boolean;
    onToggle: () => void;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    unit?: string;
}

function OverridableSlider({ label, overrideEnabled, onToggle, value, onChange, min, max, step, unit }: OverridableSliderProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <Label>{label}: <span className="text-muted-foreground">{value}{unit}</span></Label>
                <Switch checked={overrideEnabled} onCheckedChange={onToggle} />
            </div>
            <Slider
                value={[value]}
                onValueChange={v => onChange(v[0])}
                min={min} max={max} step={step}
                disabled={!overrideEnabled}
            />
        </div>
    );
}
