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
import { Shape, ShapeMode } from "./ShapeGenerator";
import { CircleOptions, PolygonOptions } from "./generators/ShapeGeneratorTypes";

type Props = {
    shape: Shape;
    circleOnly: boolean;

    circleOptions: CircleOptions;
    setCircleOptionsAction: React.Dispatch<React.SetStateAction<CircleOptions>>;

    polygonOptions: PolygonOptions;
    setPolygonOptionsAction: React.Dispatch<React.SetStateAction<PolygonOptions>>;
};

export const ShapeInputs = ({
                                shape,
                                circleOnly,
                                circleOptions,
                                setCircleOptionsAction,
                                polygonOptions,
                                setPolygonOptionsAction
                            }: Props) => {
    const handleWidthChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setCircleOptionsAction(prev => ({
                ...prev,
                width: num,
                height: prev.lockRatio ? num : prev.height
            }));
        }
    };

    const handleHeightChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setCircleOptionsAction(prev => ({
                ...prev,
                height: num,
                width: prev.lockRatio ? num : prev.width
            }));
        }
    };

    const toggleLock = () => {
        setCircleOptionsAction(prev => ({
            ...prev,
            lockRatio: !prev.lockRatio,
            height: !prev.lockRatio ? prev.width : prev.height // optional sync on unlock
        }));
    };

    const handleThicknessChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1) {
            if (shape === "Circle") {
                setCircleOptionsAction(prev => ({ ...prev, thickness: num }));
            } else {
                setPolygonOptionsAction(prev => ({ ...prev, thickness: num }));
            }
        }
    };

    const handleModeChange = (mode: ShapeMode) => {
        if (shape === "Circle") {
            setCircleOptionsAction(prev => ({ ...prev, mode }));
        } else {
            setPolygonOptionsAction(prev => ({ ...prev, mode }));
        }
    };

    const handleRotationChange = (rot: number) => {
        if (shape === "Circle") {
            setCircleOptionsAction(prev => ({ ...prev, rotation: rot }));
        } else {
            setPolygonOptionsAction(prev => ({ ...prev, rotation: rot }));
        }
    };

    const handleSizeChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 5) {
            setPolygonOptionsAction(prev => ({ ...prev, size: num }));
        }
    };

    const handleSidesChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 3) {
            setPolygonOptionsAction(prev => ({ ...prev, sides: num }));
        }
    };

    return (
        <>
            {shape === "Polygon" && (
                <>
                    <div className="flex-1">
                        <Label>Sides</Label>
                        <Input
                            type="text"
                            value={`${polygonOptions.sides}`}
                            onChange={(e) => handleSidesChange(e.target.value)}
                            placeholder="3+"
                            className="mt-2 outline-none"
                        />
                    </div>
                    <div className="">
                        <Label>Size</Label>
                        <Input
                            type="text"
                            value={`${polygonOptions.size}`}
                            onChange={(e) => handleSizeChange(e.target.value)}
                            placeholder="5+"
                            className="mt-2 outline-none"
                        />
                    </div>
                </>
            )}

            {shape === "Circle" && (
                <div className="flex items-center space-x-2">
                    <div className="flex-1">
                        <Label>Width</Label>
                        <Input
                            type="text"
                            value={`${circleOptions.width}`}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            placeholder={`3+`}
                            className="mt-2 outline-none"
                        />
                    </div>
                    <button type="button" onClick={toggleLock} className="mt-6">
                        {circleOptions.lockRatio ? <LucideLock /> : <LucideUnlock />}
                    </button>
                    <div className="flex-1">
                        <Label>Height</Label>
                        <Input
                            type="text"
                            value={`${circleOptions.height}`}
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
                    <Tabs value={shape === "Circle" ? circleOptions.mode : polygonOptions.mode} onValueChange={v => handleModeChange(v as ShapeMode)}>
                        <TabsList className="w-full">
                            <TabsTrigger value="thick">Thick</TabsTrigger>
                            <TabsTrigger value="thin">Thin</TabsTrigger>
                            <TabsTrigger value="filled">Filled</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    { (shape === "Circle" ? circleOptions.mode : polygonOptions.mode) === "thick" && (
                        <InputGroup className="mt-2">
                            <InputGroupInput
                                type="text"
                                value={`${shape === "Circle" ? circleOptions.thickness : polygonOptions.thickness}`}
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
