"use client";

import React from "react";
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
import {isPolygonLikeShape, Shape, ShapeMode} from "./ShapeGenerator";
import {ShapeOptions} from "./generators/ShapeGeneratorTypes";

type Props = {
    shape: Shape;
    circleOnly: boolean;

    options: ShapeOptions;
    setOptionsAction: React.Dispatch<React.SetStateAction<ShapeOptions>>;
};

export const ShapeInputs = ({shape, circleOnly, options, setOptionsAction,}: Props) => {
    const handleWidthChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setOptionsAction(prev => ({
                ...prev,
                width: num,
                height: prev.lockRatio ? num : prev.height,
            }));
        }
    };


    const handleHeightChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setOptionsAction(prev => ({
                ...prev,
                height: num,
                width: prev.lockRatio ? num : prev.width
            }));
        }
    };

    const toggleLock = () => {
        setOptionsAction(prev => ({
            ...prev,
            lockRatio: !prev.lockRatio,
            height: !prev.lockRatio ? prev.width : prev.height // optional sync on unlock
        }));
    };

    const handleThicknessChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1) {
            setOptionsAction(prev => ({ ...prev, thickness: num }));
        }
    };

    const handleModeChange = (mode: ShapeMode) => {
        setOptionsAction(prev => ({ ...prev, mode }));
    };

    const handleRotationChange = (rot: number) => {
        setOptionsAction(prev => ({ ...prev, rotation: rot }));
    };

    const handleSizeChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 5) {
            setOptionsAction(prev => ({ ...prev, size: num }));
        }
    };

    const handleSidesChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setOptionsAction(prev => ({ ...prev, sides: num, width: num, height: num }));
        }
    };

    return (
        <>
            {shape == "Polygon" && (
                <div className="flex-1">
                    <Label>Sides</Label>
                    <Input
                        type="text"
                        value={`${options.sides}`}
                        onChange={(e) => handleSidesChange(e.target.value)}
                        placeholder="3+"
                        className="mt-2 outline-none"
                    />
                </div>
            )}
            {isPolygonLikeShape(shape) && (
                <div className="">
                    <Label>Size</Label>
                    <Input
                        type="text"
                        value={`${options.width}`}
                        onChange={(e) => handleSizeChange(e.target.value)}
                        placeholder="5+"
                        className="mt-2 outline-none"
                    />
                </div>
            )}

            {shape === "Circle" && (
                <div className="flex items-center space-x-2">
                    <div className="flex-1">
                        <Label>Width</Label>
                        <Input
                            type="text"
                            value={`${options.width}`}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            placeholder={`3+`}
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
                            value={`${options.height}`}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            placeholder={`3+`}
                            className="mt-2 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Mode / Thickness / Rotation */}
            <div className="flex items-center mt-4">
                <div className="w-1/2">
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
                                value={`${options.thickness}`}
                                onChange={(e) => handleThicknessChange(e.target.value)}
                                placeholder="1+"
                                className="outline-none"
                            />
                            <InputGroupAddon align="inline-end">Border Thickness</InputGroupAddon>
                        </InputGroup>
                    )}
                </div>

                <AngleSlider
                    defaultValue={[0]}
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
