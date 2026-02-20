'use client';

import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ChevronDown, ChevronUp, Dot, Download, Loader2, RotateCcw, Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {
    ALIASES,
    BASE_COLORS,
    BLOCK_GROUPS,
    BlockSelection,
    Brightness,
    ColorDistanceMethod,
    getEverythingBlockSelection,
    getMaterialList,
    MaterialCount,
    Preset,
    Presets,
    ProcessingStats,
    scaleRGB,
    StaircasingMode,
    SupportBlockMode
} from './utils/utils';
import {numberToHex} from './utils/colorMatching';
import {DitheringMethodName, ditheringMethods, DitheringMethods} from './utils/dithering';
import ImageObj from "next/image";
import {findImageAsset, getImageAsset} from "@/lib/images/getImageAsset";

import ImagePreprocessing from './ImagePreprocessing';
import {InputField} from "@/components/inputs/InputField";
import {ComboBox} from "@/components/inputs/dropdowns/ComboBox";
import {Separator} from "@/components/ui/separator";
import {toTitleCase} from "@/lib/StringUtils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import "./mapart.css"
import {export3d, exportPNG} from "@/app/generators/mapart/utils/exporting";
import presetsData from './inputs/presets.json';
import type {WorkerRequest, WorkerResponse} from './utils/mapart.worker';
import {PreviewCard} from "@/app/generators/mapart/PreviewCard";
import {formatItemCount} from "@/lib/utils";

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function MapartGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [mapWidth, setMapWidth] = useState(1);
    const [mapHeight, setMapHeight] = useState(1);
    const [isDragging, setIsDragging] = useState(false);

    const [ditheringMethod, setDitheringMethod] = useState<DitheringMethodName>(DitheringMethods.floyd_steinberg);
    const [staircasingMode, setStaircasingMode] = useState<StaircasingMode>(StaircasingMode.STANDARD);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.WEIGHTED_RGB);

    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getEverythingBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);

    const [supportMode, setSupportMode] = useState<SupportBlockMode>(SupportBlockMode.NONE);
    const [supportBlockName, setSupportBlockName] = useState('netherrack');
    const [maxHeight, setMaxHeight] = useState(3);

    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [brightnessMap, setBrightnessMap] = useState<Brightness[][] | null>(null);
    const [groupIdMap, setGroupIdMap] = useState<number[][] | null>(null);
    const [yMap, setYMap] = useState<number[][] | null>(null);

    const [preprocessedCanvas, setPreprocessedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const workerRef= useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const expandedRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const preprocessedImageUrl = useMemo(
        () => preprocessedCanvas?.toDataURL() ?? null,
        [preprocessedCanvas]
    );

    const enabledGroupsKey = Object.entries(blockSelection)
        .filter(([, v]) => v !== null)
        .map(([k]) => k)
        .sort()
        .join(',');

    const debouncedEnabledGroupsKey = useDebounce(enabledGroupsKey, 400);

    useEffect(() => {
        const worker = new Worker(new URL('./utils/mapart.worker.ts', import.meta.url));

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data;
            if (data.requestId !== requestIdRef.current) return;

            if (data.type === 'error') {
                console.error('Worker error:', data.message);
                setIsProcessing(false);
                return;
            }

            const { buffer, width, height, brightnessMap, groupIdMap, yMap } = data;
            const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
            const materials = getMaterialList(brightnessMap, groupIdMap);

            setMaterialList(materials);
            setProcessingStats({ width, height, totalBlocks: width * height, uniqueBlocks: materials.length });
            setProcessedImageData(imageData);
            setBrightnessMap(brightnessMap);
            setGroupIdMap(groupIdMap);
            setYMap(yMap);
            setIsProcessing(false);
        };

        worker.onerror = (err) => {
            console.error('Worker threw:', err);
            setIsProcessing(false);
        };

        workerRef.current = worker;
        return () => { worker.terminate(); workerRef.current = null; };
    }, []);

    const [currentPreset, setCurrentPreset] = useState<string>("Everything");
    const presetInputRef = useRef<HTMLInputElement>(null);

    const applyPreset = (presetName: string) => {
        if (presetName === "Custom") return;
        if (presetName === "Everything") {
            setBlockSelection(getEverythingBlockSelection())
            setCurrentPreset(presetName)
            return;
        }
        const preset = presetsData[presetName as Preset];
        if (!preset) return;
        const newSelection: BlockSelection = {};
        Object.entries(preset).forEach(([groupId, blockName]) => {
            newSelection[parseInt(groupId) - 1] = blockName as string;
        });
        setBlockSelection(newSelection);
        setCurrentPreset(presetName);
    };

    const handleExportPreset = () => {
        const presetName = currentPreset === "Custom" ? "My_Preset" : currentPreset;
        const blob = new Blob([JSON.stringify({ [presetName]: blockSelection }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presetName.toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportPreset = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                const presetName = Object.keys(imported)[0];
                const newSelection: BlockSelection = {};
                Object.entries(imported[presetName]).forEach(([groupId, blockName]) => {
                    newSelection[parseInt(groupId)] = blockName as string;
                });
                setBlockSelection(newSelection);
                setCurrentPreset(presetName);
            } catch {
                alert('Invalid preset file');
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        if (expandedGroup === null) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (expandedRef.current && !expandedRef.current.contains(e.target as Node))
                setExpandedGroup(null);
        };
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setExpandedGroup(null); };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [expandedGroup]);

    const postToWorker = useCallback((canvas: HTMLCanvasElement, enabledGroups: number[]) => {
        if (!workerRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const requestId = ++requestIdRef.current;

        setIsProcessing(true);

        const buffer = imageData.data.buffer.slice(0);
        const message: WorkerRequest = {
            requestId, buffer, width, height,
            enabledGroups,
            ditheringMethod, staircasingMode,
            colorMethod: colorDistanceMethod,
            maxHeight: maxHeight
        };
        workerRef.current.postMessage(message, [buffer]);
    }, [ditheringMethod, staircasingMode, colorDistanceMethod, maxHeight]);

    useEffect(() => {
        if (!preprocessedCanvas) return;

        const enabledGroups = debouncedEnabledGroupsKey
            ? debouncedEnabledGroupsKey.split(',').map(Number)
            : Array.from({ length: BLOCK_GROUPS.length }, (_, i) => i);
        if (Object.keys(blockSelection).length == 0) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        postToWorker(preprocessedCanvas, enabledGroups);
    }, [preprocessedCanvas, debouncedEnabledGroupsKey, postToWorker]); // do NOT add blockSelection


    const handleFileUpload = (file: File | null) => {
        if (!file?.type.startsWith('image/')) return;

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const imgSrc = e.target?.result as string;
            setImage(imgSrc);

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                const flattenedDataUrl = canvas.toDataURL('image/png');
                const flattenedImg = new Image();
                flattenedImg.onload = () => {
                    setSourceImageElement(flattenedImg);
                    setImage(flattenedDataUrl);
                    setIsUploading(false);
                };
                flattenedImg.src = flattenedDataUrl;
            };
            img.src = imgSrc;

            setProcessingStats(null);
            setMaterialList([]);
            setProcessedImageData(null);
            setBrightnessMap(null);
            setGroupIdMap(null);
            setYMap(null);
        };

        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files[0]);
    };

    const handleReset = () => {
        setImage(null);
        setSourceImageElement(null);
        setPreprocessedCanvas(null);
        setProcessingStats(null);
        setMaterialList([]);
        setProcessedImageData(null);
        setBrightnessMap(null);
        setGroupIdMap(null);
        setYMap(null);
        setIsProcessing(false);
        requestIdRef.current++;
    };

    const toggleBlockSelection = useCallback((groupId: number, blockName: string | null) => {
        setCurrentPreset("Custom");
        setBlockSelection(prev => {
            if (blockName === null || prev[groupId] === blockName) {
                const next = { ...prev };
                delete next[groupId];
                return next;
            }
            return { ...prev, [groupId]: blockName };
        });
    }, []);

    return (
        <div className="grid-parent">
            <div className={`grid-handler ${image ? "grid-full" : "grid-start"}`}>
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
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </div>
                    </CardContent>
                </Card>

                {image && (
                    <>
                        <ImagePreprocessing
                            sourceImage={sourceImageElement}
                            targetWidth={mapWidth * 128}
                            targetHeight={mapHeight * 128}
                            onProcessed={setPreprocessedCanvas}
                            id="preprocessing"
                        />

                        <Card id="settings">
                            <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField value={mapWidth} onChange={(e) => setMapWidth(parseInt(e))} max={20} min={1} variant="number" label="Map Width (X)" />
                                    <InputField value={mapHeight} onChange={(e) => setMapHeight(parseInt(e))} max={20} min={1} variant="number" label="Map Height (Y)" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-1">
                                    Total size: {mapWidth * 128}x{mapHeight * 128} pixels ({mapWidth}x{mapHeight} maps)
                                </p>

                                <Label className="mt-4 mb-2">Dithering Method</Label>
                                <ComboBox
                                    items={Object.keys(ditheringMethods)}
                                    value={ditheringMethod}
                                    onChange={(e) => setDitheringMethod(e as DitheringMethodName)}
                                    getDisplayName={(v) => {
                                        return ditheringMethods[v as DitheringMethodName].name
                                    }}
                                    getTooltip={(v) => {
                                        return ditheringMethods[v as DitheringMethodName].description
                                    }}
                                />

                                <Label className="mt-4 mb-2">Staircasing Method</Label>
                                <div className="flex gap-2 w-full relative box-border">
                                    <div className="flex-1 min-w-0">
                                        <ComboBox
                                            items={Object.values(StaircasingMode)}
                                            value={staircasingMode}
                                            onChange={(e) => setStaircasingMode(e as StaircasingMode)}
                                            getDisplayName={(v) =>
                                                v === StaircasingMode.NONE ? "Flat Map (2d)"
                                                : v === StaircasingMode.STANDARD ? "Classic" : v == StaircasingMode.STANDARD_CUSTOM ? `Classic Limited Height (${maxHeight})`
                                                : v === StaircasingMode.VALLEY ? "Valley" : `Valley Limited Height (${maxHeight})`
                                            }
                                        />
                                    </div>

                                    {(staircasingMode === StaircasingMode.VALLEY_CUSTOM || staircasingMode === StaircasingMode.STANDARD_CUSTOM) && (
                                        <div className="flex-none w-15">
                                            <InputField
                                                value={maxHeight}
                                                onChange={(e) => setMaxHeight(parseInt(e))}
                                                variant="number"
                                                min={3}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-4" />

                                <Label className="mt-4 mb-2">Support Blocks</Label>
                                <ComboBox
                                    items={Object.values(SupportBlockMode)}
                                    value={supportMode}
                                    onChange={(e) => setSupportMode(e as SupportBlockMode)}
                                    getDisplayName={(v) => v === SupportBlockMode.NONE ? 'None' : v === SupportBlockMode.THIN ? 'All (Thin)' : 'All (Heavy)'}
                                />

                                {supportMode !== SupportBlockMode.NONE && (
                                    <div className="mt-3">
                                        <InputField
                                            label="Support Block"
                                            value={supportBlockName}
                                            onChange={setSupportBlockName}
                                            variant="text"
                                            placeholder="e.g. netherrack"
                                        />
                                    </div>
                                )}

                                <Label className="mt-4 mb-2">Color Matching</Label>
                                <ComboBox
                                    items={Object.values(ColorDistanceMethod)} value={colorDistanceMethod}
                                    onChange={(e) => setColorDistanceMethod(e as ColorDistanceMethod)}
                                    getDisplayName={(v) => v === ColorDistanceMethod.WEIGHTED_RGB ? "Weighted RGB" : v === ColorDistanceMethod.EUCLIDEAN ? "Euclidean" : "Delta E"}
                                    renderItem={(v) => v === ColorDistanceMethod.WEIGHTED_RGB ? "Recommended" : v === ColorDistanceMethod.EUCLIDEAN ? "Fast" : "Perceptual"}
                                />
                            </CardContent>
                        </Card>

                        <Card id="exporting">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Exporting
                                    {isProcessing && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <div className="flex gap-2 w-full">
                                    <Button onClick={async () => await export3d(processedImageData, processingStats, mapWidth, mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, staircasingMode, supportMode, supportBlockName, false)} className="flex-1" disabled={!processingStats || isProcessing}>
                                        <Download className="mr-2" size={16} />Export NBT
                                    </Button>
                                    {(mapHeight > 1 || mapWidth > 1) && (
                                        <Button className="flex-1" disabled={!processingStats || isProcessing} onClick={
                                            async () => await export3d(processedImageData, processingStats, mapWidth, mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, staircasingMode, supportMode, supportBlockName, true)
                                        }>
                                            <Download className="mr-2" size={16} />Export NBT (Split in 1x1 .zip)
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-300 mb-3">You can use NBT files to preview them in 3d inside minecraft using Litematica, or paste them directly using Worldedit or Structure Blocks.</p>
                                <div className="flex gap-2 w-full">
                                    <Button className="flex-1" variant="secondary" onClick={async () => await exportPNG(processedImageData, processingStats, mapWidth, mapHeight)} disabled={!processingStats || isProcessing}>
                                        <Download className="mr-2" size={16} />Export PNG
                                    </Button>

                                    <Button onClick={handleReset} variant="destructive" className="flex-1">
                                        <RotateCcw className="mr-2" size={16} />Reset
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-300">If you want an image, you can export it as a PNG file. You can also press reset to clear everything inputted, or refresh the page.</p>
                            </CardContent>
                        </Card>

                        <Card id="palette">
                            <CardHeader>
                                <CardTitle>Block Palette</CardTitle>
                                <CardDescription className="space-y-2 text-sm">
                                    {Object.keys(blockSelection).length} / 61 colors enabled
                                </CardDescription>
                                <div className="flex gap-2 mt-4">
                                    <div className="flex-1">
                                        <ComboBox items={[...Presets]} value={currentPreset} onChange={(value) => applyPreset(value)} />
                                    </div>
                                    <Button variant="outline" onClick={handleExportPreset}><Download size={14} /></Button>
                                    <Button variant="outline" onClick={() => presetInputRef.current?.click()}><Upload size={14} /></Button>
                                    <input ref={presetInputRef} type="file" accept=".json"
                                           onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportPreset(f); }}
                                           className="hidden" />
                                </div>
                            </CardHeader>
                            <CardContent className="aspect-square space-y-2 overflow-y-auto">
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
                        />

                        {materialList.length > 0 && (
                            <Card className="gap-2" id="material-list">
                                <CardHeader>
                                    <CardTitle>Material List</CardTitle>
                                    <CardDescription>Click on materials to edit them.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <Separator />
                                        <p className="flex text-gray-400 mt-2 mb-1">Stats: {processingStats?.uniqueBlocks} materials<Dot />{processingStats?.totalBlocks} blocks</p>
                                        <Separator />
                                        <div className={`space-y-2 overflow-y-auto mt-1 ${supportMode == SupportBlockMode.NONE ? "max-h-90" : "max-h-105"}`}>
                                            {materialList.map((material, idx) => {
                                                const selectedBlock = blockSelection[material.groupId] as string;
                                                if (!selectedBlock) return null;
                                                const imageName = "2d_" + (selectedBlock in ALIASES ? ALIASES[selectedBlock] : selectedBlock);
                                                const isExpanded = expandedGroup === material.groupId;

                                                return (
                                                    <div key={idx}>
                                                        {!isExpanded ? (
                                                            <div className="flex items-center justify-between p-2 border rounded-md mr-2 cursor-pointer"
                                                                 onClick={(e) => { e.stopPropagation(); setExpandedGroup(material.groupId); }}>
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
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex">
                    {groupId !== 11 && (
                        <>
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: lightHex }} />
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: normalHex }} />
                        </>
                    )}
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: highHex }} />
                </div>
                <span>Group {groupId + 1}</span><Dot />
                <span>{group.length > 5 && `${open ? group.length : (5 + (selectedIndex > 4 ? 1 : 0))} /`} {group.length} blocks</span>
                {group.length > 5 && (
                    <Button onClick={() => setOpen(o => !o)} variant="secondary" className="h-6 mr-4 px-2 text-xs">
                        {open ? <p className="flex gap-2">Hide<ChevronUp /></p> : <p className="flex gap-2">Show<ChevronDown /></p>}
                    </Button>
                )}
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