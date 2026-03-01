import { AreaSettingsResolved, ColorDistanceMethod, StaircasingMode, Brightness } from './utils/types';
import { DitheringMethodName } from './dithering/types';
import {applyDitheringDat} from "@/app/generators/mapart/dithering/dat";
import {processImageData} from "@/app/generators/mapart/utils/buildable";
import { getYRange } from './staircasing/heights';

export interface AreaSettingsDef {
    px: number;
    py: number;
    pw: number;
    ph: number;
    enabledGroups: number[];
    staircasingMode: StaircasingMode;
    colorMethod: ColorDistanceMethod;
    maxHeight: number;
}

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
    areas?: AreaSettingsDef[];
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
    const { requestId, buffer, width, height, enabledGroups, ditheringMethod, staircasingMode, colorMethod, maxHeight, datMode, areas } = event.data;

    try {
        const pixels = new Uint8ClampedArray(buffer);
        const imageData = new ImageData(pixels, width, height);
        const groups = new Set(enabledGroups);

        const resolvedAreas: AreaSettingsResolved[] = (areas ?? []).map(a => ({
            px: a.px, py: a.py, pw: a.pw, ph: a.ph,
            enabledGroups: new Set(a.enabledGroups),
            staircasingMode: a.staircasingMode,
            colorMethod: a.colorMethod,
            maxHeight: a.maxHeight,
            yRange: getYRange(a.staircasingMode, a.maxHeight),
        }));

        if (datMode) {
            const result = applyDitheringDat(imageData, width, height, groups, ditheringMethod, colorMethod)
            const outBuffer = result.imageData.data.buffer as ArrayBuffer;
            const colorBytesBuffer = result.colorBytes.buffer.slice(0) as ArrayBuffer;

            const response: WorkerResponse = {
                type: 'result', requestId, buffer: outBuffer, width, height,
                brightnessMap: [], groupIdMap: [], yMap: [],
                colorBytesBuffer,
            };
            (self as unknown as Worker).postMessage(response, [outBuffer, colorBytesBuffer]);
        } else {
            const result = processImageData(imageData, width, height, groups, ditheringMethod, staircasingMode, colorMethod, maxHeight, resolvedAreas);
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
