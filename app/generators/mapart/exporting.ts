import { BlockSelection, Brightness, ProcessingStats, StaircasingMode, SupportBlockMode } from './utils/types';
import { calculate3DStructure } from './staircasing/structure';
import { exportStructureNBT, exportStructureNBTToBlob } from '@/lib/schematics/nbtExport';

export async function exportPNG(
    processedImageData: ImageData | null,
    processingStats: ProcessingStats | null,
    mapWidth: number,
    mapHeight: number,
) {
    if (!processedImageData || !processingStats) return;

    const { width: totalWidth, height: totalHeight } = processingStats;

    if (mapWidth === 1 && mapHeight === 1) {
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        canvas.getContext('2d')!.putImageData(processedImageData, 0, 0);
        triggerDownload(canvas.toDataURL(), 'minecraft-mapart.png');
        return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = totalWidth;
    srcCanvas.height = totalHeight;
    srcCanvas.getContext('2d')!.putImageData(processedImageData, 0, 0);

    for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
            const chunk = document.createElement('canvas');
            chunk.width = 128;
            chunk.height = 128;
            chunk.getContext('2d')!.drawImage(srcCanvas, col * 128, row * 128, 128, 128, 0, 0, 128, 128);
            const blob = await canvasToBlob(chunk);
            zip.file(`map_${col}_${row}.png`, blob);
        }
    }

    triggerDownloadBlob(await zip.generateAsync({ type: 'blob' }), 'minecraft-map-art.zip');
}

export async function export3d(
    processedImageData: ImageData | null,
    processingStats: ProcessingStats | null,
    mapWidth: number,
    mapHeight: number,
    brightnessMap: Brightness[][] | null,
    groupIdMap: number[][] | null,
    yMap: number[][] | null,
    blockSelection: BlockSelection,
    supportMode: SupportBlockMode,
    supportBlock: string,
    splitIntoChunks: boolean,
    noobLine: boolean
) {
    if (!processedImageData || !processingStats || !brightnessMap || !groupIdMap || !yMap) return;

    if (!splitIntoChunks || (mapWidth === 1 && mapHeight === 1)) {
        const structure = calculate3DStructure(brightnessMap, groupIdMap, yMap, blockSelection, supportMode, supportBlock, noobLine);
        exportStructureNBT(structure, 'minecraftutils_mapart.nbt');
        return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
            const slice = <T,>(map: T[][]): T[][] =>
                Array.from({ length: 128 }, (_, z) =>
                    Array.from({ length: 128 }, (__, x) => map[row * 128 + z][col * 128 + x]),
                );

            const structure = calculate3DStructure(slice(brightnessMap), slice(groupIdMap), slice(yMap), blockSelection, supportMode, supportBlock, noobLine);
            zip.file(`map_${col}_${row}.nbt`, exportStructureNBTToBlob(structure));
        }
    }

    triggerDownloadBlob(await zip.generateAsync({ type: 'blob' }), 'minecraft-map-art-3d.zip');
}

function triggerDownload(href: string, filename: string) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = href;
    a.click();
}

function triggerDownloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
}