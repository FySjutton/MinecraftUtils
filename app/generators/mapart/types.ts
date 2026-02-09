export interface ProcessingStats {
    width: number;
    height: number;
    totalBlocks: number;
    uniqueBlocks: number;
}

export interface BlockSelection {
    [groupId: number]: string | null;
}

export enum Brightness {
    LOW = 180,
    NORMAL = 220,
    HIGH = 255,
    LOWEST = 135,
}

export interface MaterialCount {
    groupId: number;
    brightness: Brightness;
    count: number;
}