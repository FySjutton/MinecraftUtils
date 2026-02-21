'use client';

import { useState } from 'react';
import { ColorDistanceMethod, StaircasingMode, SupportBlockMode } from '@/app/generators/mapart/utils/types';
import { DitheringMethodName, DitheringMethods } from '@/app/generators/mapart/dithering/types';
import { CropMode } from './useImagePreprocessing';

export interface Settings {
    // Map size
    mapWidth: number;
    mapHeight: number;

    // Processing
    ditheringMethod: DitheringMethodName;
    staircasingMode: StaircasingMode;
    colorDistanceMethod: ColorDistanceMethod;
    maxHeight: number;

    // Support blocks
    supportMode: SupportBlockMode;
    supportBlockName: string;

    // Image preprocessing
    brightness: number;
    contrast: number;
    saturation: number;
    cropMode: CropMode;
    xOffset: number;
    yOffset: number;
}

export interface SettingsSetters {
    setMapWidth: (v: number) => void;
    setMapHeight: (v: number) => void;
    setDitheringMethod: (v: DitheringMethodName) => void;
    setStaircasingMode: (v: StaircasingMode) => void;
    setColorDistanceMethod: (v: ColorDistanceMethod) => void;
    setMaxHeight: (v: number) => void;
    setSupportMode: (v: SupportBlockMode) => void;
    setSupportBlockName: (v: string) => void;
    setBrightness: (v: number) => void;
    setContrast: (v: number) => void;
    setSaturation: (v: number) => void;
    setCropMode: (v: CropMode) => void;
    setXOffset: (v: number) => void;
    setYOffset: (v: number) => void;
}

export function useSettings(): { settings: Settings; setters: SettingsSetters } {
    const [mapWidth, setMapWidth] = useState(1);
    const [mapHeight, setMapHeight] = useState(1);
    const [ditheringMethod, setDitheringMethod] = useState<DitheringMethodName>(DitheringMethods.floyd_steinberg);
    const [staircasingMode, setStaircasingMode] = useState<StaircasingMode>(StaircasingMode.VALLEY);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.OKLAB);
    const [maxHeight, setMaxHeight] = useState(3);
    const [supportMode, setSupportMode] = useState<SupportBlockMode>(SupportBlockMode.NONE);
    const [supportBlockName, setSupportBlockName] = useState('netherrack');
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [cropMode, setCropMode] = useState<CropMode>(CropMode.SCALE_CROP);
    const [xOffset, setXOffset] = useState(50);
    const [yOffset, setYOffset] = useState(50);

    const settings: Settings = {
        mapWidth, mapHeight,
        ditheringMethod, staircasingMode, colorDistanceMethod, maxHeight,
        supportMode, supportBlockName,
        brightness, contrast, saturation, cropMode, xOffset, yOffset,
    };

    const setters: SettingsSetters = {
        setMapWidth, setMapHeight,
        setDitheringMethod, setStaircasingMode, setColorDistanceMethod, setMaxHeight,
        setSupportMode, setSupportBlockName,
        setBrightness, setContrast, setSaturation, setCropMode, setXOffset, setYOffset,
    };

    return { settings, setters };
}