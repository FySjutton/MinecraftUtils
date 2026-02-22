import { Brightness, ColorDistanceMethod } from '../utils/types';
import { numberToRGB, findBestColorInSet, buildCandidates } from '../color/matching';
import { createBiasFunction, distributeError, clamp, BiasFunction } from './shared';
import { DitheringMethodName, DitheringMethodErrorDiffusion, ditheringMethods } from './types';

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

const DAT_TRANSPARENT_BYTE = 0;

export interface DatProcessingResult {
    imageData: ImageData;
    colorBytes: Uint8Array;
}

function applyBiasDitheringDat(
    imageData: ImageData,
    width: number,
    height: number,
    candidates: ReturnType<typeof buildCandidates>,
    colorMethod: ColorDistanceMethod,
    getBias: BiasFunction,
): DatProcessingResult {
    const data = new Uint8ClampedArray(imageData.data);
    const colorBytes = new Uint8Array(width * height);

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < height; z++) {
            const idx = (z * width + x) * 4;

            if (data[idx + 3] < 128) {
                data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 0;
                colorBytes[x + z * width] = DAT_TRANSPARENT_BYTE;
                continue;
            }

            const bias = getBias(x, z);
            const r = clamp(data[idx] + bias);
            const g = clamp(data[idx + 1] + bias);
            const b = clamp(data[idx + 2] + bias);

            const best = findBestColorInSet(r, g, b, candidates, colorMethod);
            const rgb = numberToRGB(best.color);
            data[idx] = rgb.r; data[idx + 1] = rgb.g; data[idx + 2] = rgb.b; data[idx + 3] = 255;
            colorBytes[x + z * width] = getDatColorByte(best.groupId, best.brightness);
        }
    }

    return { imageData: new ImageData(data, width, height), colorBytes };
}

function applyErrorDiffusionDat(
    imageData: ImageData,
    width: number,
    height: number,
    candidates: ReturnType<typeof buildCandidates>,
    colorMethod: ColorDistanceMethod,
    method: DitheringMethodErrorDiffusion,
): DatProcessingResult {
    const workingData = new Float32Array(imageData.data);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    const colorBytes = new Uint8Array(width * height);

    for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
            const idx = (z * width + x) * 4;

            if (imageData.data[idx + 3] < 128) {
                colorBytes[x + z * width] = DAT_TRANSPARENT_BYTE;
                continue;
            }

            const oldR = clamp(Math.round(workingData[idx]));
            const oldG = clamp(Math.round(workingData[idx + 1]));
            const oldB = clamp(Math.round(workingData[idx + 2]));

            const best = findBestColorInSet(oldR, oldG, oldB, candidates, colorMethod);
            const rgb = numberToRGB(best.color);

            outputData[idx] = rgb.r; outputData[idx + 1] = rgb.g;
            outputData[idx + 2] = rgb.b; outputData[idx + 3] = 255;
            colorBytes[x + z * width] = getDatColorByte(best.groupId, best.brightness);

            if (method.ditherMatrix) {
                distributeError(workingData, width, height, x, z, oldR - rgb.r, oldG - rgb.g, oldB - rgb.b, method);
            }
        }
    }

    return { imageData: new ImageData(outputData, width, height), colorBytes };
}

export function applyDitheringDat(
    imageData: ImageData,
    width: number,
    height: number,
    enabledGroups: Set<number>,
    ditheringMethod: DitheringMethodName,
    colorMethod: ColorDistanceMethod,
): DatProcessingResult {
    const method = ditheringMethods[ditheringMethod];
    const candidates = buildCandidates(enabledGroups, () => DAT_BRIGHTNESSES);
    const getBias = createBiasFunction(method);

    if (getBias) {
        return applyBiasDitheringDat(imageData, width, height, candidates, colorMethod, getBias);
    }
    return applyErrorDiffusionDat(
        imageData, width, height, candidates, colorMethod,
        method as DitheringMethodErrorDiffusion,
    );
}