export enum Brightness {
    LOW = 180,
    NORMAL = 220,
    HIGH = 255,
    LOWEST = 135,
}

export enum ColorDistanceMethod {
    EUCLIDEAN = 'euclidean',
    WEIGHTED_RGB = 'weighted_rgb',
    DELTA_E_2000 = 'delta_e_2000',
}

export enum StaircasingMode {
    NONE = 'none',
    STANDARD = 'standard',
    STANDARD_CUSTOM = 'standard_custom',
    VALLEY = 'valley',
    VALLEY_CUSTOM = 'valley_custom',
}

export enum SupportBlockMode {
    NONE = 'None',
    THIN = 'All (Thin)',
    HEAVY = 'All (Heavy)',
}

export interface ProcessingStats {
    width: number;
    height: number;
    totalBlocks: number;
    uniqueBlocks: number;
}

export interface BlockSelection {
    [groupId: number]: string | null;
}

export interface MaterialCount {
    groupId: number;
    brightness: Brightness;
    count: number;
}

export interface Structure3D {
    width: number;
    height: number;
    depth: number;
    blocks: Block3D[];
}

export interface Block3D {
    x: number;
    y: number;
    z: number;
    blockName: string;
}

export interface ProcessedImageResult {
    imageData: ImageData;
    brightnessMap: Brightness[][];
    groupIdMap: number[][];
    yMap: number[][];
}

export const StaircasingModes: Record<StaircasingMode, { title: string; description: string }> = {
    [StaircasingMode.NONE]: {
        title: 'Flat Map (2d)',
        description: 'Completely flat map, less accurate',
    },
    [StaircasingMode.STANDARD]: {
        title: 'Classic',
        description: 'Full 3d map, fully accurate',
    },
    [StaircasingMode.STANDARD_CUSTOM]: {
        title: 'Classic Limited Height (%s)',
        description: 'Limited 3d map, mostly accurate, easier to build',
    },
    [StaircasingMode.VALLEY]: {
        title: 'Valley',
        description: 'Valley map, fully accurate, easier to build',
    },
    [StaircasingMode.VALLEY_CUSTOM]: {
        title: 'Valley Limited Height (%s)',
        description: 'Limited valley map, mostly accurate, even easier to build',
    },
};