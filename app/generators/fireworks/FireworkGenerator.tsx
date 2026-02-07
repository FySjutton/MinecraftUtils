'use client';

import React, {useState, useRef, RefObject, useEffect} from 'react';
import {FireworkCanvas, FireworkCanvasRef} from "@/app/generators/fireworks/preview/fireworkCanvas";
import {FireworkColors} from "@/lib/Colors";
import {FireworkExplosion, FireworkShape} from "@/app/generators/fireworks/base/algorithms";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import ImageObj from "next/image";
import DyePicker from "@/components/inputs/DyePicker";
import {toTitleCase} from "@/lib/StringUtils";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {createPortal} from "react-dom";
import {InputField} from "@/components/inputs/InputField";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Dot} from "lucide-react";
import {MultiSelectDropdown} from "@/components/inputs/dropdowns/MultiSelectDropdown";

export default function FireworkGenerator() {
    const canvasRef = useRef<FireworkCanvasRef>(null);
    const [particleCount, setParticleCount] = useState(0);
    const [randomRotation, setRandomRotation] = useState(false);
    const [duration, setDuration] = useState("1");
    const [explosions, setExplosions] = useState<Record<string, FireworkExplosion>>({
        "0": {
            shape: 'LARGE_BALL',
            colors: [FireworkColors.BLUE],
            fadeColors: [FireworkColors.LIGHT_BLUE],
            hasTrail: false,
            hasTwinkle: false,
        }
    });
    const [selectedId, setSelectedId] = useState<string>("0");
    const [explosion, setExplosion] = useState<FireworkExplosion>(explosions[selectedId]);

    const [renderCanvas, setRenderCanvas] = useState(false);

    const handleLaunch = (explosionIds: string[]) => {
        canvasRef.current?.launchFirework(Object.entries(explosions).filter(([id]) => explosionIds.includes(id)).map((entry) => entry[1]));
    };

    const handleRandomRotationChange = (enabled: boolean) => {
        setRandomRotation(enabled);
        canvasRef.current?.setRandomRotation(enabled);
    };

    const shapes: FireworkShape[] = ['SMALL_BALL', 'LARGE_BALL', 'STAR', 'CREEPER', 'BURST'];

    useEffect(() => {
        setExplosion(explosions[selectedId]);
    }, [selectedId, explosions]);

    const updateExplosion = (updates: Partial<FireworkExplosion>) => {
        setExplosions(prev => ({
            ...prev,
            [selectedId]: {
                ...prev[selectedId],
                ...updates
            }
        }));

        setExplosion(prev => ({ ...prev, ...updates }));
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
            <Card>
                <CardHeader>
                    <CardTitle>Explosion List</CardTitle>
                    <CardDescription>You can have more than explosion in the same firework. Here you can create a list of them, allowing you to make some colors flicker, and some not for example.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedId} onValueChange={setSelectedId}>
                        <TabsList>
                            {Object.entries(explosions).map(([id]) => (
                                <TabsTrigger key={id} value={id}>#{id}</TabsTrigger>
                            ))}
                            <Dot />
                            <Button variant="ghost" className="px-1" onClick={() => {
                                const newId = Object.keys(explosions).length.toString();
                                const newExplosion: FireworkExplosion = {
                                    shape: 'LARGE_BALL',
                                    colors: [FireworkColors.BLUE],
                                    fadeColors: [FireworkColors.LIGHT_BLUE],
                                    hasTrail: false,
                                    hasTwinkle: false
                                };

                                setExplosions(prev => ({
                                    ...prev,
                                    [newId]: newExplosion,
                                }));

                                setSelectedId(newId);
                                setExplosion(newExplosion);
                            }}>Create New</Button>

                            {Object.keys(explosions).length > 1 &&
                                <><Dot/><Button variant={"ghost"} className="px-1" onClick={() => {
                                    if (!window.confirm("Delete this explosion?")) return;

                                    setExplosions(prev => {
                                        const entries = Object.entries(prev)
                                            .sort(([a], [b]) => Number(a) - Number(b))
                                            .filter(([id]) => id !== selectedId);

                                        const reindexed: Record<string, FireworkExplosion> = {};

                                        entries.forEach(([, explosion], index) => {
                                            reindexed[index.toString()] = explosion;
                                        });

                                        const nextSelected = reindexed[selectedId] !== undefined ? selectedId : Object.keys(reindexed)[0] ?? "0";

                                        setSelectedId(nextSelected);
                                        setExplosion(reindexed[nextSelected]);

                                        return reindexed;
                                    });
                                }}>Delete Current</Button></>
                            }
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex flex-col gap-y-4 items-center">
                    <Button className="w-full" onClick={() => setRenderCanvas(true)}>Open Preview Screen</Button>
                    {renderCanvas && <FireworkPreview canvasRef={canvasRef} setParticleCount={setParticleCount} handleLaunch={handleLaunch} particleCount={particleCount} randomRotation={randomRotation} setRandomRotation={handleRandomRotationChange} setRenderCanvas={setRenderCanvas} explosions={explosions}/>}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex flex-col items-center pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Explosion #{selectedId}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
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
                            {explosion.colors.length > (8 - +explosion.hasTrail - +explosion.hasTwinkle) && <p className="text-orange-400 mt-4">Warning: You have too many primary colors, this can&#39;t be crafted in a crafting table!</p>}

                            <p className="mt-6 text-2xl font-semibold mb-2">Fade Colors</p>
                            <DyePicker selected={explosion.fadeColors} onSelectAction={(color) => {toggleColor(color, true)}} colorList={FireworkColors} />
                            {explosion.fadeColors.length > 8 && <p className="text-orange-400 mt-4">Warning: You have too many fade colors, this can&#39;t be crafted in a crafting table!</p>}
                        </CardContent>
                    </Card>

                    <p className="mt-6 text-2xl font-semibold">Rocket Height</p>
                    <p className="text-gray-300 mb-2">How high the rocket will shoot. The ranges are by placing it with with hand. Using a dispenser it will be 9-10, 14-15 and 19-20. Low costs one gunpowder, high costs three.</p>
                    <Tabs value={duration} onValueChange={setDuration}>
                        <TabsList>
                            <TabsTrigger value="1">Low (8-20)</TabsTrigger>
                            <TabsTrigger value="2">Medium (18-34)</TabsTrigger>
                            <TabsTrigger value="3">High (32-52)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <InputField
                        value={getGiveCommand(Object.values(explosions), duration)}
                        readOnly
                        showCopy
                    />
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
                className="select-none pointer-events-none"
            />
            <p className="mt-2">{toTitleCase(shape.replaceAll("_", " "))}</p>
        </div>
    )
}

function FireworkPreview({canvasRef, setParticleCount, handleLaunch, randomRotation, setRandomRotation, particleCount, setRenderCanvas, explosions}: {
    explosions: Record<string, FireworkExplosion>
    handleLaunch: (explosionIds: string[]) => void ;
    particleCount: number;
    randomRotation: boolean;
    setRandomRotation: (enabled: boolean) => void;
    canvasRef: RefObject<FireworkCanvasRef | null>;
    setParticleCount: React.Dispatch<React.SetStateAction<number>>;
    setRenderCanvas: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [selected, setSelected] = useState<string[]>(Object.keys(explosions))

    return createPortal(
        <div className="fixed inset-0 z-[50] p-5">
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
                        <div className="flex gap-8 items-center">
                            <div className="text-sm text-muted-foreground text-center">
                                Active particles: {particleCount}
                            </div>
                            <div className="flex flex-col gap-2 mb-1">
                                <MultiSelectDropdown
                                    items={Object.keys(explosions)}
                                    selected={selected}
                                    onChange={(selected) => setSelected(selected)}
                                    className="z-[51]"
                                />
                                <div className="flex items-center gap-2 justify-center">
                                    <Switch
                                        id="rotation"
                                        checked={randomRotation}
                                        onCheckedChange={setRandomRotation}
                                    />
                                    <Label htmlFor="rotation" className="cursor-pointer">Random Rotation</Label>
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => {handleLaunch(selected)}} size="lg" className="w-full max-w-xl">
                            Launch Firework
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>,
        document.body
    );
}

function getGiveCommand(explosions: FireworkExplosion[], duration: string) {
    const explosionList: string[] = []

    for (const explosion of explosions) {
        const primaryColors: number[] = [];
        const fadeColors: number[] = [];

        for (const color of explosion.colors) {
            primaryColors.push(parseInt(color.replace(/^#/, ''), 16));
        }

        for (const color of explosion.fadeColors) {
            fadeColors.push(parseInt(color.replace(/^#/, ''), 16));
        }

        explosionList.push(`{shape:"${explosion.shape.toLowerCase()}",has_twinkle:${+explosion.hasTwinkle},has_trail:${+explosion.hasTrail},colors:[I;${primaryColors.join(",")}],fade_colors:[I;${fadeColors.join(",")}]}`)
    }

    return `/give @p firework_rocket[fireworks={flight_duration:${duration},explosions:[${explosionList.join(",")}]}] 1`
}