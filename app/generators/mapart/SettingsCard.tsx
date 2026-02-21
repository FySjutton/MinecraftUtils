'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { ComboBox } from '@/components/inputs/dropdowns/ComboBox';
import { InputField } from '@/components/inputs/InputField';
import { ColorDistanceMethod, ColorDistanceMethods, StaircasingMode, StaircasingModes, SupportBlockMode } from '@/app/generators/mapart/utils/types';
import { DitheringMethodName, ditheringMethods } from '@/app/generators/mapart/dithering/types';
import { CropMode } from './useImagePreprocessing';
import { Settings, SettingsSetters } from './useSettings';

interface SettingsCardProps {
    outputMode: string;
    settings: Settings;
    setters: SettingsSetters;
    needsXOffset: boolean;
    needsYOffset: boolean;
}

export default function SettingsCard({ outputMode, settings, setters, needsXOffset, needsYOffset }: SettingsCardProps) {
    const {
        mapWidth, mapHeight,
        ditheringMethod, staircasingMode, colorDistanceMethod, maxHeight,
        supportMode, supportBlockName,
        brightness, contrast, saturation, cropMode, xOffset, yOffset,
    } = settings;

    const {
        setMapWidth, setMapHeight,
        setDitheringMethod, setStaircasingMode, setColorDistanceMethod, setMaxHeight,
        setSupportMode, setSupportBlockName,
        setBrightness, setContrast, setSaturation, setCropMode, setXOffset, setYOffset,
    } = setters;

    return (
        <Card id="settings">
            <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <InputField value={mapWidth} onChange={e => setMapWidth(parseInt(e))} max={20} min={1} variant="number" label="Map Width (X)" />
                    <InputField value={mapHeight} onChange={e => setMapHeight(parseInt(e))} max={20} min={1} variant="number" label="Map Height (Y)" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Total size: {mapWidth * 128}x{mapHeight * 128} blocks ({mapWidth}x{mapHeight} maps)
                </p>

                <Separator className="my-4" />

                {outputMode === 'buildable' && (
                    <>
                        <Label className="mt-4 mb-2">Staircasing Method</Label>
                        <p className="text-sm text-gray-400 mb-2">Select which staircasing method you want to use. These are very different in both the result, and how easy they are to build in survival. Make sure to read about them.</p>
                        <div className="flex gap-2 w-full relative box-border">
                            <div className="flex-1 min-w-0">
                                <ComboBox
                                    items={Object.values(StaircasingMode)}
                                    value={staircasingMode}
                                    onChange={e => setStaircasingMode(e as StaircasingMode)}
                                    getDisplayName={v => StaircasingModes[v as StaircasingMode].title.replace('%s', maxHeight.toString())}
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
                            {(staircasingMode === StaircasingMode.VALLEY_CUSTOM || staircasingMode === StaircasingMode.STANDARD_CUSTOM) && (
                                <div className="flex-none w-15">
                                    <InputField value={maxHeight} onChange={e => setMaxHeight(parseInt(e))} variant="number" min={3} />
                                </div>
                            )}
                        </div>

                        <Separator className="my-4" />
                    </>
                )}

                <Label className="mt-4 mb-2">Color Matching</Label>
                <p className="text-sm text-gray-400 mb-2">Select which color matching algorithm you want to use, this settings is mostly for advanced users, allowing a more accurate end result.</p>
                <ComboBox
                    items={Object.values(ColorDistanceMethod)}
                    value={colorDistanceMethod}
                    onChange={e => setColorDistanceMethod(e as ColorDistanceMethod)}
                    getDisplayName={v => ColorDistanceMethods[v as ColorDistanceMethod].title}
                    renderItem={v => ColorDistanceMethods[v as ColorDistanceMethod].badge}
                    getTooltip={v => ColorDistanceMethods[v as ColorDistanceMethod].description}
                />

                <Label className="mt-4 mb-2">Dithering Method</Label>
                <p className="text-sm text-gray-400 mb-2">Select which dithering method you want to use, making the image look a lot smoother. Test your way to something you like!</p>
                <ComboBox
                    items={Object.keys(ditheringMethods)}
                    value={ditheringMethod}
                    onChange={e => setDitheringMethod(e as DitheringMethodName)}
                    getDisplayName={v => ditheringMethods[v as DitheringMethodName].name}
                    getTooltip={v => ditheringMethods[v as DitheringMethodName].description}
                />

                <Separator className="my-4" />

                {outputMode === 'buildable' && (
                    <>
                        <Label className="mt-4 mb-2">Support Blocks</Label>
                        <p className="text-sm text-gray-400 mb-2">Select how you&#39;d like support blocks in the schematic output, this can make it easier to build it in survival.</p>
                        <ComboBox
                            items={Object.values(SupportBlockMode)}
                            value={supportMode}
                            onChange={e => setSupportMode(e as SupportBlockMode)}
                            getDisplayName={v => v === SupportBlockMode.NONE ? 'None' : v === SupportBlockMode.THIN ? 'All (Thin)' : 'All (Heavy)'}
                        />
                        {supportMode !== SupportBlockMode.NONE && (
                            <div className="mt-3">
                                <InputField label="Support Block" value={supportBlockName} onChange={setSupportBlockName} variant="text" placeholder="e.g. netherrack" />
                            </div>
                        )}
                        <Separator className="my-4" />
                    </>
                )}

                <p className="font-semibold mb-1">Image Preprocessing</p>
                <p className="text-sm text-gray-400 mb-4">Here you can preprocess the image, potentially making a better end result.</p>

                <div className="space-y-4">
                    <div>
                        <Label>Brightness: <span className="text-muted-foreground">{brightness}%</span></Label>
                        <Slider value={[brightness]} onValueChange={v => setBrightness(v[0])} min={0} max={200} step={1} className="mt-2" />
                    </div>
                    <div>
                        <Label>Contrast: <span className="text-muted-foreground">{contrast}%</span></Label>
                        <Slider value={[contrast]} onValueChange={v => setContrast(v[0])} min={0} max={200} step={1} className="mt-2" />
                    </div>
                    <div>
                        <Label>Saturation: <span className="text-muted-foreground">{saturation}%</span></Label>
                        <Slider value={[saturation]} onValueChange={v => setSaturation(v[0])} min={0} max={200} step={1} className="mt-2" />
                    </div>

                    <Label className="m-0 mb-1 mt-2">Crop Mode:</Label>
                    <p className="text-sm text-gray-400 mb-2">Here you can choose which crop mode you want, either Scale & Crop, which will maintain aspect ratio, or stretch.</p>
                    <Tabs value={cropMode} onValueChange={v => setCropMode(v as CropMode)}>
                        <TabsList>
                            <TabsTrigger value={CropMode.SCALE_CROP}>Scale &amp; Crop</TabsTrigger>
                            <TabsTrigger value={CropMode.STRETCH}>Stretch</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {needsXOffset && (
                        <div>
                            <Label>Horizontal Position: <span className="text-muted-foreground">{xOffset}%</span></Label>
                            <Slider value={[xOffset]} onValueChange={v => setXOffset(v[0])} min={0} max={100} step={1} className="mt-2" />
                        </div>
                    )}
                    {needsYOffset && (
                        <div>
                            <Label>Vertical Position: <span className="text-muted-foreground">{yOffset}%</span></Label>
                            <Slider value={[yOffset]} onValueChange={v => setYOffset(v[0])} min={0} max={100} step={1} className="mt-2" />
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}