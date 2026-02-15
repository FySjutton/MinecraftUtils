'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export enum CropMode {
    STRETCH = 'stretch',
    SCALE_CROP = 'scale_crop'
}

interface ImagePreprocessingProps {
    sourceImage: HTMLImageElement | null;
    targetWidth: number;
    targetHeight: number;
    onProcessed: (canvas: HTMLCanvasElement) => void;
}

export default function ImagePreprocessing({sourceImage, targetWidth, targetHeight, onProcessed}: ImagePreprocessingProps) {
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [cropMode, setCropMode] = useState<CropMode>(CropMode.STRETCH);
    const [xOffset, setXOffset] = useState(50); // 0-100, where 50 is center
    const [yOffset, setYOffset] = useState(50); // 0-100, where 50 is center

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!sourceImage || targetWidth === 0 || targetHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate source rectangle based on crop mode
        if (cropMode === CropMode.STRETCH) {
            // Just stretch to fit
            ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height, 0, 0, targetWidth, targetHeight);
        } else if (cropMode === CropMode.SCALE_CROP) {
            // Scale to fit smallest dimension, then crop
            const sourceAspect = sourceImage.width / sourceImage.height;
            const targetAspect = targetWidth / targetHeight;

            if (sourceAspect > targetAspect) {
                // Source is wider - fit height, crop width
                const scaledWidth = sourceImage.width * (targetHeight / sourceImage.height);
                const cropAmount = scaledWidth - targetWidth;
                const offsetX = -(cropAmount * (xOffset / 100));

                ctx.drawImage(sourceImage, offsetX, 0, scaledWidth, targetHeight);
            } else {
                // Source is taller - fit width, crop height
                const scaledHeight = sourceImage.height * (targetWidth / sourceImage.width);
                const cropAmount = scaledHeight - targetHeight;
                const offsetY = -(cropAmount * (yOffset / 100));

                ctx.drawImage(sourceImage, 0, offsetY, targetWidth, scaledHeight);
            }
        }

        // Apply filters
        applyFilters(ctx, targetWidth, targetHeight, brightness, contrast, saturation);

        canvasRef.current = canvas;
        onProcessed(canvas);

    }, [sourceImage, targetWidth, targetHeight, brightness, contrast, saturation, cropMode, xOffset, yOffset, onProcessed]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Image Preprocessing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Brightness: {brightness}%</Label>
                    <Slider
                        value={[brightness]}
                        onValueChange={(v) => setBrightness(v[0])}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                    />
                </div>

                <div>
                    <Label>Contrast: {contrast}%</Label>
                    <Slider
                        value={[contrast]}
                        onValueChange={(v) => setContrast(v[0])}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                    />
                </div>

                <div>
                    <Label>Saturation: {saturation}%</Label>
                    <Slider
                        value={[saturation]}
                        onValueChange={(v) => setSaturation(v[0])}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Crop Mode:</Label>
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="stretch"
                                name="cropMode"
                                checked={cropMode === CropMode.STRETCH}
                                onChange={() => setCropMode(CropMode.STRETCH)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="stretch" className="cursor-pointer font-normal">
                                Stretch to Fit
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id="scale_crop"
                                name="cropMode"
                                checked={cropMode === CropMode.SCALE_CROP}
                                onChange={() => setCropMode(CropMode.SCALE_CROP)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="scale_crop" className="cursor-pointer font-normal">
                                Scale & Crop (Keep Aspect)
                            </Label>
                        </div>
                    </div>
                </div>

                {cropMode === CropMode.SCALE_CROP && sourceImage && (() => {
                    const sourceAspect = sourceImage.width / sourceImage.height;
                    const targetAspect = targetWidth / targetHeight;
                    const needsXOffset = sourceAspect > targetAspect;
                    const needsYOffset = sourceAspect < targetAspect;

                    return (
                        <>
                            {needsXOffset && (
                                <div>
                                    <Label>Horizontal Position: {xOffset}%</Label>
                                    <Slider
                                        value={[xOffset]}
                                        onValueChange={(v) => setXOffset(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="mt-2"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                        0% = Left, 50% = Center, 100% = Right
                                    </div>
                                </div>
                            )}
                            {needsYOffset && (
                                <div>
                                    <Label>Vertical Position: {yOffset}%</Label>
                                    <Slider
                                        value={[yOffset]}
                                        onValueChange={(v) => setYOffset(v[0])}
                                        min={0}
                                        max={100}
                                        step={1}
                                        className="mt-2"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                        0% = Top, 50% = Center, 100% = Bottom
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </CardContent>
        </Card>
    );
}

function applyFilters(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    brightness: number,
    contrast: number,
    saturation: number
): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const brightnessMultiplier = brightness / 100;
    const contrastFactor = (contrast / 100);
    const saturationFactor = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply brightness
        r *= brightnessMultiplier;
        g *= brightnessMultiplier;
        b *= brightnessMultiplier;

        // Apply contrast
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

        // Apply saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * saturationFactor;
        g = gray + (g - gray) * saturationFactor;
        b = gray + (b - gray) * saturationFactor;

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
}