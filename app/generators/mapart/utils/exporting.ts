import {BlockSelection, Brightness, ProcessingStats, StaircasingMode} from "@/app/generators/mapart/utils/utils";
import {calculate3DStructure} from "@/app/generators/mapart/utils/staircasing";
import {exportStructureNBT, exportStructureNBTToBlob} from "@/lib/schematics/nbtExport";

export async function exportPNG(processedImageData: ImageData | null, processingStats: ProcessingStats | null, mapWidth: number, mapHeight: number) {
    if (!processedImageData || !processingStats) return;

    const totalWidth = processingStats.width;
    const totalHeight = processingStats.height;

    // If single map, just export directly
    if (mapWidth === 1 && mapHeight === 1) {
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.putImageData(processedImageData, 0, 0);

        const link = document.createElement('a');
        link.download = 'minecraft-mapart.png';
        link.href = canvas.toDataURL();
        link.click();
        return;
    }

    // Multiple maps - create zip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = totalWidth;
    sourceCanvas.height = totalHeight;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return;
    sourceCtx.putImageData(processedImageData, 0, 0);

    // Split into 128x128 chunks
    for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
            const chunkCanvas = document.createElement('canvas');
            chunkCanvas.width = 128;
            chunkCanvas.height = 128;
            const chunkCtx = chunkCanvas.getContext('2d');
            if (!chunkCtx) continue;

            // Copy chunk from source
            const sx = col * 128;
            const sy = row * 128;
            chunkCtx.drawImage(sourceCanvas, sx, sy, 128, 128, 0, 0, 128, 128);

            // Convert to blob and add to zip
            const blob = await new Promise<Blob>((resolve) => {
                chunkCanvas.toBlob((b) => resolve(b!), 'image/png');
            });

            zip.file(`map_${col}_${row}.png`, blob);
        }
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'minecraft-map-art.zip';
    link.href = URL.createObjectURL(content);
    link.click();
    URL.revokeObjectURL(link.href);
}

export async function export3d(
    processedImageData: ImageData | null, processingStats: ProcessingStats | null,
    mapWidth: number, mapHeight: number, brightnessMap: Brightness[][] | null,
    groupIdMap: number[][] | null, yMap: number[][] | null,
    blockSelection: BlockSelection, staircasingMode: StaircasingMode,
    addSupportBlocks: boolean
) {
    if (!processedImageData || !processingStats || !brightnessMap || !groupIdMap || !yMap) return;

    // If single map, export directly
    if (mapWidth === 1 && mapHeight === 1) {
        const structure = calculate3DStructure(
            brightnessMap,
            groupIdMap,
            yMap,
            blockSelection,
            staircasingMode,
            addSupportBlocks,
            'netherrack'
        );
        exportStructureNBT(structure, 'minecraftutils_mapart.nbt');
        return;
    }

    // Multiple maps, create zip with NBT files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let row = 0; row < mapHeight; row++) {
        for (let col = 0; col < mapWidth; col++) {
            // Extract 128x128 chunk from maps
            const chunkBrightnessMap: Brightness[][] = [];
            const chunkGroupIdMap: number[][] = [];
            const chunkYMap: number[][] = [];

            for (let z = 0; z < 128; z++) {
                const sourceZ = row * 128 + z;
                chunkBrightnessMap[z] = [];
                chunkGroupIdMap[z] = [];
                chunkYMap[z] = [];

                for (let x = 0; x < 128; x++) {
                    const sourceX = col * 128 + x;
                    chunkBrightnessMap[z][x] = brightnessMap[sourceZ][sourceX];
                    chunkGroupIdMap[z][x] = groupIdMap[sourceZ][sourceX];
                    chunkYMap[z][x] = yMap[sourceZ][sourceX];
                }
            }

            const structure = calculate3DStructure(
                chunkBrightnessMap,
                chunkGroupIdMap,
                chunkYMap,
                blockSelection,
                staircasingMode,
                addSupportBlocks,
                'netherrack'
            );

            // Export to memory instead of downloading
            const nbtData = exportStructureNBTToBlob(structure);
            zip.file(`map_${col}_${row}.nbt`, nbtData);
        }
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'minecraft-map-art-3d.zip';
    link.href = URL.createObjectURL(content);
    link.click();
    URL.revokeObjectURL(link.href);
};