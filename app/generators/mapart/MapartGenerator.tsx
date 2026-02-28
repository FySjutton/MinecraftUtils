'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dot, Download, Layers, Loader2, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageObj from 'next/image';
import { useQueryState } from 'nuqs';
import { enumParser } from '@/lib/urlParsers';
import { findImageAsset } from '@/lib/images/getImageAsset';
import { toTitleCase } from '@/lib/StringUtils';
import { formatItemCount } from '@/lib/utils';

import { export3d, exportPNG } from '@/app/generators/mapart/exporting';
import { exportMapDat } from '@/app/generators/mapart/utils/datExport';
import { ALIASES, BLOCK_GROUPS, getEverythingBlockSelection, getMaterialList, Preset, Presets } from '@/app/generators/mapart/utils/constants';
import { BlockSelection, Brightness, ProcessingStats } from '@/app/generators/mapart/utils/types';
import type { WorkerRequest, WorkerResponse } from '@/app/generators/mapart/mapart.worker';
import { PreviewCard } from '@/app/generators/mapart/PreviewCard';
import { ComboBox } from '@/components/inputs/dropdowns/ComboBox';
import { useSettings } from './useSettings';
import { useImagePreprocessing, CropMode } from './useImagePreprocessing';
import SettingsCard from './SettingsCard';
import presetsData from './inputs/presets.json';
import { MapArea, AREA_COLORS, areasOverlap } from './utils/areaTypes';
import { RawGlobalResult, buildAreaCanvas, mergeAreaResult, processWithAreaWorker, recomputeGlobalBrightness } from './utils/areaProcessing';
import { PaletteGroup, InlineGroupSwitch } from './PaletteComponents';
import { InputField } from '@/components/inputs/InputField';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import './mapart.css';

const TRANSPARENT_GROUP_ID = -2;

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

    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [brightnessMap, setBrightnessMap] = useState<Brightness[][] | null>(null);
    const [groupIdMap, setGroupIdMap] = useState<number[][] | null>(null);
    const [yMap, setYMap] = useState<number[][] | null>(null);
    const [colorBytes, setColorBytes] = useState<Uint8Array | null>(null);

    const preprocessedCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string | null>(null);
    const [cropOnlyImageUrl, setCropOnlyImageUrl] = useState<string | null>(null);

    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getEverythingBlockSelection());
    const [currentPreset, setCurrentPreset] = useState('Everything');
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
    const presetInputRef = useRef<HTMLInputElement>(null);
    const expandedRef = useRef<HTMLDivElement | null>(null);

    const [areas, setAreas] = useState<MapArea[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
    const rawGlobalResultRef = useRef<RawGlobalResult | null>(null);
    const [globalResultVersion, setGlobalResultVersion] = useState(0);
    const areaRequestIdRef = useRef(0);
    const areaWorkerRef = useRef<Worker | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

    const selectedArea = areas.find(a => a.id === selectedAreaId) ?? null;

    useEffect(() => {
        const worker = new Worker(new URL('./mapart.worker.ts', import.meta.url));
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (data.requestId !== requestIdRef.current) return;
            if (data.type === 'error') { console.error('Worker error:', data.message); setIsProcessing(false); return; }

            const { buffer, width, height, brightnessMap, groupIdMap, yMap, colorBytesBuffer } = data;

            const uniqueGroups = new Set<number>();
            let totalBlocks = 0;
            for (const row of groupIdMap) {
                for (const id of row) {
                    if (id !== TRANSPARENT_GROUP_ID) {
                        uniqueGroups.add(id);
                        totalBlocks++;
                    }
                }
            }

            rawGlobalResultRef.current = {
                pixelBuffer: new Uint8ClampedArray(buffer),
                width,
                height,
                brightnessMap,
                groupIdMap,
                yMap,
                colorBytes: colorBytesBuffer ? new Uint8Array(colorBytesBuffer) : null,
            };

            setProcessingStats({ width, height, totalBlocks, uniqueBlocks: uniqueGroups.size });
            setProcessedImageData(new ImageData(new Uint8ClampedArray(buffer), width, height));
            setBrightnessMap(brightnessMap);
            setGroupIdMap(groupIdMap);
            setYMap(yMap);
            setColorBytes(colorBytesBuffer ? new Uint8Array(colorBytesBuffer) : null);
            setIsProcessing(false);
            setGlobalResultVersion(v => v + 1);
        };

        worker.onerror = err => { console.error('Worker threw:', err); setIsProcessing(false); };
        workerRef.current = worker;
        return () => { worker.terminate(); workerRef.current = null; };
    }, []);

    useEffect(() => {
        const worker = new Worker(new URL('./mapart.worker.ts', import.meta.url));
        worker.onerror = err => console.error('Area worker threw:', err);
        areaWorkerRef.current = worker;
        return () => { worker.terminate(); areaWorkerRef.current = null; };
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

    const handlePreprocessed = useCallback((canvas: HTMLCanvasElement) => {
        preprocessedCanvasRef.current = canvas;
        setPreprocessedImageUrl(canvas.toDataURL());

        const enabledGroups = Object.entries(blockSelection)
            .filter(([, v]) => v !== null)
            .map(([k]) => Number(k));
        postToWorker(canvas, enabledGroups);
    }, [blockSelection, postToWorker]);

    const { needsXOffset, needsYOffset, cropOnlyCanvasRef, cropOnlyPixelCanvasRef } = useImagePreprocessing({
        sourceImage: sourceImageElement,
        settings,
        onProcessed: handlePreprocessed,
        onCropOnly: setCropOnlyImageUrl,
    });

    useEffect(() => {
        if (!preprocessedCanvasRef.current) return;
        const enabledGroups = debouncedEnabledGroupsKey
            ? debouncedEnabledGroupsKey.split(',').map(Number)
            : Array.from({ length: BLOCK_GROUPS.length }, (_, i) => i);
        if (Object.keys(blockSelection).length === 0) return;
        postToWorker(preprocessedCanvasRef.current, enabledGroups);
    }, [debouncedEnabledGroupsKey, postToWorker]);

    useEffect(() => {
        if (!rawGlobalResultRef.current || !cropOnlyCanvasRef.current) return;
        if (areas.length === 0) return;
        if (!areaWorkerRef.current) return;

        const global = rawGlobalResultRef.current;
        const mergedPixels = new Uint8ClampedArray(global.pixelBuffer);
        const mergedBrightness = global.brightnessMap.map(r => [...r]);
        const mergedGroupId = global.groupIdMap.map(r => [...r]);
        const mergedY = global.yMap.map(r => [...r]);
        const mergedColorBytes = global.colorBytes ? new Uint8Array(global.colorBytes) : null;

        let cancelled = false;
        setIsProcessing(true);

        (async () => {
            for (const area of areas) {
                if (cancelled) return;
                const areaCanvas = buildAreaCanvas(cropOnlyCanvasRef.current!, cropOnlyPixelCanvasRef.current, area, settings);
                const aW = area.chunkWidth * 16;
                const aH = area.chunkHeight * 16;
                const ctx = areaCanvas.getContext('2d')!;
                const imgData = ctx.getImageData(0, 0, aW, aH);
                const areaBuffer = imgData.data.buffer.slice(0) as ArrayBuffer;

                const areaGroups = area.overrides.blockSelection
                    ? Object.entries(area.overrides.blockSelection).filter(([, v]) => v !== null).map(([k]) => +k)
                    : Object.entries(blockSelection).filter(([, v]) => v !== null).map(([k]) => +k);

                const req: WorkerRequest = {
                    requestId: ++areaRequestIdRef.current,
                    buffer: areaBuffer,
                    width: aW,
                    height: aH,
                    enabledGroups: areaGroups,
                    ditheringMethod: area.overrides.ditheringMethod ?? settings.ditheringMethod,
                    staircasingMode: area.overrides.staircasingMode ?? settings.staircasingMode,
                    colorMethod: area.overrides.colorDistanceMethod ?? settings.colorDistanceMethod,
                    maxHeight: area.overrides.maxHeight ?? settings.maxHeight,
                    datMode: outputMode === 'dat',
                };

                try {
                    const result = await processWithAreaWorker(areaWorkerRef.current!, req);
                    if (cancelled) return;
                    mergeAreaResult(mergedPixels, mergedBrightness, mergedGroupId, mergedY, mergedColorBytes, {
                        pixelBuffer: new Uint8ClampedArray(result.buffer),
                        brightnessMap: result.brightnessMap,
                        groupIdMap: result.groupIdMap,
                        yMap: result.yMap,
                        colorBytes: result.colorBytesBuffer ? new Uint8Array(result.colorBytesBuffer) : null,
                    }, area, global.width);
                } catch (err) {
                    console.error('Area processing failed for', area.name, err);
                }
            }

            if (cancelled) return;

            recomputeGlobalBrightness(mergedPixels, mergedBrightness, mergedGroupId, mergedY, global.width, global.height);

            const uniqueGroups = new Set<number>();
            let totalBlocks = 0;
            for (const row of mergedGroupId) {
                for (const id of row) {
                    if (id !== TRANSPARENT_GROUP_ID) { uniqueGroups.add(id); totalBlocks++; }
                }
            }
            setProcessingStats({ width: global.width, height: global.height, totalBlocks, uniqueBlocks: uniqueGroups.size });
            setProcessedImageData(new ImageData(mergedPixels, global.width, global.height));
            setBrightnessMap(mergedBrightness);
            setGroupIdMap(mergedGroupId);
            setYMap(mergedY);
            setColorBytes(mergedColorBytes);
            setIsProcessing(false);
        })();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalResultVersion, areas]);

    const handleFileUpload = (file: File | null) => {
        if (!file?.type.startsWith('image/')) return;
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                setSourceImageElement(img);
                setImage(e.target?.result as string);
                setIsUploading(false);
            };
            img.src = e.target?.result as string;
            setProcessingStats(null); setProcessedImageData(null);
            setBrightnessMap(null); setGroupIdMap(null); setYMap(null); setColorBytes(null);
        };
        reader.readAsDataURL(file);
    };

    const handleReset = () => {
        setImage(null); setSourceImageElement(null); preprocessedCanvasRef.current = null;
        setPreprocessedImageUrl(null); setCropOnlyImageUrl(null);
        setProcessingStats(null); setProcessedImageData(null);
        setBrightnessMap(null); setGroupIdMap(null); setYMap(null); setColorBytes(null);
        setIsProcessing(false); requestIdRef.current++;
        rawGlobalResultRef.current = null;
        setAreas([]);
        setSelectedAreaId(null);
    };

    const applyPreset = (presetName: string) => {
        if (presetName === 'Custom') return;
        let newSelection: BlockSelection;
        if (presetName === 'Everything') {
            newSelection = getEverythingBlockSelection();
        } else {
            const preset = presetsData[presetName as Preset];
            if (!preset) return;
            newSelection = {};
            Object.entries(preset).forEach(([groupId, blockName]) => { newSelection[parseInt(groupId) - 1] = blockName as string; });
        }
        setBlockSelection(newSelection);
        setCurrentPreset(presetName);
    };

    const applyPresetToArea = (presetName: string, area: MapArea) => {
        if (presetName === 'Custom') return;
        let newSelection: BlockSelection;
        if (presetName === 'Everything') {
            newSelection = getEverythingBlockSelection();
        } else {
            const preset = presetsData[presetName as Preset];
            if (!preset) return;
            newSelection = {};
            Object.entries(preset).forEach(([groupId, blockName]) => { newSelection[parseInt(groupId) - 1] = blockName as string; });
        }
        setAreas(prev => prev.map(a => a.id === area.id
            ? { ...a, overrides: { ...a.overrides, blockSelection: newSelection } }
            : a
        ));
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
        if (selectedArea) {
            // Modify area's block selection override
            const currentSel = selectedArea.overrides.blockSelection ?? { ...blockSelection };
            const next = { ...currentSel };
            if (blockName === null || next[groupId] === blockName) delete next[groupId];
            else next[groupId] = blockName;
            setAreas(prev => prev.map(a => a.id === selectedArea.id
                ? { ...a, overrides: { ...a.overrides, blockSelection: next } }
                : a
            ));
        } else {
            setCurrentPreset('Custom');
            setBlockSelection(prev => {
                if (blockName === null || prev[groupId] === blockName) { const next = { ...prev }; delete next[groupId]; return next; }
                return { ...prev, [groupId]: blockName };
            });
        }
    }, [selectedArea, blockSelection]);

    useEffect(() => {
        if (expandedGroup === null) return;
        const onClickOutside = (e: MouseEvent) => { if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) setExpandedGroup(null); };
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedGroup(null); };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('mousedown', onClickOutside); document.removeEventListener('keydown', onKeyDown); };
    }, [expandedGroup]);

    const { materialList, totalBlocksWithSupport } = useMemo(() => {
        if (!brightnessMap || !groupIdMap || !yMap || outputMode === 'dat') {
            return { materialList: [], totalBlocksWithSupport: processingStats?.totalBlocks ?? 0 };
        }
        const list = getMaterialList(brightnessMap, groupIdMap, yMap, settings.supportMode, settings.noobLine);
        const total = list.reduce((sum, m) => sum + m.count, 0);
        return { materialList: list, totalBlocksWithSupport: total };
    }, [brightnessMap, groupIdMap, yMap, settings.supportMode, settings.noobLine, outputMode, processingStats?.totalBlocks]);

    const handleDraw = useCallback((newArea: MapArea) => {
        setAreas(prev => {
            if (prev.some(a => areasOverlap(a, newArea))) return prev;
            return [...prev, newArea];
        });
        setSelectedAreaId(newArea.id);
    }, []);

    const handleAreaChange = useCallback((updated: MapArea) => {
        setAreas(prev => prev.map(a => a.id === updated.id ? updated : a));
    }, []);

    const handleDeleteArea = (id: string) => {
        setAreas(prev => prev.filter(a => a.id !== id));
        if (selectedAreaId === id) setSelectedAreaId(null);
    };

    // Active block selection: area override if set, else global
    const activeBlockSelection: BlockSelection = selectedArea?.overrides.blockSelection ?? blockSelection;
    const isAreaMode = !!selectedArea;

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

                {/* Upload Image */}
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
                        {/* Map Setup card */}
                        <Card id="map-setup">
                            <CardHeader><CardTitle>Map Setup</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField value={settings.mapWidth} onChange={e => setters.setMapWidth(parseInt(e))} max={20} min={1} variant="number" label="Map Width (X)" />
                                    <InputField value={settings.mapHeight} onChange={e => setters.setMapHeight(parseInt(e))} max={20} min={1} variant="number" label="Map Height (Y)" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-1">
                                    Total size: {settings.mapWidth * 128}x{settings.mapHeight * 128} blocks ({settings.mapWidth}x{settings.mapHeight} maps)
                                </p>
                                <Separator className="my-4" />
                                <Label className="mb-2 block">Crop Mode</Label>
                                <p className="text-sm text-gray-400 mb-2">Choose how the image fits the map: maintain aspect ratio or stretch.</p>
                                <Tabs value={settings.cropMode} onValueChange={v => setters.setCropMode(v as CropMode)}>
                                    <TabsList>
                                        <TabsTrigger value={CropMode.SCALE_CROP}>Scale &amp; Crop</TabsTrigger>
                                        <TabsTrigger value={CropMode.STRETCH}>Stretch</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                {needsXOffset && (
                                    <div className="mt-4">
                                        <Label>Horizontal Position: <span className="text-muted-foreground">{settings.xOffset}%</span></Label>
                                        <Slider value={[settings.xOffset]} onValueChange={v => setters.setXOffset(v[0])} min={0} max={100} step={1} className="mt-2" />
                                    </div>
                                )}
                                {needsYOffset && (
                                    <div className="mt-4">
                                        <Label>Vertical Position: <span className="text-muted-foreground">{settings.yOffset}%</span></Label>
                                        <Slider value={[settings.yOffset]} onValueChange={v => setters.setYOffset(v[0])} min={0} max={100} step={1} className="mt-2" />
                                    </div>
                                )}
                                {outputMode === 'buildable' && (
                                    <>
                                        <Separator className="my-4" />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Noob Line</Label>
                                                <p className="text-sm text-gray-400 mt-1">Adds an extra row of blocks outside the north edge so the top row renders at the correct brightness.</p>
                                            </div>
                                            <Switch checked={settings.noobLine} onCheckedChange={setters.setNoobLine} />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Areas card */}
                        <Card id="areas">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers size={16} />
                                    Areas
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Select an area to override its settings. Use the draw tool on the preview to add areas.</p>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {/* Background (global) entry */}
                                <div
                                    className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border ${!selectedAreaId ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}
                                    onClick={() => setSelectedAreaId(null)}
                                >
                                    <div className="w-3 h-3 rounded-full bg-muted-foreground shrink-0" />
                                    <span className="text-sm flex-1">Background</span>
                                </div>

                                {areas.map(area => (
                                    <div
                                        key={area.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border group ${selectedAreaId === area.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}
                                        onClick={() => setSelectedAreaId(area.id)}
                                    >
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
                                        <span className="text-sm flex-1 truncate">{area.name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {area.chunkWidth}×{area.chunkHeight}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                                            onClick={e => { e.stopPropagation(); handleDeleteArea(area.id); }}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                ))}

                                {areas.length === 0 && (
                                    <p className="text-xs text-muted-foreground px-3 py-2">No areas yet. Use the pencil tool on the preview to draw areas.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Settings card */}
                        <SettingsCard
                            outputMode={outputMode}
                            settings={settings}
                            setters={setters}
                            selectedArea={selectedArea}
                            onAreaChange={handleAreaChange}
                        />

                        {/* Exporting card */}
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
                                                    onClick={() => export3d(processedImageData, processingStats, settings.mapWidth, settings.mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, settings.supportMode, settings.supportBlockName, false, settings.noobLine)}>
                                                <Download className="mr-2" size={16} />Export NBT
                                            </Button>
                                            {(settings.mapHeight > 1 || settings.mapWidth > 1) && (
                                                <Button className="flex-1" disabled={!processingStats || isProcessing}
                                                        onClick={() => export3d(processedImageData, processingStats, settings.mapWidth, settings.mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, settings.supportMode, settings.supportBlockName, true, settings.noobLine)}>
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

                        {/* Block Palette card */}
                        <Card id="palette">
                            <CardHeader>
                                <CardTitle>
                                    {isAreaMode ? `Block Palette — ${selectedArea.name}` : 'Block Palette'}
                                </CardTitle>
                                <CardDescription>
                                    {isAreaMode
                                        ? selectedArea.overrides.blockSelection
                                            ? `${Object.keys(selectedArea.overrides.blockSelection).length} / 61 overridden`
                                            : 'Inheriting global palette — toggle override to customize'
                                        : `${Object.keys(blockSelection).length} / 61 colors enabled`
                                    }
                                </CardDescription>
                                <div className="flex gap-2 mt-4">
                                    <div className={`flex-1 ${isAreaMode && !selectedArea.overrides.blockSelection ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <ComboBox
                                            items={[...Presets]}
                                            value={isAreaMode ? 'Custom' : currentPreset}
                                            onChange={p => isAreaMode ? applyPresetToArea(p, selectedArea) : applyPreset(p)}
                                        />
                                    </div>
                                    {!isAreaMode && (
                                        <>
                                            <Button variant="outline" onClick={handleExportPreset}><Download size={14} /></Button>
                                            <Button variant="outline" onClick={() => presetInputRef.current?.click()}><Upload size={14} /></Button>
                                            <input ref={presetInputRef} type="file" accept=".json" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportPreset(f); }} className="hidden" />
                                        </>
                                    )}
                                </div>
                                {isAreaMode && !selectedArea.overrides.blockSelection && (
                                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                        setAreas(prev => prev.map(a => a.id === selectedArea.id
                                            ? { ...a, overrides: { ...a.overrides, blockSelection: { ...blockSelection } } }
                                            : a
                                        ));
                                    }}>
                                        <Plus size={14} className="mr-1" />Override palette for this area
                                    </Button>
                                )}
                                {isAreaMode && selectedArea.overrides.blockSelection && (
                                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                        setAreas(prev => prev.map(a => {
                                            if (a.id !== selectedArea.id) return a;
                                            const next = { ...a.overrides };
                                            delete next.blockSelection;
                                            return { ...a, overrides: next };
                                        }));
                                    }}>
                                        Revert to global palette
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="max-h-125 space-y-2 overflow-y-auto">
                                {BLOCK_GROUPS.map((group, groupId) => (
                                    <PaletteGroup
                                        key={groupId}
                                        group={group}
                                        groupId={groupId}
                                        selectedBlock={activeBlockSelection[groupId] ?? null}
                                        toggleBlockSelection={toggleBlockSelection}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Preview card */}
                        <PreviewCard
                            isProcessing={isProcessing}
                            processedImageData={processedImageData}
                            processingStats={processingStats}
                            groupIdMap={groupIdMap}
                            blockSelection={blockSelection}
                            sourceImage={preprocessedImageUrl}
                            originalImage={cropOnlyImageUrl}
                            outputMode={outputMode}
                            noobLine={settings.noobLine}
                            totalBlocks={totalBlocksWithSupport}
                            areas={areas}
                            onDraw={handleDraw}
                            mapWidth={settings.mapWidth}
                            mapHeight={settings.mapHeight}
                        />

                        {/* Material List */}
                        {outputMode === 'buildable' && materialList.length > 0 && (
                            <Card className="gap-2" id="materials-list">
                                <CardHeader>
                                    <CardTitle>Material List</CardTitle>
                                    <CardDescription>Click on materials to edit them.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <Separator />
                                        <p className="flex text-gray-400 mt-2 mb-1">Stats: {processingStats?.uniqueBlocks} materials <Dot /> {totalBlocksWithSupport.toLocaleString()} blocks</p>
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
