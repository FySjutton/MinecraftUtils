'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { ComboBox } from '@/components/inputs/dropdowns/ComboBox';
import { InputField } from '@/components/inputs/InputField';
import { ColorDistanceMethod, ColorDistanceMethods, StaircasingMode, StaircasingModes, SupportBlockMode } from '@/app/generators/mapart/utils/types';
import { DitheringMethodName, ditheringMethods } from '@/app/generators/mapart/dithering/types';
import { Settings, SettingsSetters } from './useSettings';
import { AreaOverrides, MapArea } from './utils/areaTypes';

interface SettingsCardProps {
    outputMode: string;
    settings: Settings;
    setters: SettingsSetters;
    selectedArea?: MapArea | null;
    onAreaChange?: (area: MapArea) => void;
}

export default function SettingsCard({ outputMode, settings, setters, selectedArea, onAreaChange }: SettingsCardProps) {
    const {
        ditheringMethod, staircasingMode, colorDistanceMethod, maxHeight,
        supportMode, supportBlockName,
        brightness, contrast, saturation,
        fillColor, pixelArt, useMemoSearch,
    } = settings;

    const {
        setDitheringMethod, setStaircasingMode, setColorDistanceMethod, setMaxHeight,
        setSupportMode, setSupportBlockName,
        setBrightness, setContrast, setSaturation,
        setFillColor, setPixelArt, setUseMemoSearch,
    } = setters;

    const isHeightLimited = staircasingMode === StaircasingMode.STANDARD_CUSTOM || staircasingMode === StaircasingMode.VALLEY_CUSTOM;

    const isAreaMode = !!selectedArea;

    const aOv = <K extends keyof AreaOverrides>(key: K): AreaOverrides[K] | undefined =>
        selectedArea?.overrides[key];

    const setAOv = <K extends keyof AreaOverrides>(key: K, value: AreaOverrides[K]) => {
        if (!selectedArea || !onAreaChange) return;
        onAreaChange({ ...selectedArea, overrides: { ...selectedArea.overrides, [key]: value } });
    };

    const clearAOv = (key: keyof AreaOverrides) => {
        if (!selectedArea || !onAreaChange) return;
        const next = { ...selectedArea.overrides };
        delete next[key];
        onAreaChange({ ...selectedArea, overrides: next });
    };

    const isOverriding = (key: keyof AreaOverrides) => isAreaMode && aOv(key) !== undefined;

    const toggleOverride = (key: keyof AreaOverrides, defaultVal: AreaOverrides[typeof key]) => {
        if (isOverriding(key)) clearAOv(key);
        else setAOv(key, defaultVal);
    };

    const eff = {
        ditheringMethod: (aOv('ditheringMethod') ?? ditheringMethod) as DitheringMethodName,
        staircasingMode: (aOv('staircasingMode') ?? staircasingMode) as StaircasingMode,
        colorDistanceMethod: (aOv('colorDistanceMethod') ?? colorDistanceMethod) as ColorDistanceMethod,
        maxHeight: (aOv('maxHeight') ?? maxHeight) as number,
        supportMode: (aOv('supportMode') ?? supportMode) as SupportBlockMode,
        supportBlockName: (aOv('supportBlockName') ?? supportBlockName) as string,
        brightness: (aOv('brightness') ?? brightness) as number,
        contrast: (aOv('contrast') ?? contrast) as number,
        saturation: (aOv('saturation') ?? saturation) as number,
        fillColor: (aOv('fillColor') ?? fillColor) as string,
        pixelArt: (aOv('pixelArt') ?? pixelArt) as boolean,
    };

    const setEff = {
        ditheringMethod: (v: DitheringMethodName) => isAreaMode ? setAOv('ditheringMethod', v) : setDitheringMethod(v),
        staircasingMode: (v: StaircasingMode) => isAreaMode ? setAOv('staircasingMode', v) : setStaircasingMode(v),
        colorDistanceMethod: (v: ColorDistanceMethod) => isAreaMode ? setAOv('colorDistanceMethod', v) : setColorDistanceMethod(v),
        maxHeight: (v: number) => isAreaMode ? setAOv('maxHeight', v) : setMaxHeight(v),
        supportMode: (v: SupportBlockMode) => isAreaMode ? setAOv('supportMode', v) : setSupportMode(v),
        supportBlockName: (v: string) => isAreaMode ? setAOv('supportBlockName', v) : setSupportBlockName(v),
        brightness: (v: number) => isAreaMode ? setAOv('brightness', v) : setBrightness(v),
        contrast: (v: number) => isAreaMode ? setAOv('contrast', v) : setContrast(v),
        saturation: (v: number) => isAreaMode ? setAOv('saturation', v) : setSaturation(v),
        fillColor: (v: string) => isAreaMode ? setAOv('fillColor', v) : setFillColor(v),
        pixelArt: (v: boolean) => isAreaMode ? setAOv('pixelArt', v) : setPixelArt(v),
    };

    const isTransparentFill = eff.fillColor === 'none';
    const [localColor, setLocalColor] = useState(isTransparentFill ? '#ffffff' : eff.fillColor);

    const OverridableRow = ({ overrideKey, children }: { overrideKey: keyof AreaOverrides; children: React.ReactNode }) => {
        if (!isAreaMode) return <>{children}</>;
        const on = isOverriding(overrideKey);
        return (
            <div className="flex items-start gap-2">
                <div className={`flex-1 min-w-0 ${!on ? 'opacity-40 pointer-events-none' : ''}`}>
                    {children}
                </div>
                <Switch
                    checked={on}
                    onCheckedChange={() => toggleOverride(overrideKey, settings[overrideKey as keyof Settings] as AreaOverrides[typeof overrideKey])}
                    className="mt-1 shrink-0"
                />
            </div>
        );
    };

    return (
        <Card id="settings">
            <CardHeader>
                <CardTitle>
                    {isAreaMode ? `Settings — ${selectedArea.name}` : 'Settings'}
                </CardTitle>
                {isAreaMode && (
                    <p className="text-xs text-muted-foreground">Toggle a switch to override a setting for this area.</p>
                )}
            </CardHeader>
            <CardContent>

                {outputMode === 'buildable' && (
                    // TODO: Fix errors
                    // TODO: Clean up all files
                    <>
                        <OverridableRow overrideKey="staircasingMode">
                            <Label className="mt-4 mb-2">Staircasing Method</Label>
                            <p className="text-sm text-gray-400 mb-2">Select which staircasing method you want to use.</p>
                            <div className="flex gap-2 w-full relative box-border">
                                <div className="flex-1 min-w-0">
                                    <ComboBox
                                        items={Object.values(StaircasingMode)}
                                        value={eff.staircasingMode}
                                        onChange={e => setEff.staircasingMode(e as StaircasingMode)}
                                        getDisplayName={v => StaircasingModes[v as StaircasingMode].title.replace('%s', eff.maxHeight.toString())}
                                        getTooltip={v => StaircasingModes[v as StaircasingMode].description}
                                        className="w-full"
                                        infoButton={
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="mr-2"><Info /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="max-h-80 overflow-y-auto ring-2 ring-border">
                                                    <PopoverClose asChild>
                                                        <div>
                                                            <p className="font-bold">Classic Staircasing</p>
                                                            <p className="text-sm">Goes in a single segment, each column connected.</p>
                                                            <p className="font-bold mt-2">Valley Staircasing</p>
                                                            <p className="text-sm">Same quality as classic but stays as close to the baseline as possible, making it easier to build in survival.</p>
                                                            <p className="font-bold mt-2">Limited Height</p>
                                                            <p className="text-sm">Caps the schematic height, much easier to build in survival while still far better than a flat 2D map.</p>
                                                        </div>
                                                    </PopoverClose>
                                                </PopoverContent>
                                            </Popover>
                                        }
                                    />
                                </div>
                                {(eff.staircasingMode === StaircasingMode.VALLEY_CUSTOM || eff.staircasingMode === StaircasingMode.STANDARD_CUSTOM) && (
                                    <div className="flex-none w-15">
                                        <InputField value={eff.maxHeight} onChange={e => setEff.maxHeight(parseInt(e))} variant="number" min={3} />
                                    </div>
                                )}
                            </div>
                        </OverridableRow>

                        <Separator className="my-4" />
                    </>
                )}

                <OverridableRow overrideKey="colorDistanceMethod">
                    <Label className="mt-4 mb-2">Color Matching</Label>
                    <p className="text-sm text-gray-400 mb-2">Select which color matching algorithm you want to use.</p>
                    <ComboBox
                        items={Object.values(ColorDistanceMethod)}
                        value={eff.colorDistanceMethod}
                        onChange={e => setEff.colorDistanceMethod(e as ColorDistanceMethod)}
                        getDisplayName={v => ColorDistanceMethods[v as ColorDistanceMethod].title}
                        renderItem={v => ColorDistanceMethods[v as ColorDistanceMethod].badge}
                        getTooltip={v => ColorDistanceMethods[v as ColorDistanceMethod].description}
                    />
                </OverridableRow>

                <OverridableRow overrideKey="ditheringMethod">
                    <Label className="mt-4 mb-2">Dithering Method</Label>
                    <p className="text-sm text-gray-400 mb-2">Select which dithering method you want to use.</p>
                    <ComboBox
                        items={Object.keys(ditheringMethods)}
                        value={eff.ditheringMethod}
                        onChange={e => setEff.ditheringMethod(e as DitheringMethodName)}
                        getDisplayName={v => ditheringMethods[v as DitheringMethodName].name}
                        getTooltip={v => ditheringMethods[v as DitheringMethodName].description}
                    />
                </OverridableRow>

                {!isAreaMode && outputMode === 'buildable' && isHeightLimited && (
                    <div className="flex items-center justify-between mt-3">
                        <div>
                            <Label>Memoized Search</Label>
                            <p className="text-xs text-gray-400 mt-0.5">Joint DP optimisation across all heights per column. Slower but globally optimal for height-limited modes.</p>
                        </div>
                        <Switch checked={useMemoSearch} onCheckedChange={setUseMemoSearch} className="ml-4 shrink-0" />
                    </div>
                )}

                <Separator className="my-4" />

                {outputMode === 'buildable' && (
                    <>
                        <OverridableRow overrideKey="supportMode">
                            <Label className="mt-4 mb-2">Support Blocks</Label>
                            <p className="text-sm text-gray-400 mb-2">Select how you&#39;d like support blocks in the schematic output.</p>
                            <ComboBox
                                items={Object.values(SupportBlockMode)}
                                value={eff.supportMode}
                                onChange={e => setEff.supportMode(e as SupportBlockMode)}
                                getDisplayName={v => v === SupportBlockMode.NONE ? 'None' : v === SupportBlockMode.THIN ? 'All (Thin)' : 'All (Heavy)'}
                            />
                            {eff.supportMode !== SupportBlockMode.NONE && (
                                <div className="mt-3">
                                    <InputField label="Support Block" value={eff.supportBlockName} onChange={setEff.supportBlockName} variant="text" placeholder="e.g. netherrack" />
                                </div>
                            )}
                        </OverridableRow>

                        <Separator className="my-4" />
                    </>
                )}

                <p className="font-semibold mb-1">Image Preprocessing</p>
                {!isAreaMode && <p className="text-sm text-gray-400 mb-4">Here you can preprocess the image, potentially making a better end result.</p>}

                <div className="space-y-4">

                    <OverridableRow overrideKey="pixelArt">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Pixel Art Mode</Label>
                                <p className="text-sm text-gray-400">
                                    Disables image smoothing so pixel art stays sharp instead of being blurred when scaled.
                                </p>
                            </div>
                            <Switch checked={eff.pixelArt} onCheckedChange={setEff.pixelArt} />
                        </div>
                    </OverridableRow>

                    <OverridableRow overrideKey="fillColor">
                        <div>
                            <Label className="mb-2 block">Background Fill</Label>
                            <p className="text-sm text-gray-400 mb-2">
                                Fill transparent areas with a color, or leave them as empty (no block placed).
                            </p>
                            <div className="flex items-center gap-3">
                                <Tabs
                                    value={isTransparentFill ? 'none' : 'color'}
                                    onValueChange={v => {
                                        if (v === 'none') setEff.fillColor('none');
                                        else setEff.fillColor(localColor);
                                    }}
                                >
                                    <TabsList>
                                        <TabsTrigger value="color">Color</TabsTrigger>
                                        <TabsTrigger value="none">None (transparent)</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                {!isTransparentFill && (
                                    <input
                                        type="color"
                                        value={localColor}
                                        onChange={e => setLocalColor(e.target.value)}
                                        onBlur={e => setEff.fillColor(e.target.value)}
                                        onMouseUp={e => setEff.fillColor((e.target as HTMLInputElement).value)}
                                        className="h-9 w-14 cursor-pointer rounded border border-input bg-transparent p-1"
                                    />
                                )}
                            </div>
                        </div>
                    </OverridableRow>

                    <OverridableRow overrideKey="brightness">
                        <div>
                            <Label>Brightness: <span className="text-muted-foreground">{eff.brightness}%</span></Label>
                            <Slider value={[eff.brightness]} onValueChange={v => setEff.brightness(v[0])} min={0} max={200} step={1} className="mt-2" />
                        </div>
                    </OverridableRow>

                    <OverridableRow overrideKey="contrast">
                        <div>
                            <Label>Contrast: <span className="text-muted-foreground">{eff.contrast}%</span></Label>
                            <Slider value={[eff.contrast]} onValueChange={v => setEff.contrast(v[0])} min={0} max={200} step={1} className="mt-2" />
                        </div>
                    </OverridableRow>

                    <OverridableRow overrideKey="saturation">
                        <div>
                            <Label>Saturation: <span className="text-muted-foreground">{eff.saturation}%</span></Label>
                            <Slider value={[eff.saturation]} onValueChange={v => setEff.saturation(v[0])} min={0} max={200} step={1} className="mt-2" />
                        </div>
                    </OverridableRow>

                </div>
            </CardContent>
        </Card>
    );
}
