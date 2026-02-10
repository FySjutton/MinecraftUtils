'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProcessingStats, BlockSelection, MaterialCount, ColorDistanceMethod } from './types';
import { BLOCK_GROUPS, BASE_COLORS, getDefaultBlockSelection } from './constants';
import { numberToRGB, rgbToHex, getMaterialList, findNearestMapColor } from './utils';
import { floydSteinbergDithering } from './dithering';
import { applyStaircasing } from './staircasing';
import { ZoomViewport } from './ZoomViewport';

export default function MapArtPage() {
    const [image, setImage] = useState<string | null>(null);
    const [blockSize, setBlockSize] = useState(128);
    const [isDragging, setIsDragging] = useState(false);
    const [useDithering, setUseDithering] = useState(false);
    const [useStaircasing, setUseStaircasing] = useState(false);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.DELTA_E_2000);
    const [showBlockSelector, setShowBlockSelector] = useState(false);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getDefaultBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);

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

    const processImage = useCallback(() => {
        if (!image) return;

        setIsProcessing(true);

        setTimeout(() => {
            const img = new Image();

            img.onerror = () => {
                setIsProcessing(false);
            };

            img.onload = () => {
                try {
                    const tempCanvas = document.createElement('canvas');
                    const ctx = tempCanvas.getContext('2d');
                    if (!ctx) {
                        setIsProcessing(false);
                        return;
                    }

                    const enabledGroups = getEnabledGroups();

                    const maxDimension = blockSize;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxDimension) {
                            height = (height / width) * maxDimension;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = (width / height) * maxDimension;
                            height = maxDimension;
                        }
                    }

                    width = Math.floor(width);
                    height = Math.floor(height);

                    tempCanvas.width = width;
                    tempCanvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);
                    let imageData = ctx.getImageData(0, 0, width, height);

                    if (useStaircasing) {
                        imageData = applyStaircasing(imageData, width, height, enabledGroups, useDithering, colorDistanceMethod);
                    } else if (useDithering) {
                        imageData = floydSteinbergDithering(imageData, width, height, enabledGroups, colorDistanceMethod);
                    } else {
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const nearest = findNearestMapColor(data[i], data[i + 1], data[i + 2], enabledGroups, false, colorDistanceMethod);
                            const rgb = numberToRGB(nearest.color);
                            data[i] = rgb.r;
                            data[i + 1] = rgb.g;
                            data[i + 2] = rgb.b;
                        }
                    }

                    const usedColors = new Set<string>();
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
                        usedColors.add(hex);
                    }

                    setProcessingStats({
                        width,
                        height,
                        totalBlocks: width * height,
                        uniqueBlocks: usedColors.size
                    });

                    ctx.putImageData(imageData, 0, 0);
                    const materials = getMaterialList(tempCanvas, enabledGroups, colorDistanceMethod);
                    setMaterialList(materials);

                    setProcessedImageData(imageData);
                    setIsProcessing(false);
                } catch (err) {
                    console.error('Processing error:', err);
                    setIsProcessing(false);
                }
            };

            img.src = image;
        }, 50);
    }, [image, blockSize, useDithering, useStaircasing, colorDistanceMethod, getEnabledGroups]);

    useEffect(() => {
        if (image) {
            processImage();
        }
    }, [image, processImage]);

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

    const handleExport = () => {
        if (!processedImageData || !processingStats) return;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = processingStats.width;
        exportCanvas.height = processingStats.height;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        ctx.putImageData(processedImageData, 0, 0);

        const link = document.createElement('a');
        link.download = 'minecraft-map-art.png';
        link.href = exportCanvas.toDataURL();
        link.click();
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
            <h1 className="text-3xl font-bold">MapArt Generator</h1>

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

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dithering"
                                        checked={useDithering}
                                        onCheckedChange={(checked) => setUseDithering(checked as boolean)}
                                    />
                                    <Label htmlFor="dithering">Dithering</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="staircasing"
                                        checked={useStaircasing}
                                        onCheckedChange={(checked) => setUseStaircasing(checked as boolean)}
                                    />
                                    <Label htmlFor="staircasing">Staircasing</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="perceptual"
                                        checked={colorDistanceMethod === ColorDistanceMethod.DELTA_E_2000}
                                        onCheckedChange={(checked) => setColorDistanceMethod(
                                            checked ? ColorDistanceMethod.DELTA_E_2000 : ColorDistanceMethod.EUCLIDEAN
                                        )}
                                    />
                                    <Label htmlFor="perceptual">Perceptual Color Matching (Delta E 2000)</Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleExport} className="flex-1" disabled={!processingStats}>
                                        <Download className="mr-2" size={16} />
                                        Export
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
                                                        return (
                                                            <Button
                                                                key={uniqueKey}
                                                                onClick={() => toggleBlockSelection(groupId, blockName)}
                                                                variant={isSelected ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="h-7 px-2 text-xs"
                                                            >
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