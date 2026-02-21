'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Dot, Download, Loader2, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ImageObj from 'next/image';
import { useQueryState } from 'nuqs';
import { enumParser } from '@/lib/urlParsers';
import { findImageAsset, getImageAsset } from '@/lib/images/getImageAsset';
import { toTitleCase } from '@/lib/StringUtils';
import { formatItemCount } from '@/lib/utils';

import { export3d, exportPNG } from '@/app/generators/mapart/exporting';
import { exportMapDat } from '@/app/generators/mapart/utils/datExport';
import { ALIASES, BASE_COLORS, BLOCK_GROUPS, getEverythingBlockSelection, getMaterialList, Preset, Presets, scaleRGB } from '@/app/generators/mapart/utils/constants';
import { BlockSelection, Brightness, ProcessingStats, SupportBlockMode } from '@/app/generators/mapart/utils/types';
import { numberToHex } from '@/app/generators/mapart/color/matching';
import type { WorkerRequest, WorkerResponse } from '@/app/generators/mapart/mapart.worker';
import { PreviewCard } from '@/app/generators/mapart/PreviewCard';
import { ComboBox } from '@/components/inputs/dropdowns/ComboBox';
import { useSettings } from './useSettings';
import { useImagePreprocessing } from './useImagePreprocessing';
import SettingsCard from './SettingsCard';
import presetsData from './inputs/presets.json';

import './mapart.css';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

const modeParser = enumParser(['buildable', 'dat']).withDefault('buildable');

export default function MapartGenerator() {
    const [outputMode, setOutputMode] = useQueryState('mode', modeParser);

    const { settings, setters } = useSettings();

    const [image, setImage] = useState<string | null>(null);
    const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [preprocessedCanvas, setPreprocessedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [brightnessMap, setBrightnessMap] = useState<Brightness[][] | null>(null);
    const [groupIdMap, setGroupIdMap] = useState<number[][] | null>(null);
    const [yMap, setYMap] = useState<number[][] | null>(null);
    const [colorBytes, setColorBytes] = useState<Uint8Array | null>(null);

    const { needsXOffset, needsYOffset } = useImagePreprocessing({
        sourceImage: sourceImageElement,
        settings,
        onProcessed: setPreprocessedCanvas,
    });

    const preprocessedImageUrl = useMemo(() => preprocessedCanvas?.toDataURL() ?? null, [preprocessedCanvas]);

    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getEverythingBlockSelection());
    const [currentPreset, setCurrentPreset] = useState('Everything');
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
    const presetInputRef = useRef<HTMLInputElement>(null);
    const expandedRef = useRef<HTMLDivElement | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const worker = new Worker(new URL('./mapart.worker.ts', import.meta.url));
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (data.requestId !== requestIdRef.current) return;
            if (data.type === 'error') { console.error('Worker error:', data.message); setIsProcessing(false); return; }

            const { buffer, width, height, brightnessMap, groupIdMap, yMap, colorBytesBuffer } = data;
            const uniqueGroups = new Set<number>();
            for (const row of groupIdMap) for (const id of row) uniqueGroups.add(id);

            setProcessingStats({ width, height, totalBlocks: width * height, uniqueBlocks: uniqueGroups.size });
            setProcessedImageData(new ImageData(new Uint8ClampedArray(buffer), width, height));
            setBrightnessMap(brightnessMap);
            setGroupIdMap(groupIdMap);
            setYMap(yMap);
            setColorBytes(colorBytesBuffer ? new Uint8Array(colorBytesBuffer) : null);
            setIsProcessing(false);
        };
        worker.onerror = err => { console.error('Worker threw:', err); setIsProcessing(false); };
        workerRef.current = worker;
        return () => { worker.terminate(); workerRef.current = null; };
    }, []);

    const enabledGroupsKey = Object.entries(blockSelection)
        .filter(([, v]) => v !== null).map(([k]) => k).sort().join(',');
    const debouncedEnabledGroupsKey = useDebounce(enabledGroupsKey, 400);

    const postToWorker = useCallback((canvas: HTMLCanvasElement, enabledGroups: number[]) => {
        if (!workerRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const requestId = ++requestIdRef.current;
        setIsProcessing(true);

        const buffer: ArrayBuffer = imageData.data.buffer.slice(0);
        const message: WorkerRequest = {
            requestId, buffer, width, height, enabledGroups,
            ditheringMethod: settings.ditheringMethod,
            staircasingMode: settings.staircasingMode,
            colorMethod: settings.colorDistanceMethod,
            maxHeight: settings.maxHeight,
            datMode: outputMode === 'dat',
        };
        workerRef.current.postMessage(message, [buffer]);
    }, [settings.ditheringMethod, settings.staircasingMode, settings.colorDistanceMethod, settings.maxHeight, outputMode]);

    useEffect(() => {
        if (!preprocessedCanvas) return;
        const enabledGroups = debouncedEnabledGroupsKey
            ? debouncedEnabledGroupsKey.split(',').map(Number)
            : Array.from({ length: BLOCK_GROUPS.length }, (_, i) => i);
        if (Object.keys(blockSelection).length === 0) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        postToWorker(preprocessedCanvas, enabledGroups);
    }, [preprocessedCanvas, debouncedEnabledGroupsKey, postToWorker]);

    const handleFileUpload = (file: File | null) => {
        if (!file?.type.startsWith('image/')) return;
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const url = canvas.toDataURL('image/png');
                const flat = new Image();
                flat.onload = () => { setSourceImageElement(flat); setImage(url); setIsUploading(false); };
                flat.src = url;
            };
            img.src = e.target?.result as string;
            setProcessingStats(null); setProcessedImageData(null);
            setBrightnessMap(null); setGroupIdMap(null); setYMap(null); setColorBytes(null);
        };
        reader.readAsDataURL(file);
    };

    const handleReset = () => {
        setImage(null); setSourceImageElement(null); setPreprocessedCanvas(null);
        setProcessingStats(null); setProcessedImageData(null);
        setBrightnessMap(null); setGroupIdMap(null); setYMap(null); setColorBytes(null);
        setIsProcessing(false); requestIdRef.current++;
    };

    const applyPreset = (presetName: string) => {
        if (presetName === 'Custom') return;
        if (presetName === 'Everything') { setBlockSelection(getEverythingBlockSelection()); setCurrentPreset(presetName); return; }
        const preset = presetsData[presetName as Preset];
        if (!preset) return;
        const newSelection: BlockSelection = {};
        Object.entries(preset).forEach(([groupId, blockName]) => { newSelection[parseInt(groupId) - 1] = blockName as string; });
        setBlockSelection(newSelection);
        setCurrentPreset(presetName);
    };

    const handleExportPreset = () => {
        const name = currentPreset === 'Custom' ? 'My_Preset' : currentPreset;
        const blob = new Blob([JSON.stringify({ [name]: blockSelection }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name.toLowerCase()}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportPreset = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                const presetName = Object.keys(imported)[0];
                const newSelection: BlockSelection = {};
                Object.entries(imported[presetName]).forEach(([groupId, blockName]) => { newSelection[parseInt(groupId)] = blockName as string; });
                setBlockSelection(newSelection);
                setCurrentPreset(presetName);
            } catch { alert('Invalid preset file'); }
        };
        reader.readAsText(file);
    };

    const toggleBlockSelection = useCallback((groupId: number, blockName: string | null) => {
        setCurrentPreset('Custom');
        setBlockSelection(prev => {
            if (blockName === null || prev[groupId] === blockName) { const next = { ...prev }; delete next[groupId]; return next; }
            return { ...prev, [groupId]: blockName };
        });
    }, []);

    useEffect(() => {
        if (expandedGroup === null) return;
        const onClickOutside = (e: MouseEvent) => { if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) setExpandedGroup(null); };
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedGroup(null); };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('mousedown', onClickOutside); document.removeEventListener('keydown', onKeyDown); };
    }, [expandedGroup]);

    const materialList = useMemo(() => {
        if (!brightnessMap || !groupIdMap || !yMap || outputMode === 'dat') return [];
        return getMaterialList(brightnessMap, groupIdMap, yMap, settings.supportMode, settings.mapWidth);
    }, [brightnessMap, groupIdMap, yMap, settings.supportMode, settings.mapWidth]); // dont add outputMode

    const gridClass = !image ? 'grid-start' : outputMode === 'dat' ? 'grid-dat' : 'grid-full';

    return (
        <div className="grid-parent">
            <Tabs value={outputMode} onValueChange={v => setOutputMode(v === 'dat' ? v : 'buildable')} className="w-full mb-4 max-w-150 mx-auto">
                <TabsList className="w-full">
                    <TabsTrigger value="buildable">Buildable</TabsTrigger>
                    <TabsTrigger value="dat">Map (.dat) file</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className={`grid-handler ${gridClass}`}>

                <Card id="upload-image">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Upload Image
                            {isUploading && <Loader2 className="animate-spin" size={16} />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isUploading ? 'opacity-60 pointer-events-none' : isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}`}
                            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-sm text-muted-foreground">Loading image…</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto mb-2" size={32} />
                                    <p className="text-sm">Drop image or click to browse</p>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*"
                                   onChange={e => handleFileUpload(e.target.files?.[0] || null)} className="hidden" />
                        </div>
                    </CardContent>
                </Card>

                {image && (
                    <>
                        <SettingsCard
                            outputMode={outputMode}
                            settings={settings}
                            setters={setters}
                            needsXOffset={needsXOffset}
                            needsYOffset={needsYOffset}
                        />

                        <Card id="exporting">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Exporting
                                    {isProcessing && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {outputMode === 'buildable' ? (
                                    <>
                                        <div className="flex gap-2 w-full">
                                            <Button className="flex-1" disabled={!processingStats || isProcessing}
                                                    onClick={() => export3d(processedImageData, processingStats, settings.mapWidth, settings.mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, settings.staircasingMode, settings.supportMode, settings.supportBlockName, false)}>
                                                <Download className="mr-2" size={16} />Export NBT
                                            </Button>
                                            {(settings.mapHeight > 1 || settings.mapWidth > 1) && (
                                                <Button className="flex-1" disabled={!processingStats || isProcessing}
                                                        onClick={() => export3d(processedImageData, processingStats, settings.mapWidth, settings.mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, settings.staircasingMode, settings.supportMode, settings.supportBlockName, true)}>
                                                    <Download className="mr-2" size={16} />Export NBT (Split 1x1 .zip)
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-300 mb-3">NBT files can be previewed in 3D with Litematica, or pasted directly with Worldedit or Structure Blocks.</p>
                                        <div className="flex gap-2 w-full">
                                            <Button className="flex-1" variant="secondary" disabled={!processingStats || isProcessing} onClick={() => exportPNG(processedImageData, processingStats, settings.mapWidth, settings.mapHeight)}>
                                                <Download className="mr-2" size={16} />Export PNG
                                            </Button>
                                            <Button className="flex-1" variant="destructive" onClick={handleReset}>
                                                <RotateCcw className="mr-2" size={16} />Reset
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-300">Export as PNG for a plain image, or Reset to start over.</p>
                                    </>
                                ) : (
                                    <>
                                        <Button className="w-full" disabled={!processingStats || isProcessing || !colorBytes}
                                                onClick={() => { if (colorBytes && processingStats) exportMapDat(colorBytes, processingStats.width, settings.mapWidth, settings.mapHeight); }}>
                                            <Download className="mr-2" size={16} />
                                            {settings.mapWidth === 1 && settings.mapHeight === 1 ? 'Export map_0.dat' : `Export ${settings.mapWidth * settings.mapHeight} .dat files (.zip)`}
                                        </Button>
                                        <p className="text-xs text-gray-300 mb-2">
                                            Place the <code>.dat</code> file(s) in your world&apos;s <code>data/</code> folder and run
                                            <code> /give @p minecraft:filled_map[map_id=0]</code>. Maps are numbered left → right, top → bottom.
                                        </p>
                                        <Button className="w-full" variant="destructive" onClick={handleReset}>
                                            <RotateCcw className="mr-2" size={16} />Reset
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card id="palette">
                            <CardHeader>
                                <CardTitle>Block Palette</CardTitle>
                                <CardDescription>{Object.keys(blockSelection).length} / 61 colors enabled</CardDescription>
                                <div className="flex gap-2 mt-4">
                                    <div className="flex-1">
                                        <ComboBox items={[...Presets]} value={currentPreset} onChange={applyPreset} />
                                    </div>
                                    <Button variant="outline" onClick={handleExportPreset}><Download size={14} /></Button>
                                    <Button variant="outline" onClick={() => presetInputRef.current?.click()}><Upload size={14} /></Button>
                                    <input ref={presetInputRef} type="file" accept=".json" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportPreset(f); }} className="hidden" />
                                </div>
                            </CardHeader>
                            <CardContent className="max-h-125 space-y-2 overflow-y-auto">
                                {BLOCK_GROUPS.map((group, groupId) => (
                                    <PaletteGroup
                                        key={groupId}
                                        group={group}
                                        groupId={groupId}
                                        selectedBlock={blockSelection[groupId] ?? null}
                                        toggleBlockSelection={toggleBlockSelection}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <PreviewCard
                            isProcessing={isProcessing}
                            processedImageData={processedImageData}
                            processingStats={processingStats}
                            groupIdMap={groupIdMap}
                            blockSelection={blockSelection}
                            sourceImage={preprocessedImageUrl}
                            outputMode={outputMode}
                        />

                        {outputMode === 'buildable' && materialList.length > 0 && (
                            <Card className="gap-2" id="material-list">
                                <CardHeader>
                                    <CardTitle>Material List</CardTitle>
                                    <CardDescription>Click on materials to edit them.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <Separator />
                                        <p className="flex text-gray-400 mt-2 mb-1">Stats: {processingStats?.uniqueBlocks} materials <Dot /> {processingStats?.totalBlocks} blocks</p>
                                        <Separator />
                                        <div className="space-y-2 overflow-y-auto mt-1 max-h-135">
                                            {materialList.map((material, idx) => {
                                                if (material.groupId === -1) {
                                                    const imageName = '2d_' + (settings.supportBlockName in ALIASES ? ALIASES[settings.supportBlockName] : settings.supportBlockName);
                                                    return (
                                                        <div key="support">
                                                            <div className="flex items-center justify-between p-2 border rounded-md mr-2">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                                                                    <ImageObj src={findImageAsset(imageName, 'block')} alt={settings.supportBlockName} width={16} height={16} className="h-full w-auto image-pixelated" />
                                                                    <span className="truncate text-xs">{toTitleCase(settings.supportBlockName, true)} (support)</span>
                                                                </div>
                                                                <span className="font-mono text-xs shrink-0">{formatItemCount(material.count)}</span>
                                                            </div>
                                                            <Separator className="mt-2" />
                                                        </div>
                                                    );
                                                }

                                                const selectedBlock = blockSelection[material.groupId] as string;
                                                if (!selectedBlock) return null;
                                                const imageName = "2d_" + (selectedBlock in ALIASES ? ALIASES[selectedBlock] : selectedBlock);
                                                const isExpanded = expandedGroup === material.groupId;

                                                return (
                                                    <div key={idx}>
                                                        {!isExpanded ? (
                                                            <div className="flex items-center justify-between p-2 border rounded-md mr-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setExpandedGroup(material.groupId); }}>
                                                                <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                                                                    <ImageObj src={findImageAsset(imageName, "block")} alt={selectedBlock} width={16} height={16} className="h-full w-auto image-pixelated aspect-ratio" />
                                                                    <span className="truncate text-xs">{toTitleCase(selectedBlock, true)}</span>
                                                                </div>
                                                                <span className="font-mono text-xs shrink-0">{formatItemCount(material.count)}</span>
                                                            </div>
                                                        ) : (
                                                            <div ref={expandedRef} className="mt-1 border p-2 rounded-md">
                                                                <Label className="mb-2 ml-1 mt-1">Select which material to use:</Label>
                                                                <InlineGroupSwitch
                                                                    group={BLOCK_GROUPS[material.groupId]}
                                                                    selectedBlock={blockSelection[material.groupId] ?? null}
                                                                    callback={(gId, block) => {
                                                                        setExpandedGroup(null);
                                                                        if (selectedBlock !== block) toggleBlockSelection(gId, block ? block : selectedBlock);
                                                                    }}
                                                                    groupId={material.groupId}
                                                                    open={true}
                                                                    removeBtn={true}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface PaletteGroupProps {
    group: string[];
    groupId: number;
    selectedBlock: string | null;
    toggleBlockSelection: (groupId: number, blockName: string | null) => void;
}

const PaletteGroup = memo(function PaletteGroup({ group, groupId, selectedBlock, toggleBlockSelection }: PaletteGroupProps) {
    const [open, setOpen] = useState(false);

    const baseColor = BASE_COLORS[groupId];
    const normalHex = numberToHex(scaleRGB(baseColor, Brightness.NORMAL));
    const lightHex = numberToHex(scaleRGB(baseColor, Brightness.LOW));
    const highHex = numberToHex(scaleRGB(baseColor, Brightness.HIGH));
    const selectedIndex = selectedBlock != null ? group.indexOf(selectedBlock) : -1;

    return (
        <div className="border rounded p-2">
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex">
                    {groupId !== 11 && (
                        <>
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: lightHex }} />
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: normalHex }} />
                        </>
                    )}
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: highHex }} />
                </div>
                <span>Group {groupId + 1}</span>
                <div className="flex gap-2 items-center">
                    <Dot />
                    <span>{group.length > 5 && `${open ? group.length : (5 + (selectedIndex > 4 ? 1 : 0))} /`} {group.length} blocks</span>
                    {group.length > 5 && (
                        <Button onClick={() => setOpen(o => !o)} variant="secondary" className="h-6 mr-4 px-2 text-xs">
                            {open ? <p className="flex gap-2">Hide<ChevronUp /></p> : <p className="flex gap-2">Show<ChevronDown /></p>}
                        </Button>
                    )}
                </div>
            </div>
            <InlineGroupSwitch
                group={group}
                selectedBlock={selectedBlock}
                callback={toggleBlockSelection}
                groupId={groupId}
                open={open}
            />
        </div>
    );
});

interface InlineGroupSwitchProps {
    group: string[];
    selectedBlock: string | null;
    callback: (groupId: number, blockName: string | null) => void;
    groupId: number;
    open: boolean;
    removeBtn?: boolean;
}

const InlineGroupSwitch = memo(function InlineGroupSwitch({ group, selectedBlock, callback, groupId, open, removeBtn = false }: InlineGroupSwitchProps) {
    return (
        <div className="flex flex-wrap gap-1">
            {removeBtn && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => { if (selectedBlock) callback(groupId, null); }} variant="outline" size="sm"
                                    className={`px-2 py-2 flex-col border h-auto ${!selectedBlock ? "inset-ring-2" : ""}`}>
                                <ImageObj src={getImageAsset("none")} alt="None" width={16} height={16} className="h-10 w-auto image-pixelated" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">Disable Group</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {group.map((blockName, idx) => {
                if (!(idx < (open ? group.length : Math.min(group.length, 5)) || selectedBlock === blockName)) return null;
                const isSelected = selectedBlock === blockName;
                const imageName = "2d_" + (blockName in ALIASES ? ALIASES[blockName] : blockName);
                return (
                    <TooltipProvider key={`${groupId}-${blockName}-${idx}`} delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => callback(groupId, blockName)} variant="outline" size="sm" className={`px-2 py-2 flex-col border h-auto ${isSelected ? "inset-ring-2" : ""}`}>
                                    <ImageObj src={findImageAsset(imageName, "block")} alt={blockName} width={16} height={16} className="h-10 w-10 image-pixelated" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="center">{toTitleCase(blockName, true)}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
});