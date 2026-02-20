import { ColorDistanceMethod, Brightness, BASE_COLORS, scaleRGB } from './utils';
import { calculateDistance } from './colorMatching';
import ditheringMethods from '../inputs/dithering.json';
import { DitheringMethodName } from './dithering';

export const DAT_BRIGHTNESSES: Brightness[] = [
    Brightness.LOW,
    Brightness.NORMAL,
    Brightness.HIGH,
    Brightness.LOWEST,
];

const BRIGHTNESS_TO_DAT_INDEX = new Map<Brightness, number>([
    [Brightness.LOW, 0],
    [Brightness.NORMAL, 1],
    [Brightness.HIGH, 2],
    [Brightness.LOWEST, 3],
]);

export function getDatColorByte(groupId: number, brightness: Brightness): number {
    return (groupId + 1) * 4 + (BRIGHTNESS_TO_DAT_INDEX.get(brightness) ?? 1);
}

function numberToRGB(color: number) {
    return { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
}

function getColorForBrightness(groupId: number, brightness: Brightness): number {
    return scaleRGB(BASE_COLORS[groupId], brightness);
}

function findBestDatColor(
    r: number, g: number, b: number,
    enabledGroups: Set<number>,
    method: ColorDistanceMethod
): { groupId: number; brightness: Brightness; color: number } {
    let bestDist = Infinity, bestGroupId = 0, bestBrightness = Brightness.NORMAL;

    for (const groupId of enabledGroups) {
        for (const brightness of DAT_BRIGHTNESSES) {
            const colorNum = getColorForBrightness(groupId, brightness);
            const rgb = numberToRGB(colorNum);
            const dist = calculateDistance(r, g, b, rgb.r, rgb.g, rgb.b, method);
            if (dist < bestDist) {
                bestDist = dist; bestGroupId = groupId; bestBrightness = brightness;
            }
        }
    }

    return {
        groupId: bestGroupId,
        brightness: bestBrightness,
        color: getColorForBrightness(bestGroupId, bestBrightness),
    };
}

export interface DatProcessingResult {
    imageData: ImageData;
    colorBytes: Uint8Array;
}

export function processDatImage(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    colorMethod: ColorDistanceMethod
): DatProcessingResult {
    const method = (ditheringMethods as Record<string, any>)[ditheringMethod];

    if (method.type === 'error_diffusion' || method.type === 'none') {
        return applyErrorDiffusionDat(imageData, width, height, enabledGroups, colorMethod, method);
    }

    const getBias: (x: number, z: number) => number =
        method.type === 'ordered'
            ? (x, z) =>
                (method.ditherMatrix[z % method.ditherMatrix.length][x % method.ditherMatrix[0].length] /
                    method.ditherDivisor - 0.5) * 255
            : method.type === 'threshold'
                ? () => (method.threshold - 0.5) * 255
                : () => (Math.random() - 0.5) * method.noiseRange * 255;

    return applyBiasDitheringDat(imageData, width, height, enabledGroups, colorMethod, getBias);
}

function applyBiasDitheringDat(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    colorMethod: ColorDistanceMethod,
    getBias: (x: number, z: number) => number
): DatProcessingResult {
    const data = new Uint8ClampedArray(imageData.data);
    const colorBytes = new Uint8Array(width * height);

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const bias = getBias(x, z);
            const r = Math.max(0, Math.min(255, data[idx] + bias));
            const g = Math.max(0, Math.min(255, data[idx + 1] + bias));
            const b = Math.max(0, Math.min(255, data[idx + 2] + bias));

            const best = findBestDatColor(r, g, b, enabledGroups, colorMethod);
            const rgb = numberToRGB(best.color);
            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b;
            colorBytes[x + z * width] = getDatColorByte(best.groupId, best.brightness);
        }
    }

    return { imageData: new ImageData(data, width, height), colorBytes };

}

function applyErrorDiffusionDat(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    colorMethod: ColorDistanceMethod,
    method: any
): DatProcessingResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    const colorBytes = new Uint8Array(width * height);

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;
            const oldR = Math.max(0, Math.min(255, Math.round(workingData[idx])));
            const oldG = Math.max(0, Math.min(255, Math.round(workingData[idx + 1])));
            const oldB = Math.max(0, Math.min(255, Math.round(workingData[idx + 2])));

            const best = findBestDatColor(oldR, oldG, oldB, enabledGroups, colorMethod);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g; outputData[idx + 2] = rgb.b;
            outputData[idx + 3] = imageData.data[idx + 3];
            colorBytes[x + z * width] = getDatColorByte(best.groupId, best.brightness);

            if (method.ditherMatrix) {
                const { ditherMatrix: matrix, ditherDivisor: divisor, centerX: cx, centerY: cy } = method;
                for (let dy = 0; dy < matrix.length; dy++) {
                    for (let dx = 0; dx < matrix[dy].length; dx++) {
                        const weight = matrix[dy][dx];
                        if (weight === 0) continue;
                        const nx = x + (dx - cx);
                        const nz = z + (dy - cy);
                        if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue;
                        const ni = (nz * width + nx) * 4;
                        const factor = weight / divisor;
                        workingData[ni] += (oldR - rgb.r) * factor;
                        workingData[ni + 1] += (oldG - rgb.g) * factor;
                        workingData[ni + 2] += (oldB - rgb.b) * factor;
                    }
                }
            }
        }
    }

    return { imageData: new ImageData(outputData, width, height), colorBytes };
}