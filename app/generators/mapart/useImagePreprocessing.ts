'use client';

import React, { useEffect, useRef } from 'react';
import { Settings } from './useSettings';

export enum CropMode {
    STRETCH = 'stretch',
    SCALE_CROP = 'scale_crop',
}

interface UseImagePreprocessingOptions {
    sourceImage: HTMLImageElement | null;
    settings: Settings;
    onProcessed: (canvas: HTMLCanvasElement) => void;
    onCropOnly: (dataUrl: string) => void;
}

export interface ImagePreprocessingDerived {
    needsXOffset: boolean;
    needsYOffset: boolean;
    cropOnlyCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    cropOnlyPixelCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useImagePreprocessing({ sourceImage, settings, onProcessed, onCropOnly }: UseImagePreprocessingOptions): ImagePreprocessingDerived {
    const { mapWidth, mapHeight, brightness, contrast, saturation, cropMode, xOffset, yOffset, fillColor, pixelArt } = settings;
    const targetWidth = mapWidth * 128;
    const targetHeight = mapHeight * 128;

    const sourceAspect = sourceImage ? sourceImage.width / sourceImage.height : 1;
    const targetAspect = targetWidth / targetHeight;
    const needsXOffset = cropMode === CropMode.SCALE_CROP && !!sourceImage && sourceAspect > targetAspect;
    const needsYOffset = cropMode === CropMode.SCALE_CROP && !!sourceImage && sourceAspect < targetAspect;

    const onProcessedRef = useRef(onProcessed);
    const onCropOnlyRef = useRef(onCropOnly);
    const cropOnlyCanvasRef = useRef<HTMLCanvasElement | null>(null);       // smooth (high quality)
    const cropOnlyPixelCanvasRef = useRef<HTMLCanvasElement | null>(null);  // pixelated (nearest-neighbor)

    useEffect(() => { onProcessedRef.current = onProcessed; }, [onProcessed]);
    useEffect(() => { onCropOnlyRef.current = onCropOnly; }, [onCropOnly]);

    useEffect(() => {
        if (!sourceImage || targetWidth === 0 || targetHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        const srcAspect = sourceImage.width / sourceImage.height;
        const tgtAspect = targetWidth / targetHeight;

        ctx.imageSmoothingEnabled = !pixelArt;
        if (!pixelArt) ctx.imageSmoothingQuality = 'high';

        if (fillColor !== 'none') {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        drawCropped(ctx, sourceImage, targetWidth, targetHeight, cropMode, xOffset, yOffset, srcAspect, tgtAspect);

        const filtersAreDefault = brightness === 100 && contrast === 100 && saturation === 100;
        if (!filtersAreDefault) {
            applyFilters(ctx, targetWidth, targetHeight, brightness, contrast, saturation);
        }

        onProcessedRef.current(canvas);
    }, [sourceImage, targetWidth, targetHeight, brightness, contrast, saturation, cropMode, xOffset, yOffset, fillColor, pixelArt]);

    useEffect(() => {
        if (!sourceImage || targetWidth === 0 || targetHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d')!;

        const srcAspect = sourceImage.width / sourceImage.height;
        const tgtAspect = targetWidth / targetHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        drawCropped(ctx, sourceImage, targetWidth, targetHeight, cropMode, xOffset, yOffset, srcAspect, tgtAspect);

        cropOnlyCanvasRef.current = canvas;
        onCropOnlyRef.current(canvas.toDataURL());
    }, [sourceImage, targetWidth, targetHeight, cropMode, xOffset, yOffset]);

    useEffect(() => {
        if (!sourceImage || targetWidth === 0 || targetHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d')!;

        const srcAspect = sourceImage.width / sourceImage.height;
        const tgtAspect = targetWidth / targetHeight;

        ctx.imageSmoothingEnabled = false;

        drawCropped(ctx, sourceImage, targetWidth, targetHeight, cropMode, xOffset, yOffset, srcAspect, tgtAspect);

        cropOnlyPixelCanvasRef.current = canvas;
    }, [sourceImage, targetWidth, targetHeight, cropMode, xOffset, yOffset]);

    return { needsXOffset, needsYOffset, cropOnlyCanvasRef, cropOnlyPixelCanvasRef };
}

function drawCropped(
    ctx: CanvasRenderingContext2D,
    sourceImage: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    cropMode: CropMode,
    xOffset: number,
    yOffset: number,
    srcAspect: number,
    tgtAspect: number,
): void {
    if (cropMode === CropMode.STRETCH) {
        ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height, 0, 0, targetWidth, targetHeight);
    } else {
        if (srcAspect > tgtAspect) {
            const scaledWidth = sourceImage.width * (targetHeight / sourceImage.height);
            ctx.drawImage(sourceImage, -((scaledWidth - targetWidth) * (xOffset / 100)), 0, scaledWidth, targetHeight);
        } else {
            const scaledHeight = sourceImage.height * (targetWidth / sourceImage.width);
            ctx.drawImage(sourceImage, 0, -((scaledHeight - targetHeight) * (yOffset / 100)), targetWidth, scaledHeight);
        }
    }
}

function applyFilters(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    brightness: number,
    contrast: number,
    saturation: number,
): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const bMul = brightness / 100;
    const cFac = contrast / 100;
    const sFac = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;

        let r = data[i] * bMul;
        let g = data[i + 1] * bMul;
        let b = data[i + 2] * bMul;

        r = ((r / 255 - 0.5) * cFac + 0.5) * 255;
        g = ((g / 255 - 0.5) * cFac + 0.5) * 255;
        b = ((b / 255 - 0.5) * cFac + 0.5) * 255;

        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * sFac;
        g = gray + (g - gray) * sFac;
        b = gray + (b - gray) * sFac;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
}