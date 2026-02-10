import { ColorDistanceMethod } from './types';
import { findNearestMapColor, numberToRGB } from './colorMatching';
import { floydSteinbergDithering } from './dithering';

export function applyStaircasing(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    useDithering: boolean,
    method: ColorDistanceMethod
): ImageData {
    if (useDithering) {
        imageData = floydSteinbergDithering(imageData, width, height, enabledGroups, method);
    }

    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const nearest = findNearestMapColor(r, g, b, enabledGroups, true, method);
            const rgb = numberToRGB(nearest.color);

            data[idx] = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;
        }
    }

    return imageData;
}