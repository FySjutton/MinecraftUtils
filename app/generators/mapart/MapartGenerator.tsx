'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProcessingStats, BlockSelection, MaterialCount, ColorDistanceMethod, StaircasingMode } from './utils';
import { BLOCK_GROUPS, BASE_COLORS, getDefaultBlockSelection, ALIASES } from './utils';
import { numberToRGB } from './colorMatching';
import { rgbToHex, getMaterialList } from './utils';
import { processImage, extractBrightnessMap, countUniqueColors } from './imageProcessing';
import { calculate3DStructure } from './staircasing';
import { exportStructureNBT } from './nbtExport';
import { ZoomViewport } from './ZoomViewport';
import ImageObj from "next/image";
import { findImageAsset } from "@/lib/images/getImageAsset";

export default function MapArtGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [blockSize, setBlockSize] = useState(128);
    const [isDragging, setIsDragging] = useState(false);
    const [useDithering, setUseDithering] = useState(false);
    const [staircasingMode, setStaircasingMode] = useState<StaircasingMode>(StaircasingMode.NONE);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.WEIGHTED_RGB);
    const [showBlockSelector, setShowBlockSelector] = useState(false);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getDefaultBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [addSupportBlocks, setAddSupportBlocks] = useState(true);

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
        if (!image) return;

        setIsProcessing(true);

        setTimeout(() => {
            const img = new Image();

            img.onerror = () => setIsProcessing(false);

            img.onload = () => {
                try {
                    const enabledGroups = getEnabledGroups();

                    // Process image
                    const imageData = processImage(
                        img,
                        blockSize,
                        blockSize,
                        enabledGroups,
                        useDithering,
                        staircasingMode,
                        colorDistanceMethod
                    );

                    // Get stats
                    const uniqueColors = countUniqueColors(imageData);

                    setProcessingStats({
                        width: blockSize,
                        height: blockSize,
                        totalBlocks: blockSize * blockSize,
                        uniqueBlocks: uniqueColors
                    });

                    // Get material list
                    const canvas = document.createElement('canvas');
                    canvas.width = blockSize;
                    canvas.height = blockSize;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.putImageData(imageData, 0, 0);
                        const materials = getMaterialList(
                            canvas,
                            enabledGroups,
                            staircasingMode !== StaircasingMode.NONE,
                            colorDistanceMethod
                        );
                        setMaterialList(materials);
                    }

                    setProcessedImageData(imageData);
                    setIsProcessing(false);
                } catch (err) {
                    console.error('Processing error:', err);
                    setIsProcessing(false);
                }
            };

            img.src = image;
        }, 50);
    }, [image, blockSize, useDithering, staircasingMode, colorDistanceMethod, getEnabledGroups]);

    useEffect(() => {
        if (image) {
            handleProcessImage();
        }
    }, [image, handleProcessImage]);

    const handleFileUpload = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
                setProcessingStats(null);
                setMaterialList([]);
                setProcessedImageData(null);
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

    const handleExportPNG = () => {
        if (!processedImageData || !processingStats) return;

        const canvas = document.createElement('canvas');
        canvas.width = processingStats.width;
        canvas.height = processingStats.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.putImageData(processedImageData, 0, 0);

        const link = document.createElement('a');
        link.download = 'minecraft-map-art.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    const handleExport3D = () => {
        if (!processedImageData || !processingStats) return;

        const enabledGroups = getEnabledGroups();

        // Extract brightness and group maps
        const { brightnessMap, groupIdMap } = extractBrightnessMap(
            processedImageData,
            processingStats.width,
            processingStats.height,
            enabledGroups,
            staircasingMode !== StaircasingMode.NONE,
            colorDistanceMethod
        );

        // Calculate 3D structure
        const structure = calculate3DStructure(
            brightnessMap,
            groupIdMap,
            blockSelection,
            staircasingMode,
            addSupportBlocks,
            'netherrack'
        );

        // Export to NBT
        exportStructureNBT(structure, 'mapart-3d.nbt');
    };

    const handleReset = () => {
        setImage(null);
        setProcessingStats(null);
        setMaterialList([]);
        setIsProcessing(false);
        setProcessedImageData(null);
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
        <div className="container mx-auto p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
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

                    {image && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Map Size: {blockSize}x{blockSize}</Label>
                                    <Slider
                                        value={[blockSize]}
                                        onValueChange={(v) => setBlockSize(v[0])}
                                        min={32}
                                        max={256}
                                        step={32}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Staircasing Mode:</Label>
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="none"
                                                name="staircasingMode"
                                                checked={staircasingMode === StaircasingMode.NONE}
                                                onChange={() => setStaircasingMode(StaircasingMode.NONE)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="none" className="cursor-pointer font-normal">
                                                Flat (2D)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="standard"
                                                name="staircasingMode"
                                                checked={staircasingMode === StaircasingMode.STANDARD}
                                                onChange={() => setStaircasingMode(StaircasingMode.STANDARD)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="standard" className="cursor-pointer font-normal">
                                                Standard (3D)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="valley"
                                                name="staircasingMode"
                                                checked={staircasingMode === StaircasingMode.VALLEY}
                                                onChange={() => setStaircasingMode(StaircasingMode.VALLEY)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="valley" className="cursor-pointer font-normal">
                                                Valley <span className="text-xs text-muted-foreground">(descends only)</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="valley3"
                                                name="staircasingMode"
                                                checked={staircasingMode === StaircasingMode.VALLEY_3_LEVEL}
                                                onChange={() => setStaircasingMode(StaircasingMode.VALLEY_3_LEVEL)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="valley3" className="cursor-pointer font-normal">
                                                Valley (3-level) <span className="text-xs text-muted-foreground">(max 3 blocks)</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dithering"
                                        checked={useDithering}
                                        onCheckedChange={(checked) => setUseDithering(checked as boolean)}
                                    />
                                    <Label htmlFor="dithering">
                                        Enable Dithering
                                    </Label>
                                </div>

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

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Color Matching:</Label>
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="weighted"
                                                name="colorMethod"
                                                checked={colorDistanceMethod === ColorDistanceMethod.WEIGHTED_RGB}
                                                onChange={() => setColorDistanceMethod(ColorDistanceMethod.WEIGHTED_RGB)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="weighted" className="cursor-pointer font-normal">
                                                Weighted RGB <span className="text-xs text-muted-foreground">(Recommended)</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="euclidean"
                                                name="colorMethod"
                                                checked={colorDistanceMethod === ColorDistanceMethod.EUCLIDEAN}
                                                onChange={() => setColorDistanceMethod(ColorDistanceMethod.EUCLIDEAN)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="euclidean" className="cursor-pointer font-normal">
                                                Euclidean <span className="text-xs text-muted-foreground">(Fast)</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="deltaE"
                                                name="colorMethod"
                                                checked={colorDistanceMethod === ColorDistanceMethod.DELTA_E_2000}
                                                onChange={() => setColorDistanceMethod(ColorDistanceMethod.DELTA_E_2000)}
                                                className="cursor-pointer"
                                            />
                                            <Label htmlFor="deltaE" className="cursor-pointer font-normal">
                                                Delta E (LAB) <span className="text-xs text-muted-foreground">(Perceptual)</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
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

                    {materialList.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Material List</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 max-h-64 overflow-y-auto text-sm">
                                    {materialList.map((material, idx) => {
                                        const selectedBlock = blockSelection[material.groupId] || BLOCK_GROUPS[material.groupId]?.[0] || 'Unknown';
                                        const baseColor = BASE_COLORS[material.groupId];
                                        const rgb = numberToRGB(baseColor);
                                        const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);

                                        return (
                                            <div key={idx} className="flex items-center justify-between gap-2 p-2 border rounded">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div
                                                        className="w-4 h-4 rounded border shrink-0"
                                                        style={{ backgroundColor: hexColor }}
                                                    />
                                                    <span className="truncate text-xs">{selectedBlock.replace(/_/g, ' ')}</span>
                                                </div>
                                                <span className="font-mono text-xs shrink-0">{material.count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 border-t font-semibold flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-mono">{materialList.reduce((sum, m) => sum + m.count, 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle
                                className="cursor-pointer flex items-center justify-between"
                                onClick={() => setShowBlockSelector(!showBlockSelector)}
                            >
                                <span>Block Palette</span>
                                {showBlockSelector ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </CardTitle>
                        </CardHeader>
                        {showBlockSelector && (
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {BLOCK_GROUPS.map((group, groupId) => {
                                        const baseColor = BASE_COLORS[groupId];
                                        const rgb = numberToRGB(baseColor);
                                        const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b);

                                        return (
                                            <div key={groupId} className="border rounded p-2">
                                                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: hexColor }}
                                                    />
                                                    <span>Group {groupId}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.map((blockName, idx) => {
                                                        const isSelected = blockSelection[groupId] === blockName;
                                                        const uniqueKey = `${groupId}-${blockName}-${idx}`;
                                                        const imageName: string = "2d_" + (blockName in ALIASES ? ALIASES[blockName] : blockName);
                                                        return (
                                                            <Button
                                                                key={uniqueKey}
                                                                onClick={() => toggleBlockSelection(groupId, blockName)}
                                                                variant={isSelected ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                <ImageObj
                                                                    src={findImageAsset(imageName, "block")}
                                                                    alt={blockName}
                                                                    width={16}
                                                                    height={16}
                                                                />
                                                                {blockName.replace(/_/g, ' ')}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!image ? (
                                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">Upload an image to begin</p>
                                </div>
                            ) : isProcessing ? (
                                <div className="flex items-center justify-center h-96">
                                    <p>Processing...</p>
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
                </div>
            </div>
        </div>
    );
}