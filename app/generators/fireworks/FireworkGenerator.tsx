'use client';

import React, {useState, useRef, RefObject, useEffect} from 'react';
import {FireworkCanvas, FireworkCanvasRef} from "@/app/generators/fireworks/fireworkCanvas";
import {FireworkColors} from "@/lib/Colors";
import {FireworkExplosion, FireworkShape} from "@/app/generators/fireworks/algorithms";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import ImageObj from "next/image";
import DyePicker from "@/components/DyePicker";
import {toTitleCase} from "@/lib/StringUtils";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {createPortal} from "react-dom";

export default function FireworkGenerator() {
    const canvasRef = useRef<FireworkCanvasRef>(null);
    const [particleCount, setParticleCount] = useState(0);
    const [randomRotation, setRandomRotation] = useState(false);
    const [explosion, setExplosion] = useState<FireworkExplosion>({
        shape: 'LARGE_BALL',
        colors: [FireworkColors.RED, FireworkColors.ORANGE],
        fadeColors: [FireworkColors.YELLOW],
        hasTrail: true,
        hasTwinkle: true,
    });
    const [renderCanvas, setRenderCanvas] = useState(false);

    const handleLaunch = () => {
        canvasRef.current?.launchFirework(explosion);
    };

    const handleRandomRotationChange = (enabled: boolean) => {
        setRandomRotation(enabled);
        canvasRef.current?.setRandomRotation(enabled);
    };

    const shapes: FireworkShape[] = ['SMALL_BALL', 'LARGE_BALL', 'STAR', 'CREEPER', 'BURST'];

    const updateExplosion = (updates: Partial<FireworkExplosion>) => {
        setExplosion({ ...explosion, ...updates });
    };

    const toggleColor = (color: string, isFade: boolean = false) => {
        const colorArray = isFade ? explosion.fadeColors : explosion.colors;

        const newColors = colorArray.includes(color)
            ? colorArray.filter((c) => c !== color)
            : [...colorArray, color];

        updateExplosion(
            isFade ? { fadeColors: newColors } : { colors: newColors }
        );
    };

    useEffect(() => {
        if (!renderCanvas) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setRenderCanvas(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [renderCanvas]);

    return (
        <div className="flex flex-col gap-4">
            {/* Preview Card - Takes full width on mobile, half on xl+ */}
            <Card>
                <CardContent className="flex flex-col gap-y-4 items-center">
                    <Button className="w-full" onClick={() => setRenderCanvas(true)}>Open Preview Screen</Button>
                    {renderCanvas && <FireworkPreview canvasRef={canvasRef} setParticleCount={setParticleCount} handleLaunch={handleLaunch} particleCount={particleCount} randomRotation={randomRotation} setRandomRotation={handleRandomRotationChange} setRenderCanvas={setRenderCanvas}/>}
                </CardContent>
            </Card>

            {/* Settings Card - Takes full width on mobile, half on xl+ */}
            <Card>
                <CardContent className="flex flex-col items-center pt-6">
                    <p className="mt-4 text-2xl font-semibold">Shape</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {shapes.map((shape) => (
                            <div key={shape}>
                                <ToggleCard shape={shape} onClickAction={() => updateExplosion({ shape })} selected={explosion.shape == shape} />
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 text-2xl font-semibold">Effects</p>
                    <div className="flex flex-wrap gap-4 mt-2 justify-center">
                        <ToggleCard shape="twinkle" onClickAction={() => updateExplosion({ hasTwinkle: !explosion.hasTwinkle })} selected={explosion.hasTwinkle} />
                        <ToggleCard shape="trail" onClickAction={() => updateExplosion({ hasTrail: !explosion.hasTrail })} selected={explosion.hasTrail} />
                    </div>

                    <p className="mt-6 text-2xl font-semibold mb-2">Primary Colors</p>
                    <DyePicker selected={explosion.colors} onSelectAction={(color) => {toggleColor(color, false)}} colorList={FireworkColors} />

                    <p className="mt-6 text-2xl font-semibold mb-2">Fade Colors</p>
                    <DyePicker selected={explosion.fadeColors} onSelectAction={(color) => {toggleColor(color, true)}} colorList={FireworkColors} />
                </CardContent>
            </Card>
        </div>
    );
}

function ToggleCard({shape, onClickAction, selected}: {
    shape: string
    onClickAction: () => void
    selected: boolean
}) {

    return (
        <div key={shape} onClick={onClickAction} className={`bg-[#080811] p-2 text-center rounded-md border cursor-pointer hover:brightness-80 ${selected ? "ring-1" : ""}`}>
            <ImageObj
                src={`/assets/tool/fireworks/previews/${shape.toLowerCase()}.png`}
                alt={shape}
                width={150}
                height={150}
            />
            <p className="mt-2">{toTitleCase(shape.replaceAll("_", " "))}</p>
        </div>
    )
}

function FireworkPreview({canvasRef, setParticleCount, handleLaunch, randomRotation, setRandomRotation, particleCount, setRenderCanvas}: {
    handleLaunch: () => void;
    particleCount: number;
    randomRotation: boolean;
    setRandomRotation: (enabled: boolean) => void;
    canvasRef: RefObject<FireworkCanvasRef | null>;
    setParticleCount: React.Dispatch<React.SetStateAction<number>>;
    setRenderCanvas: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return createPortal(
        <div className="fixed inset-0 z-[9999] p-5">
            <Card className="w-full h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={() => setRenderCanvas(false)}>Close</Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="w-full h-full flex flex-col">
                    <div className="flex-1 w-full flex items-center justify-center min-h-0">
                        <div className="w-full max-w-2xl h-full">
                            <FireworkCanvas ref={canvasRef} onParticleCountChange={setParticleCount} />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 items-center">
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-2">
                            <div className="text-sm text-muted-foreground text-center">
                                Active particles: {particleCount}
                            </div>

                            <div className="flex items-center gap-2 justify-center">
                                <Switch
                                    id="rotation"
                                    checked={randomRotation}
                                    onCheckedChange={setRandomRotation}
                                />
                                <Label htmlFor="rotation" className="cursor-pointer">Random Rotation</Label>
                            </div>
                        </div>
                        <Button onClick={handleLaunch} size="lg" className="w-full max-w-xl">
                            Launch Firework
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>,
        document.body
    );
}

