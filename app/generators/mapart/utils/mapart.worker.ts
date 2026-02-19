import { processImageDataDirect } from './imageProcessing';
import { ColorDistanceMethod, StaircasingMode, Brightness } from './utils';
import { DitheringMethodName } from './dithering';

export type WorkerRequest = {
    requestId: number;
    buffer: ArrayBuffer;
    width: number;
    height: number;
    enabledGroups: number[];
    ditheringMethod: DitheringMethodName;
    staircasingMode: StaircasingMode;
    colorMethod: ColorDistanceMethod;
    maxHeight: number;
};

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
}
    | {
    type: 'error';
    requestId: number;
    message: string;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { requestId, buffer, width, height, enabledGroups, ditheringMethod, staircasingMode, colorMethod, maxHeight } = event.data;

    try {
        const pixels = new Uint8ClampedArray(buffer);
        const imageData = new ImageData(pixels, width, height);

        const result = processImageDataDirect(
            imageData, width, height,
            new Set(enabledGroups),
            ditheringMethod, staircasingMode, colorMethod,
            maxHeight
        );

        const outBuffer = result.imageData.data.buffer;

        const response: WorkerResponse = {
            type: 'result',
            requestId,
            buffer: outBuffer,
            width,
            height,
            brightnessMap: result.brightnessMap,
            groupIdMap: result.groupIdMap,
            yMap: result.yMap,
        };

        (self as unknown as Worker).postMessage(response, [outBuffer]);
    } catch (err) {
        const response: WorkerResponse = {
            type: 'error',
            requestId,
            message: err instanceof Error ? err.message : String(err),
        };
        (self as unknown as Worker).postMessage(response);
    }
};