'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {Upload, Download, RotateCcw, ChevronDown, ChevronRight, ChevronUp, Dot} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    ProcessingStats,
    BlockSelection,
    MaterialCount,
    ColorDistanceMethod,
    StaircasingMode,
    Brightness,
    scaleRGB
} from './utils';
import { BLOCK_GROUPS, BASE_COLORS, getDefaultBlockSelection, ALIASES } from './utils';
import {numberToHex, numberToRGB} from './colorMatching';
import { rgbToHex, getMaterialList } from './utils';
import { processImage, extractBrightnessMap } from './imageProcessing';
import { calculate3DStructure } from './staircasing';
import { exportStructureNBT, exportStructureNBTToBlob } from './nbtExport';
import { ZoomViewport } from './ZoomViewport';
import { ditheringMethods, DitheringMethodName } from './dithering';
import ImageObj from "next/image";
import { findImageAsset } from "@/lib/images/getImageAsset";

import ImagePreprocessing from './ImagePreprocessing';
import {InputField} from "@/components/inputs/InputField";
import {ComboBox} from "@/components/inputs/dropdowns/ComboBox";
import {Separator} from "@/components/ui/separator";
import {toTitleCase} from "@/lib/StringUtils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export default function MapArtGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [mapWidth, setMapWidth] = useState(1);
    const [mapHeight, setMapHeight] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [ditheringMethod, setDitheringMethod] = useState<DitheringMethodName>('None');
    const [staircasingMode, setStaircasingMode] = useState<StaircasingMode>(StaircasingMode.NONE);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.WEIGHTED_RGB);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getDefaultBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [brightnessMap, setBrightnessMap] = useState<Brightness[][] | null>(null);
    const [groupIdMap, setGroupIdMap] = useState<number[][] | null>(null);
    const [yMap, setYMap] = useState<number[][] | null>(null);
    const [addSupportBlocks, setAddSupportBlocks] = useState(true);
    const [preprocessedCanvas, setPreprocessedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const getEnabledGroups = useCallback((): Set<number> => {
        const enabled = new Set<number>();
        Object.entries(blockSelection).forEach(([groupId, blockName]) => {
            if (blockName !== null) {
                enabled.add(parseInt(groupId));
            }
        });
        if (enabled.size === 0) {
            for (let i = 0; i < BLOCK_GROUPS.length; i++) {
                enabled.add(i);
            }
        }
        return enabled;
    }, [blockSelection]);

    const handleProcessImage = useCallback(() => {
        if (!preprocessedCanvas) return;

        setTimeout(() => {
            try {
                const enabledGroups = getEnabledGroups();
                const blockSize = mapWidth * 128;
                const blockHeight = mapHeight * 128;

                // Create image from preprocessed canvas
                const img = new Image();
                img.src = preprocessedCanvas.toDataURL();

                img.onload = () => {
                    const result = processImage(
                        img,
                        blockSize,
                        blockHeight,
                        enabledGroups,
                        ditheringMethod,
                        staircasingMode,
                        colorDistanceMethod
                    );

                    // Calculate materials from the maps returned by processImage
                    const materials = getMaterialList(result.brightnessMap, result.groupIdMap);
                    setMaterialList(materials);

                    setProcessingStats({
                        width: blockSize,
                        height: blockHeight,
                        totalBlocks: blockSize * blockHeight,
                        uniqueBlocks: materials.length
                    });

                    setProcessedImageData(result.imageData);
                    setBrightnessMap(result.brightnessMap);
                    setGroupIdMap(result.groupIdMap);
                    setYMap(result.yMap);
                    console.log('[MapArt UI] Processing complete');
                };

            } catch (err) {
                console.error('[MapArt UI] Processing error:', err);
            }
        }, 50);
    }, [preprocessedCanvas, mapWidth, mapHeight, ditheringMethod, staircasingMode, colorDistanceMethod, getEnabledGroups]);

    useEffect(() => {
        if (preprocessedCanvas) {
            handleProcessImage();
        }
    }, [preprocessedCanvas, handleProcessImage]);

    const handleFileUpload = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target?.result as string;
                setImage(imgSrc);

                // Create image element for preprocessing
                const img = new Image();
                img.onload = () => setSourceImageElement(img);
                img.src = imgSrc;

                setProcessingStats(null);
                setMaterialList([]);
                setProcessedImageData(null);
                setBrightnessMap(null);
                setGroupIdMap(null);
                setYMap(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    };

    const handleExportPNG = async () => {
        if (!processedImageData || !processingStats) return;

        const totalWidth = processingStats.width;
        const totalHeight = processingStats.height;

        // If single map, just export directly
        if (mapWidth === 1 && mapHeight === 1) {
            const canvas = document.createElement('canvas');
            canvas.width = totalWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.putImageData(processedImageData, 0, 0);

            const link = document.createElement('a');
            link.download = 'minecraft-map-art.png';
            link.href = canvas.toDataURL();
            link.click();
            return;
        }

        // Multiple maps - create zip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = totalWidth;
        sourceCanvas.height = totalHeight;
        const sourceCtx = sourceCanvas.getContext('2d');
        if (!sourceCtx) return;
        sourceCtx.putImageData(processedImageData, 0, 0);

        // Split into 128x128 chunks
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                const chunkCanvas = document.createElement('canvas');
                chunkCanvas.width = 128;
                chunkCanvas.height = 128;
                const chunkCtx = chunkCanvas.getContext('2d');
                if (!chunkCtx) continue;

                // Copy chunk from source
                const sx = col * 128;
                const sy = row * 128;
                chunkCtx.drawImage(sourceCanvas, sx, sy, 128, 128, 0, 0, 128, 128);

                // Convert to blob and add to zip
                const blob = await new Promise<Blob>((resolve) => {
                    chunkCanvas.toBlob((b) => resolve(b!), 'image/png');
                });

                zip.file(`map_${col}_${row}.png`, blob);
            }
        }

        // Generate and download zip
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = 'minecraft-map-art.zip';
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExport3D = async () => {
        if (!processedImageData || !processingStats || !brightnessMap || !groupIdMap || !yMap) return;

        // If single map, export directly
        if (mapWidth === 1 && mapHeight === 1) {
            const structure = calculate3DStructure(
                brightnessMap,
                groupIdMap,
                yMap,
                blockSelection,
                staircasingMode,
                addSupportBlocks,
                'netherrack'
            );
            exportStructureNBT(structure, 'mapart-3d.nbt');
            return;
        }

        // Multiple maps, create zip with NBT files
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                // Extract 128x128 chunk from maps
                const chunkBrightnessMap: Brightness[][] = [];
                const chunkGroupIdMap: number[][] = [];
                const chunkYMap: number[][] = [];

                for (let z = 0; z < 128; z++) {
                    const sourceZ = row * 128 + z;
                    chunkBrightnessMap[z] = [];
                    chunkGroupIdMap[z] = [];
                    chunkYMap[z] = [];

                    for (let x = 0; x < 128; x++) {
                        const sourceX = col * 128 + x;
                        chunkBrightnessMap[z][x] = brightnessMap[sourceZ][sourceX];
                        chunkGroupIdMap[z][x] = groupIdMap[sourceZ][sourceX];
                        chunkYMap[z][x] = yMap[sourceZ][sourceX];
                    }
                }

                const structure = calculate3DStructure(
                    chunkBrightnessMap,
                    chunkGroupIdMap,
                    chunkYMap,
                    blockSelection,
                    staircasingMode,
                    addSupportBlocks,
                    'netherrack'
                );

                // Export to memory instead of downloading
                const nbtData = exportStructureNBTToBlob(structure);
                zip.file(`map_${col}_${row}.nbt`, nbtData);
            }
        }

        // Generate and download zip
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = 'minecraft-map-art-3d.zip';
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
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
    };

    const toggleBlockSelection = (groupId: number, blockName: string) => {
        setBlockSelection(prev => {
            const current = prev[groupId];
            if (current === blockName) {
                const newSelection = { ...prev };
                delete newSelection[groupId];
                return newSelection;
            } else {
                return { ...prev, [groupId]: blockName };
            }
        });
    };

    return (
        <div className="flex gap-4 max-[800]:flex-col-reverse">
            <div className="w-1/2 space-y-4 max-[800]:w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                                isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                            }`}
                        >
                            <Upload className="mx-auto mb-2" size={32} />
                            <p className="text-sm">Drop image or click to browse</p>
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

                {image && sourceImageElement && (
                    <ImagePreprocessing
                        sourceImage={sourceImageElement}
                        targetWidth={mapWidth * 128}
                        targetHeight={mapHeight * 128}
                        onProcessed={setPreprocessedCanvas}
                    />
                )}

                {image && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    value={mapWidth}
                                    onChange={(e) => setMapWidth(Math.max(1, Math.min(10, parseInt(e) || 1)))}
                                    variant="number"
                                    label="Map Width (X)"
                                />
                                <InputField
                                    value={mapHeight}
                                    onChange={(e) => setMapHeight(Math.max(1, Math.min(10, parseInt(e) || 1)))}
                                    variant="number"
                                    label="Map Height (Y)"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-1">Total size: {mapWidth * 128}x{mapHeight * 128} pixels ({mapWidth}x{mapHeight} maps)</p>

                            <Label className="mt-4 mb-2">Dithering Method</Label>
                            <ComboBox
                                items={Object.keys(ditheringMethods)}
                                value={ditheringMethod}
                                onChange={(e) => setDitheringMethod(e as DitheringMethodName)}
                            />

                            <Label className="mt-4 mb-2">Staircasing Method</Label>
                            <ComboBox
                                items={Object.values(StaircasingMode)}
                                value={staircasingMode}
                                onChange={(e) => setStaircasingMode(e as StaircasingMode)}
                                getDisplayName={(v) => {
                                    return v == StaircasingMode.NONE ? "Flat Map (2d)" : (v == StaircasingMode.STANDARD ? "Staircasing 3d" : (v == StaircasingMode.VALLEY ? "Valley" : "Valley (Max 3)"))
                                }}
                                renderItem={(v) => {
                                    return v == StaircasingMode.VALLEY_3_LEVEL ? "Max 3 high" : ""
                                }}
                            />

                            <Separator className="my-4" />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="support"
                                    checked={addSupportBlocks}
                                    onCheckedChange={(checked) => setAddSupportBlocks(checked as boolean)}
                                />
                                <Label htmlFor="support">
                                    Add Support Blocks
                                </Label>
                            </div>

                            <Label className="mt-4 mb-2">Color Matching</Label>
                            <ComboBox
                                items={Object.values(ColorDistanceMethod)}
                                value={colorDistanceMethod}
                                onChange={(e) => setColorDistanceMethod(e as ColorDistanceMethod)}
                                getDisplayName={(v) => {
                                    return v == ColorDistanceMethod.WEIGHTED_RGB ? "Weighted RGB" : (v == ColorDistanceMethod.EUCLIDEAN ? "Euclidean" : "Delta E")
                                }}
                                renderItem={(v) => {
                                    return v == ColorDistanceMethod.WEIGHTED_RGB ? "Recommended" : (v == ColorDistanceMethod.EUCLIDEAN ? "Fast" : "Perceptual")
                                }}
                            />

                            <Separator className="my-4" />

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleExport3D} className="flex-1" disabled={!processingStats}>
                                    <Download className="mr-2" size={16} />
                                    Export NBT
                                </Button>
                                <Button onClick={handleExportPNG} className="flex-1" disabled={!processingStats}>
                                    <Download className="mr-2" size={16} />
                                    Export PNG
                                </Button>
                                <Button onClick={handleReset} variant="destructive" className="flex-1">
                                    <RotateCcw className="mr-2" size={16} />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {processingStats && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Dimensions:</span>
                                <span className="font-mono">{processingStats.width} x {processingStats.height}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Blocks:</span>
                                <span className="font-mono">{processingStats.totalBlocks.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Unique Colors:</span>
                                <span className="font-mono">{processingStats.uniqueBlocks}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Block Palette</CardTitle>
                        <CardDescription className="space-y-2 text-sm">
                            {Object.keys(blockSelection).length} / 61 colors enabled
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {BLOCK_GROUPS.map((group, groupId) => (
                                <PaletteGroup key={groupId} group={group} groupId={groupId} blockSelection={blockSelection} toggleBlockSelection={toggleBlockSelection} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="w-1/2 max-[800]:w-full overflow-hidden">
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!image ? (
                            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">Upload an image to begin</p>
                            </div>
                        ) : processedImageData && processingStats ? (
                            <ZoomViewport
                                cellWidth={processingStats.width}
                                cellHeight={processingStats.height}
                            >
                                <canvas
                                    width={processingStats.width}
                                    height={processingStats.height}
                                    style={{
                                        imageRendering: 'pixelated',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    ref={(canvas) => {
                                        if (canvas && processedImageData) {
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) {
                                                ctx.putImageData(processedImageData, 0, 0);
                                            }
                                        }
                                    }}
                                />
                            </ZoomViewport>
                        ) : null}
                    </CardContent>
                </Card>

                {materialList.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Material List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
                                {materialList.map((material, idx) => {
                                    const selectedBlock = blockSelection[material.groupId] || BLOCK_GROUPS[material.groupId]?.[0] || 'Unknown';
                                    const imageName: string = "2d_" + (selectedBlock in ALIASES ? ALIASES[selectedBlock] : selectedBlock);

                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2 border rounded-md mr-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                                                <ImageObj
                                                    src={findImageAsset(imageName, "block")}
                                                    alt={selectedBlock}
                                                    width={16}
                                                    height={16}
                                                    className="h-full w-auto image-pixelated aspect-ratio"
                                                />
                                                <span className="truncate text-xs">{toTitleCase(selectedBlock, true)}</span>
                                            </div>
                                            <span className="font-mono text-xs shrink-0">{material.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function PaletteGroup({group, groupId, blockSelection, toggleBlockSelection}: {group: string[], groupId: number, blockSelection: BlockSelection, toggleBlockSelection: (groupId: number, blockName: string) => void}) {
    const [open, setOpen] = useState(false);

    const baseColor = BASE_COLORS[groupId];

    const normalHex = numberToHex(scaleRGB(baseColor, Brightness.NORMAL));
    const lightHex = numberToHex(scaleRGB(baseColor, Brightness.LOW));
    const highHex = numberToHex(scaleRGB(baseColor, Brightness.HIGH));

    const selected = blockSelection[groupId]
    const selectedIndex = selected != null ? group.indexOf(selected) : -1

    return (
        <div key={groupId} className="border rounded p-2">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex">
                    {groupId != 11 && (
                        <>
                            <div className="w-4 h-4 rounded border" style={{backgroundColor: lightHex}}/>
                            <div className="w-4 h-4 rounded border" style={{backgroundColor: normalHex}}/>
                        </>
                    )}
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: highHex }}/>
                </div>

                <span>Group {groupId + 1}</span><Dot />
                <span>{group.length > 5 && `${open ? group.length : (5 + (selectedIndex > 4 ? 1 : 0))} /`} {group.length} blocks</span>
                {group.length > 5 && (
                    <Button onClick={() => setOpen(!open)} variant="secondary" className="h-6 mr-4 px-2 text-xs cursor-pointer">{open ?
                        <p className="flex gap-2">Hide<ChevronUp /></p> :
                        <p className="flex gap-2">Show<ChevronDown /></p>
                    }</Button>
                )}
            </div>
            <div className="flex flex-wrap gap-1">
                {group.map((blockName, idx) => {
                    if (!((idx < (open ? group.length : Math.min(group.length, 5))) || (selected == blockName))) return null
                    const isSelected = selected === blockName
                    const uniqueKey = `${groupId}-${blockName}-${idx}`
                    const imageName = "2d_" + (blockName in ALIASES ? ALIASES[blockName] : blockName)

                    return (
                        <TooltipProvider key={uniqueKey} delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => toggleBlockSelection(groupId, blockName)}
                                        variant="outline"
                                        size="sm"
                                        className={`px-2 py-2 flex-col border h-auto ${isSelected ? "inset-ring-2" : ""}`}
                                    >
                                        <ImageObj
                                            src={findImageAsset(imageName, "block")}
                                            alt={blockName}
                                            width={16}
                                            height={16}
                                            className="h-10 w-auto image-pixelated"
                                        />
                                    </Button>
                                </TooltipTrigger>

                                <TooltipContent side="bottom" align="center">
                                    {toTitleCase(blockName, true)}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </div>
        </div>
    );
}