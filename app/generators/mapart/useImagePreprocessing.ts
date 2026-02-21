'use client';

import { useEffect, useRef } from 'react';
import { Settings } from './useSettings';

export enum CropMode {
    STRETCH = 'stretch',
    SCALE_CROP = 'scale_crop',
}

interface UseImagePreprocessingOptions {
    sourceImage: HTMLImageElement | null;
    settings: Settings;
    onProcessed: (canvas: HTMLCanvasElement) => void;
}

export interface ImagePreprocessingDerived {
    needsXOffset: boolean;
    needsYOffset: boolean;
}

export function useImagePreprocessing({sourceImage, settings, onProcessed,}: UseImagePreprocessingOptions): ImagePreprocessingDerived {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const { mapWidth, mapHeight, brightness, contrast, saturation, cropMode, xOffset, yOffset } = settings;
    const targetWidth = mapWidth * 128;
    const targetHeight = mapHeight * 128;

    const sourceAspect = sourceImage ? sourceImage.width / sourceImage.height : 1;
    const targetAspect = targetWidth / targetHeight;
    const needsXOffset = cropMode === CropMode.SCALE_CROP && !!sourceImage && sourceAspect > targetAspect;
    const needsYOffset = cropMode === CropMode.SCALE_CROP && !!sourceImage && sourceAspect < targetAspect;

    useEffect(() => {
        if (!sourceImage || targetWidth === 0 || targetHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (cropMode === CropMode.STRETCH) {
            ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height, 0, 0, targetWidth, targetHeight);
        } else {
            if (sourceAspect > targetAspect) {
                const scaledWidth = sourceImage.width * (targetHeight / sourceImage.height);
                ctx.drawImage(sourceImage, -((scaledWidth - targetWidth) * (xOffset / 100)), 0, scaledWidth, targetHeight);
            } else {
                const scaledHeight = sourceImage.height * (targetWidth / sourceImage.width);
                ctx.drawImage(sourceImage, 0, -((scaledHeight - targetHeight) * (yOffset / 100)), targetWidth, scaledHeight);
            }
        }

        applyFilters(ctx, targetWidth, targetHeight, brightness, contrast, saturation);
        canvasRef.current = canvas;
        onProcessed(canvas);
    }, [sourceImage, targetWidth, targetHeight, brightness, contrast, saturation, cropMode, xOffset, yOffset, onProcessed]);

    return { needsXOffset, needsYOffset };
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