export enum Brightness {
    LOW = 180,
    NORMAL = 220,
    HIGH = 255,
    LOWEST = 135,
}

export enum ColorDistanceMethod {
    EUCLIDEAN = 'euclidean',
    WEIGHTED_RGB = 'weighted_rgb',
    CIE76_D65 = 'cie76_d65',
    CIE76_D50 = 'cie76_d50',
    CIE94_D65 = 'cie94_d65',
    OKLAB = 'oklab',
    HSLUV = 'hsluv',
    CIEDE2000_D65 = 'ciede2000_d65',
    CIEDE2000_D50 = 'ciede2000_d50',
}

export enum StaircasingMode {
    NONE = 'none',
    STANDARD = 'standard',
    SOUTHLINE = 'southline',
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
        title: 'Classic (North Line)',
        description: 'Full 3d staircase map. The north edge needs a filler row.',
    },
    [StaircasingMode.SOUTHLINE]: {
        title: 'Classic (South Line)',
        description: 'Full 3d staircase map. Same as Classic but the south edge has the filler row instead.',
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

export const ColorDistanceMethods: Record<ColorDistanceMethod, { title: string; description: string; badge?: string }> = {
    [ColorDistanceMethod.EUCLIDEAN]: {
        title: 'Euclidean RGB',
        description: 'Straight-line distance in RGB space. No perceptual weighting, colours that look very different may be ranked as close.',
        badge: 'Fastest',
    },
    [ColorDistanceMethod.WEIGHTED_RGB]: {
        title: 'Weighted RGB',
        description: 'Adjusts RGB channel weights based on average redness, approximating eye sensitivity. No colour-space conversion needed.',
        badge: 'Fast',
    },
    [ColorDistanceMethod.CIE76_D65]: {
        title: 'CIE76 D65',
        description: 'Euclidean distance in CIELAB using the D65 (daylight) white point, correct for sRGB monitors. Slightly uneven in blues and purples.',
    },
    [ColorDistanceMethod.CIE76_D50]: {
        title: 'CIE76 D50',
        description: 'CIE76 with the D50 (print/ICC) white point. Differences from D65 are most visible in blues and neutrals.',
    },
    [ColorDistanceMethod.CIE94_D65]: {
        title: 'CIE94 D65',
        description: 'Improves on CIE76 by weighting chroma and hue differences relative to the reference colour. Noticeably better in saturated regions.',
    },
    [ColorDistanceMethod.CIEDE2000_D65]: {
        title: 'CIEDE2000 D65',
        description: 'The international standard for perceptual colour difference (ISO 11664-6), D65 white point. Adds corrections for blues, hue rotation, and lightness.',
        badge: 'Heaviest',
    },
    [ColorDistanceMethod.CIEDE2000_D50]: {
        title: 'CIEDE2000 D50',
        description: 'CIEDE2000 with the D50 white point, matching ICC/print colour-managed pipelines. Prefer D65 for screen output.',
        badge: 'Heaviest',
    },
    [ColorDistanceMethod.OKLAB]: {
        title: 'OKLab',
        description: 'Modern perceptually-uniform space designed to fix CIELAB\'s blue/purple non-uniformity. Euclidean distance, no correction factors needed.',
        badge: 'Recommended',
    },
    [ColorDistanceMethod.HSLUV]: {
        title: 'HSLuv (CIELUV)',
        description: 'Euclidean distance in CIELUV space. Handles hue linearity differently to CIELAB, giving distinct results especially in vivid colours.',
    },
};