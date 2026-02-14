import { findNearestMapColor, numberToRGB } from './colorMatching';
import { floydSteinbergDithering } from './dithering/floyd-steinberg';
import {Brightness, ColorDistanceMethod, StaircasingMode} from "@/app/generators/mapart/utils";

export function processImage(
    sourceImage: HTMLImageElement,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    useDithering: boolean,
    staircasingMode: StaircasingMode,
    colorMethod: ColorDistanceMethod
): ImageData {
    // Create canvas and draw scaled image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    ctx.drawImage(sourceImage, 0, 0, width, height);
    let imageData = ctx.getImageData(0, 0, width, height);

    const useStaircasing = staircasingMode !== StaircasingMode.NONE;

    // Apply processing based on options
    if (useStaircasing && useDithering) {
        // Both: 186 colors with dithering
        imageData = floydSteinbergDithering(imageData, width, height, enabledGroups, true, colorMethod);
    } else if (useStaircasing) {
        // Staircasing only: 186 colors, no dithering
        imageData = quantizeColors(imageData, width, height, enabledGroups, true, colorMethod);
    } else if (useDithering) {
        // Dithering only: 62 colors with dithering
        imageData = floydSteinbergDithering(imageData, width, height, enabledGroups, false, colorMethod);
    } else {
        // Neither: 62 colors, no dithering
        imageData = quantizeColors(imageData, width, height, enabledGroups, false, colorMethod);
    }

    return imageData;
}

function quantizeColors(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    useStaircasing: boolean,
    method: ColorDistanceMethod
): ImageData {
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const nearest = findNearestMapColor(
                data[idx],
                data[idx + 1],
                data[idx + 2],
                enabledGroups,
                useStaircasing,
                method
            );
            const rgb = numberToRGB(nearest.color);
            data[idx] = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;
        }
    }

    return imageData;
}

export function extractBrightnessMap(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    useStaircasing: boolean,
    colorMethod: ColorDistanceMethod
): { brightnessMap: Brightness[][], groupIdMap: number[][] } {
    const data = imageData.data;
    const brightnessMap: Brightness[][] = [];
    const groupIdMap: number[][] = [];

    for (let z = 0; z < height; z++) {
        brightnessMap[z] = [];
        groupIdMap[z] = [];
        for (let x = 0; x < width; x++) {
            const idx = (z * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const nearest = findNearestMapColor(r, g, b, enabledGroups, useStaircasing, colorMethod);
            brightnessMap[z][x] = nearest.brightness;
            groupIdMap[z][x] = nearest.groupId;
        }
    }

    return { brightnessMap, groupIdMap };
}

export function countUniqueColors(imageData: ImageData): number {
    const data = imageData.data;
    const colors = new Set<string>();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        colors.add(`${r},${g},${b}`);
    }

    return colors.size;
}