"use client";

import React, {useState} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { LucideLock, LucideUnlock } from "lucide-react";
import {
    AngleSlider,
    AngleSliderRange,
    AngleSliderThumb,
    AngleSliderTrack,
    AngleSliderValue
} from "@/components/ui/angle-slider";
import { isPolygonLikeShape, Shape, ShapeMode, ShapeOptions } from "./ShapeGenerator";

type Props = {
    shape: Shape;
    options: ShapeOptions;
    setOptionsAction: React.Dispatch<React.SetStateAction<ShapeOptions>>;
};

export const ShapeInputs = ({ shape, options, setOptionsAction }: Props) => {
    const [pendingOptions, setPendingOptions] = useState<Map<string, string>>(new Map());

    const updatePending = (key: string, value: string) => {
        setPendingOptions(prev => {
            const copy = new Map(prev);
            copy.set(key, value);
            return copy;
        });
    };

    const clearPending = (key: string) => {
        setPendingOptions(prev => {
            const copy = new Map(prev);
            copy.delete(key);
            return copy;
        });
    };

    const makeNumberHandler = <K extends keyof ShapeOptions, S extends keyof ShapeOptions = never>(key: K, {min = 0, max = -1, syncWith,}: { min?: number; max?: number; syncWith?: S; } = {}) => (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= min && (max == -1 || num <= max)) {
            setOptionsAction(prev => {
                const updated: ShapeOptions = { ...prev, [key]: num } as ShapeOptions;
                if (syncWith && prev.lockRatio) {
                    (updated[syncWith] as number) = num;
                }
                return updated;
            });
            clearPending(key as string);
        } else {
            updatePending(key as string, value);
        }
    };

    const toggleLock = () => {
        setOptionsAction(prev => ({
            ...prev,
            lockRatio: !prev.lockRatio,
            height: !prev.lockRatio ? prev.width : prev.height,
        }));
    };

    const handleModeChange = (mode: ShapeMode) => {
        setOptionsAction(prev => ({ ...prev, mode }));
    };

    const handleRotationChange = (rot: number) => {
        setOptionsAction(prev => ({ ...prev, rotation: rot }));
    };

    const getValue = (key: keyof ShapeOptions) => {
        const keyStr = key as string;
        if (pendingOptions.has(keyStr)) {
            return pendingOptions.get(keyStr);
        }
        return String(options[key] ?? "");
    };

    return (
        <>
            {/* Polygon */}
            {shape === "Polygon" && (
                <div className="flex-1">
                    <Label>Sides</Label>
                    <Input
                        type="text"
                        value={getValue("sides")}
                        onChange={(e) => makeNumberHandler("sides", { min: 3 })(e.target.value)}
                        placeholder="3+"
                        className="mt-2 outline-none"
                    />
                </div>
            )}

            {isPolygonLikeShape(shape) && (
                <div>
                    <Label>Size</Label>
                    <Input
                        type="text"
                        value={getValue("width")}
                        onChange={(e) => makeNumberHandler("width", { min: 5, syncWith: "height" })(e.target.value)}
                        placeholder="5+"
                        className="mt-2 outline-none"
                    />
                </div>
            )}

            {/* Circle */}
            {(shape === "Circle") && (
                <div className="flex items-center space-x-2">
                    <div className="flex-1">
                        <Label>Width</Label>
                        <Input
                            type="text"
                            value={getValue("width")}
                            onChange={(e) => makeNumberHandler("width", { min: 3, syncWith: "height" })(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                    <button type="button" onClick={toggleLock} className="mt-6">
                        {options.lockRatio ? <LucideLock /> : <LucideUnlock />}
                    </button>
                    <div className="flex-1">
                        <Label>Height</Label>
                        <Input
                            type="text"
                            value={getValue("height")}
                            onChange={(e) => makeNumberHandler("height", { min: 3, syncWith: "width" })(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Quadrilateral */}
            {shape === "Quadrilateral" && (
                <>
                    <div>
                        <Label>Top Width</Label>
                        <Input
                            type="text"
                            value={getValue("topWidth")}
                            onChange={(e) => makeNumberHandler("topWidth", { min: 3 })(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                    <div>
                        <Label>Bottom Width</Label>
                        <Input
                            type="text"
                            value={getValue("bottomWidth")}
                            onChange={(e) => makeNumberHandler("bottomWidth", { min: 3 })(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <Label>Height</Label>
                        <Input
                            type="text"
                            value={getValue("height")}
                            onChange={(e) => makeNumberHandler("height", { min: 3 })(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                    <div>
                        <Label>Skew</Label>
                        <Input
                            type="text"
                            value={getValue("skew")}
                            onChange={(e) => makeNumberHandler("skew")(e.target.value)}
                            placeholder="0+"
                            className="mt-2 outline-none"
                        />
                    </div>
                </>
            )}

            {/* Mode / Thickness / Rotation */}
            <div className="flex items-center mt-4 max-[450]:flex-wrap">
                <div className="w-1/2 max-[450]:w-full">
                    <Tabs value={options.mode} onValueChange={v => handleModeChange(v as ShapeMode)}>
                        <TabsList className="w-full">
                            <TabsTrigger value="thick">Thick</TabsTrigger>
                            <TabsTrigger value="thin">Thin</TabsTrigger>
                            <TabsTrigger value="filled">Filled</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {options.mode === "thick" && (
                        <InputGroup className="mt-2">
                            <InputGroupInput
                                type="text"
                                value={getValue("thickness")}
                                onChange={(e) => makeNumberHandler("thickness", { min: 1 })(e.target.value)}
                                placeholder="1+"
                                className="outline-none"
                            />
                            <InputGroupAddon align="inline-end">Border Thickness</InputGroupAddon>
                        </InputGroup>
                    )}
                </div>

                <AngleSlider
                    value={[options.rotation]}
                    max={360}
                    min={0}
                    step={45}
                    onValueChange={v => handleRotationChange(v[0])}
                    size={40}
                    className="mx-auto"
                >
                    <AngleSliderTrack><AngleSliderRange /></AngleSliderTrack>
                    <AngleSliderThumb />
                    <AngleSliderValue />
                </AngleSlider>
            </div>
        </>
    );
};
