import { Brightness } from './types';
import { MapArea } from './areaTypes';
import { Settings } from '../useSettings';
import type { WorkerRequest, WorkerResponse } from '../mapart.worker';
import { TRANSPARENT_GROUP_ID } from './constants';

export interface RawGlobalResult {
    pixelBuffer: Uint8ClampedArray;
    width: number;
    height: number;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
    colorBytes: Uint8Array | null;
}

export interface AreaWorkerResult {
    pixelBuffer: Uint8ClampedArray;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
    colorBytes: Uint8Array | null;
}

export function buildAreaCanvas(
    cropOnlySmoothCanvas: HTMLCanvasElement,
    cropOnlyPixelCanvas: HTMLCanvasElement | null,
    area: MapArea,
    globalSettings: Settings,
): HTMLCanvasElement {
    const areaX = area.chunkX * 16;
    const areaY = area.chunkY * 16;
    const areaW = area.chunkWidth * 16;
    const areaH = area.chunkHeight * 16;

    const areaCanvas = document.createElement('canvas');
    areaCanvas.width = areaW;
    areaCanvas.height = areaH;
    const ctx = areaCanvas.getContext('2d', { willReadFrequently: true })!;

    const fillColor = area.overrides.fillColor ?? globalSettings.fillColor;
    if (fillColor !== 'none') {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, areaW, areaH);
    }

    // Pick the source canvas based on the effective pixelArt setting for this area
    const pixelArt = area.overrides.pixelArt ?? globalSettings.pixelArt;
    const sourceCanvas = (pixelArt && cropOnlyPixelCanvas) ? cropOnlyPixelCanvas : cropOnlySmoothCanvas;
    ctx.drawImage(sourceCanvas, areaX, areaY, areaW, areaH, 0, 0, areaW, areaH);

    const brightness = area.overrides.brightness ?? globalSettings.brightness;
    const contrast = area.overrides.contrast ?? globalSettings.contrast;
    const saturation = area.overrides.saturation ?? globalSettings.saturation;
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
        applyAreaFilters(ctx, areaW, areaH, brightness, contrast, saturation);
    }

    return areaCanvas;
}

function applyAreaFilters(
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

export function mergeAreaResult(
    mergedPixels: Uint8ClampedArray,
    mergedBrightness: Brightness[][],
    mergedGroupId: number[][],
    mergedY: number[][],
    mergedColorBytes: Uint8Array | null,
    areaResult: AreaWorkerResult,
    area: MapArea,
    fullWidth: number,
): void {
    const areaX = area.chunkX * 16;
    const areaY = area.chunkY * 16;
    const areaW = area.chunkWidth * 16;
    const areaH = area.chunkHeight * 16;

    for (let z = 0; z < areaH; z++) {
        for (let x = 0; x < areaW; x++) {
            const srcIdx = (z * areaW + x) * 4;
            const dstIdx = ((areaY + z) * fullWidth + (areaX + x)) * 4;
            mergedPixels[dstIdx] = areaResult.pixelBuffer[srcIdx];
            mergedPixels[dstIdx + 1] = areaResult.pixelBuffer[srcIdx + 1];
            mergedPixels[dstIdx + 2] = areaResult.pixelBuffer[srcIdx + 2];
            mergedPixels[dstIdx + 3] = areaResult.pixelBuffer[srcIdx + 3];

            if (areaResult.brightnessMap.length > 0) {
                mergedBrightness[areaY + z][areaX + x] = areaResult.brightnessMap[z][x];
                mergedGroupId[areaY + z][areaX + x] = areaResult.groupIdMap[z][x];
                mergedY[areaY + z][areaX + x] = areaResult.yMap[z][x];
            }

            if (mergedColorBytes && areaResult.colorBytes) {
                mergedColorBytes[(areaY + z) * fullWidth + (areaX + x)] = areaResult.colorBytes[z * areaW + x];
            }
        }
    }
}


export function recomputeGlobalBrightness(
    mergedPixels: Uint8ClampedArray,
    mergedBrightness: Brightness[][],
    mergedGroupId: number[][],
    mergedY: number[][],
    fullWidth: number,
    fullHeight: number,
): void {
    if (mergedBrightness.length === 0) return; // dat mode — no brightness map

    for (let z = 1; z < fullHeight; z++) {
        for (let x = 0; x < fullWidth; x++) {
            if (mergedGroupId[z][x] === TRANSPARENT_GROUP_ID) continue;

            let northZ = z - 1;
            while (northZ >= 0 && mergedGroupId[northZ][x] === TRANSPARENT_GROUP_ID) northZ--;
            if (northZ < 0) continue; // no solid north block in this column

            const currentY = mergedY[z][x];
            const northY = mergedY[northZ][x];

            const actualBrightness: Brightness =
                currentY > northY ? Brightness.HIGH :
                currentY < northY ? Brightness.LOW :
                Brightness.NORMAL;

            const oldBrightness = mergedBrightness[z][x];
            if (actualBrightness === oldBrightness) continue;

            mergedBrightness[z][x] = actualBrightness;
            const idx = (z * fullWidth + x) * 4;
            const ratio = actualBrightness / oldBrightness;
            mergedPixels[idx]     = Math.max(0, Math.min(255, Math.round(mergedPixels[idx]     * ratio)));
            mergedPixels[idx + 1] = Math.max(0, Math.min(255, Math.round(mergedPixels[idx + 1] * ratio)));
            mergedPixels[idx + 2] = Math.max(0, Math.min(255, Math.round(mergedPixels[idx + 2] * ratio)));
        }
    }
}

export function processWithAreaWorker(
    worker: Worker,
    request: WorkerRequest,
): Promise<Extract<WorkerResponse, { type: 'result' }>> {
    return new Promise((resolve, reject) => {
        const handler = (e: MessageEvent<WorkerResponse>) => {
            if (e.data.requestId !== request.requestId) return;
            worker.removeEventListener('message', handler);
            if (e.data.type === 'error') reject(new Error(e.data.message));
            else resolve(e.data as Extract<WorkerResponse, { type: 'result' }>);
        };
        worker.addEventListener('message', handler);
        worker.postMessage(request, [request.buffer]);
    });
}
