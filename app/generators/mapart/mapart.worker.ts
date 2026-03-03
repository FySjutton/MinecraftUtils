import { ColorDistanceMethod, StaircasingMode, Brightness, PaletteConfig } from './utils/types';
import { DitheringMethodName } from './dithering/types';
import { applyDitheringDat } from './dithering/dat';
import { processImageData } from './utils/buildable';
import { setWorkerColorMap, setWorkerBrightnessMap } from './utils/constants';

export interface WorkerRequest {
    requestId: number;
    buffer: ArrayBuffer;
    width: number;
    height: number;
    enabledGroups: number[];
    ditheringMethod: DitheringMethodName;
    staircasingMode: StaircasingMode;
    colorMethod: ColorDistanceMethod;
    maxHeight: number;
    datMode?: boolean;
    useMemoSearch?: boolean;
    paletteConfig?: PaletteConfig;
}

export type WorkerResponse =
    | {
    type: 'result';
    requestId: number;
    buffer: ArrayBuffer;
    width: number;
    height: number;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
    colorBytesBuffer?: ArrayBuffer;
}
    | {
    type: 'error';
    requestId: number;
    message: string;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { requestId, buffer, width, height, enabledGroups, ditheringMethod, staircasingMode, colorMethod, maxHeight, datMode, useMemoSearch, paletteConfig } = event.data;

    if (paletteConfig) {
        const colorMap = new Map<number, number>();
        const brightnessMap = new Map<number, Brightness[]>();
        for (const group of paletteConfig.groups) {
            colorMap.set(group.groupId, group.color);
            brightnessMap.set(group.groupId, group.brightness);
        }
        setWorkerColorMap(colorMap);
        setWorkerBrightnessMap(brightnessMap);
    } else {
        setWorkerColorMap(null);
        setWorkerBrightnessMap(null);
    }

    try {
        const pixels = new Uint8ClampedArray(buffer);
        const imageData = new ImageData(pixels, width, height);
        const groups = new Set(enabledGroups);

        if (datMode) {
            const result = applyDitheringDat(imageData, width, height, groups, ditheringMethod, colorMethod);
            const outBuffer = result.imageData.data.buffer as ArrayBuffer;
            const colorBytesBuffer = result.colorBytes.buffer.slice(0) as ArrayBuffer;

            const response: WorkerResponse = {
                type: 'result', requestId, buffer: outBuffer, width, height,
                brightnessMap: [], groupIdMap: [], yMap: [],
                colorBytesBuffer,
            };
            (self as unknown as Worker).postMessage(response, [outBuffer, colorBytesBuffer]);
        } else {
            const result = processImageData(imageData, width, height, groups, ditheringMethod, staircasingMode, colorMethod, maxHeight, useMemoSearch);
            const outBuffer = result.imageData.data.buffer;

            const response: WorkerResponse = {
                type: 'result', requestId, buffer: outBuffer, width, height,
                brightnessMap: result.brightnessMap,
                groupIdMap: result.groupIdMap,
                yMap: result.yMap,
            };
            (self as unknown as Worker).postMessage(response, [outBuffer]);
        }
    } catch (err) {
        const response: WorkerResponse = {
            type: 'error',
            requestId,
            message: err instanceof Error ? err.message : String(err),
        };
        (self as unknown as Worker).postMessage(response);
    }
};
