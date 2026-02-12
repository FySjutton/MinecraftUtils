import { ColorDistanceMethod } from './types';
import { findNearestMapColor, numberToRGB } from './colorMatching';

export function floydSteinbergDithering(
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

            const oldR = Math.max(0, Math.min(255, data[idx]));
            const oldG = Math.max(0, Math.min(255, data[idx + 1]));
            const oldB = Math.max(0, Math.min(255, data[idx + 2]));

            const nearest = findNearestMapColor(oldR, oldG, oldB, enabledGroups, useStaircasing, method);
            const rgb = numberToRGB(nearest.color);

            data[idx] = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;

            const errR = oldR - rgb.r;
            const errG = oldG - rgb.g;
            const errB = oldB - rgb.b;

            const distributeError = (xOffset: number, yOffset: number, factor: number) => {
                const newX = x + xOffset;
                const newY = y + yOffset;
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                    const newIdx = (newY * width + newX) * 4;
                    data[newIdx] += errR * factor;
                    data[newIdx + 1] += errG * factor;
                    data[newIdx + 2] += errB * factor;
                }
            };

            distributeError(1, 0, 7/16);   // Right
            distributeError(-1, 1, 3/16);  // Bottom-left
            distributeError(0, 1, 5/16);   // Bottom
            distributeError(1, 1, 1/16);   // Bottom-right
        }
    }

    return imageData;
}