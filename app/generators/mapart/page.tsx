'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProcessingStats, BlockSelection, Brightness, MaterialCount } from './types';
import { BLOCK_GROUPS, BASE_COLORS, getDefaultBlockSelection } from './constants';
import { findNearestMapColor, applyDithering, numberToRGB, rgbToHex, getMaterialList } from './utils';
import { ZoomViewport } from './ZoomViewport';

export default function MapArtPage() {
    const [image, setImage] = useState<string | null>(null);
    const [blockSize, setBlockSize] = useState(128);
    const [isDragging, setIsDragging] = useState(false);
    const [useDithering, setUseDithering] = useState(false);
    const [useStaircasing, setUseStaircasing] = useState(false);
    const [showBlockSelector, setShowBlockSelector] = useState(false);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getDefaultBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
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
        console.log('[processImage] Starting image processing');
        setError(null);

        if (!image) {
            console.log('[processImage] No image set');
            return;
        }

        if (!canvasRef.current) {
            console.log('[processImage] No canvas ref');
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('[processImage] Failed to get canvas context');
            setError('Failed to get canvas context');
            return;
        }

        const enabledGroups = getEnabledGroups();
        console.log('[processImage] Enabled groups:', enabledGroups.size);

        const img = new Image();

        img.onerror = (e) => {
            console.error('[processImage] Image load error:', e);
            setError('Failed to load image');
        };

        img.onload = () => {
            console.log('[processImage] Image loaded, dimensions:', img.width, 'x', img.height);

            try {
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

                console.log('[processImage] Processing dimensions:', width, 'x', height);

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                let imageData = ctx.getImageData(0, 0, width, height);

                console.log('[processImage] Got image data, processing...');

                if (useDithering) {
                    console.log('[processImage] Applying dithering');
                    imageData = applyDithering(imageData, width, height, enabledGroups, useStaircasing);
                } else {
                    console.log('[processImage] Applying nearest color');
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const nearest = findNearestMapColor(data[i], data[i + 1], data[i + 2], enabledGroups, useStaircasing);
                        const rgb = numberToRGB(nearest.color);
                        data[i] = rgb.r;
                        data[i + 1] = rgb.g;
                        data[i + 2] = rgb.b;
                    }
                }

                console.log('[processImage] Putting processed image data back');
                ctx.putImageData(imageData, 0, 0);

                const usedColors = new Set<string>();
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
                    usedColors.add(hex);
                }

                const stats = {
                    width,
                    height,
                    totalBlocks: width * height,
                    uniqueBlocks: usedColors.size
                };

                console.log('[processImage] Setting stats:', stats);
                setProcessingStats(stats);

                console.log('[processImage] Generating material list');
                const materials = getMaterialList(canvas, enabledGroups, useStaircasing);
                console.log('[processImage] Material list generated:', materials.length, 'items');
                setMaterialList(materials);

                console.log('[processImage] Processing complete!');
            } catch (err) {
                console.error('[processImage] Error during processing:', err);
                setError(`Processing error: ${err}`);
            }
        };

        console.log('[processImage] Setting image source');
        img.src = image;
    }, [image, blockSize, useDithering, useStaircasing, getEnabledGroups]);

    useEffect(() => {
        console.log('[useEffect] Image changed:', !!image);
        if (image) {
            processImage();
        }
    }, [image, processImage]);

    const handleFileUpload = (file: File | null) => {
        console.log('[handleFileUpload] File selected:', file?.name);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('[handleFileUpload] File read complete');
                setImage(e.target?.result as string);
            };
            reader.onerror = (e) => {
                console.error('[handleFileUpload] File read error:', e);
                setError('Failed to read file');
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
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'minecraft-map-art.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    const handleReset = () => {
        setImage(null);
        setProcessingStats(null);
        setMaterialList([]);
        setError(null);
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

    const getBrightnessName = (brightness: Brightness): string => {
        switch (brightness) {
            case Brightness.LOWEST: return 'Lowest (-2)';
            case Brightness.LOW: return 'Low (-1)';
            case Brightness.NORMAL: return 'Normal (0)';
            case Brightness.HIGH: return 'High (+1)';
            default: return 'Normal';
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-4">
            <h1 className="text-3xl font-bold">MapArt Generator</h1>

            {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Panel */}
                <div className="space-y-4">
                    {/* Upload */}
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

                    {/* Settings */}
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

                    {/* Stats */}
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

                    {/* Material List */}
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
                                                    {useStaircasing && (
                                                        <span className="text-xs text-muted-foreground shrink-0">
                              {getBrightnessName(material.brightness)}
                            </span>
                                                    )}
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

                    {/* Block Selector */}
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

                {/* Right Panel - Canvas */}
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
                            ) : !processingStats ? (
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center">
                                        <p className="mb-2">Processing...</p>
                                        <p className="text-sm text-muted-foreground">Check console for details</p>
                                    </div>
                                </div>
                            ) : (
                                <ZoomViewport cellWidth={processingStats.width} cellHeight={processingStats.height}>
                                    <canvas
                                        ref={canvasRef}
                                        width={processingStats.width}
                                        height={processingStats.height}
                                        style={{
                                            imageRendering: 'pixelated',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    />
                                </ZoomViewport>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}