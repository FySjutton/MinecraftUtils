'use client';

import React, {useState, useRef, RefObject, useEffect} from 'react';
import {FireworkCanvas, FireworkCanvasRef} from "@/app/generators/fireworks/preview/fireworkCanvas";
import {FireworkColors, FireworkColorsReverse} from "@/lib/Colors";
import {FireworkExplosion, FireworkShape, FireworkShapes} from "@/app/generators/fireworks/base/algorithms";
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
import {Dot, Plus, Trash2} from "lucide-react";
import {MultiSelectDropdown} from "@/components/inputs/dropdowns/MultiSelectDropdown";
import {CraftingCanvas} from "@/components/CraftingCanvas";
import {findImageAsset, getImageAsset} from "@/lib/images/getImageAsset";
import {Badge} from "@/components/ui/badge";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {getFireworkStarImage} from "@/app/generators/fireworks/base/fireworkStarRenderer";
import {Separator} from "@/components/ui/separator";
import {useQueryState} from "nuqs";
import {arrayObjectParser, enumArrayParser, useUrlUpdateEmitter} from "@/lib/urlParsers";
import {CopyShareLinkInput} from "@/components/inputs/CopyShareLinkInput";

const dataParser = arrayObjectParser<FireworkExplosion>({
    shape: Object.keys(FireworkShapes),
    colors: enumArrayParser(Object.values(FireworkColors) as string[]),
    fadeColors: enumArrayParser(Object.values(FireworkColors) as string[]),
    hasTrail: "bool",
    hasTwinkle: "bool",
}).withDefault([{
    shape: 'LARGE_BALL',
    colors: [FireworkColors.blue],
    fadeColors: [FireworkColors.lime],
    hasTrail: false,
    hasTwinkle: false,
}])

export default function FireworkGenerator() {
    useUrlUpdateEmitter()
    const canvasRef = useRef<FireworkCanvasRef>(null);
    const [particleCount, setParticleCount] = useState(0);
    const [randomRotation, setRandomRotation] = useState(false);
    const [duration, setDuration] = useQueryState("len", {defaultValue: "1"});

    const [explosions, setExplosions] = useQueryState("data", dataParser);

    const [selectedId, setSelectedId] = useState<number>(0);
    const [explosion, setExplosion] = useState<FireworkExplosion>(explosions[selectedId]);

    const [renderCanvas, setRenderCanvas] = useState(false);

    const handleLaunch = (explosionIds: string[]) => {
        canvasRef.current?.launchFirework(explosions.filter((_, index) => explosionIds.includes((index + 1).toString())));
    };

    const handleRandomRotationChange = (enabled: boolean) => {
        setRandomRotation(enabled);
        canvasRef.current?.setRandomRotation(enabled);
    };

    useEffect(() => {
        setExplosion(explosions[selectedId]);
    }, [selectedId, explosions]);

    const updateExplosion = (updates: Partial<FireworkExplosion>) => {
        const index = Number(selectedId);

        setExplosions(prev =>
            prev.map((explosion, i) => i === index ? { ...explosion, ...updates } : explosion)
        );

        setExplosion(prev => ({ ...prev, ...updates }));
    };

    const getColorArray = (isFade: boolean) => isFade ? explosion.fadeColors : explosion.colors;

    const addColor = (color: string, isFade = false) => {
        const colors = getColorArray(isFade);
        updateExplosion(isFade ? { fadeColors: [...colors, color] } : { colors: [...colors, color] });
    };

    const removeColor = (color: string, isFade = false) => {
        const colors = getColorArray(isFade);
        updateExplosion(isFade ? { fadeColors: colors.filter(c => c !== color) } : { colors: colors.filter(c => c !== color) });
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
                    <Tabs value={selectedId.toString()} onValueChange={(v) => setSelectedId(parseInt(v))}>
                        <TabsList>
                            {explosions.map((_exp, index) => (
                                <TabsTrigger key={index} value={index.toString()}>#{index + 1}</TabsTrigger>
                            ))}
                            <Dot />
                            <Button variant="ghost" className="px-1" disabled={explosions.length == 7}   onClick={() => {
                                const newExplosion: FireworkExplosion = {
                                    shape: 'LARGE_BALL',
                                    colors: [FireworkColors.blue],
                                    fadeColors: [FireworkColors.lime],
                                    hasTrail: false,
                                    hasTwinkle: false,
                                };

                                setExplosions(prev => [...prev, newExplosion]);
                                setSelectedId(explosions.length);
                                setExplosion(newExplosion);
                            }}>Create New</Button>

                            {explosions.length > 1 &&
                                <><Dot/><Button variant={"ghost"} className="px-1" onClick={() => {
                                    if (!window.confirm("Delete this explosion?")) return;

                                    setExplosions(prev => {
                                        const newArr = prev.filter((_, index) => index !== Number(selectedId));
                                        const nextSelected = Number(selectedId) < newArr.length ? selectedId : (newArr.length - 1);

                                        setSelectedId(nextSelected);
                                        setExplosion(newArr[Number(nextSelected)]);

                                        return newArr;
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
                            <CardTitle>Explosion #{selectedId + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <p className="mt-4 text-2xl font-semibold">Shape</p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                {Object.keys(FireworkShapes).map((shape) => (
                                    <div key={shape}>
                                        <ToggleCard shape={shape} onClickAction={() => updateExplosion({ shape: shape as FireworkShape })} selected={explosion.shape == shape} />
                                    </div>
                                ))}
                            </div>

                            <p className="mt-6 text-2xl font-semibold">Effects</p>
                            <div className="flex flex-wrap gap-4 mt-2 justify-center">
                                <ToggleCard shape="twinkle" onClickAction={() => updateExplosion({ hasTwinkle: !explosion.hasTwinkle })} selected={explosion.hasTwinkle} />
                                <ToggleCard shape="trail" onClickAction={() => updateExplosion({ hasTrail: !explosion.hasTrail })} selected={explosion.hasTrail} />
                            </div>

                            <p className="mt-6 text-2xl font-semibold mb-2">Primary Colors</p>
                            <Card>
                                <CardContent >
                                    <DyeChooser explosion={explosion} addColor={addColor} removeColor={removeColor} isFade={false} />
                                </CardContent>
                            </Card>
                            {((explosion.colors.length == 0) || (explosion.colors.length > (8 - +explosion.hasTrail - +explosion.hasTwinkle - +(explosion.shape != "SMALL_BALL")))) && <p className="text-orange-400 mt-4">Warning: You have too many/few primary colors, this can&#39;t be crafted in a crafting table!</p>}

                            <p className="mt-6 text-2xl font-semibold mb-2">Fade Colors</p>
                            <Card>
                                <CardContent >
                                    <DyeChooser explosion={explosion} addColor={addColor} removeColor={removeColor} isFade={true} />
                                </CardContent>
                            </Card>
                            {explosion.fadeColors.length > 8 && <p className="text-orange-400 mt-4">Warning: You have too many fade colors, this can&#39;t be crafted in a crafting table!</p>}
                        </CardContent>
                    </Card>

                    <p className="mt-6 text-2xl font-semibold">Rocket Height</p>
                    <p className="text-gray-300 mb-2 text-center">How high the rocket will shoot. The ranges are by placing it with with hand. Using a dispenser it will be 9-10, 14-15 and 19-20. Low costs one gunpowder, high costs three.</p>
                    <Tabs value={duration} onValueChange={setDuration}>
                        <TabsList>
                            <TabsTrigger value="1">Low (8-20)</TabsTrigger>
                            <TabsTrigger value="2">Medium (18-34)</TabsTrigger>
                            <TabsTrigger value="3">High (32-52)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {(parseInt(duration) + explosions.length > 8) && <p className="text-orange-400 mt-4">Warning: You have too many explosions or too high rocket! This can&#39;t be crafted in a crafting table!</p>}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="max-w-xl w-full mx-auto">
                    <p className="text-xl font-semibold text-center my-2">Preview Firework</p>
                    <Button className="w-full" onClick={() => setRenderCanvas(true)}>Click to preview</Button>

                    <p className="text-xl font-semibold text-center my-2">Give Command</p>
                    <InputField
                        value={getGiveCommand(Object.values(explosions), duration)}
                        readOnly
                        showCopy
                    />

                    <p className="text-xl font-semibold text-center my-2">Share Firework</p>
                    <CopyShareLinkInput label="" />

                    <Separator className="mt-4"/>

                    {((
                        explosion.colors.length == 0 || (explosion.colors.length > (8 - +explosion.hasTrail - +explosion.hasTwinkle - +(explosion.shape != "SMALL_BALL")))) || (
                        explosion.fadeColors.length > 8) || (
                        parseInt(duration) + explosions.length > 8
                    )) ? (
                        <p className="text-orange-400 mt-4 text-center">Warning: Some options are incompatible, and this firework can&#39;t therefore be crafted using a crafting table. It may still be possible to spawn using commands.</p>
                    ) : (
                        <div className="w-full">
                            {Object.entries(explosions).map(([id, exp], index) => (
                                <div key={id}>
                                    <p className="text-xl font-semibold text-center my-2">Explosion {index + 1} - Firework Star</p>
                                    <CraftingCanvas inputs={[
                                        ...exp.colors.map(e => findImageAsset(FireworkColorsReverse[e])),
                                        ...(exp.hasTrail ? [getImageAsset("diamond")] : []),
                                        ...(exp.hasTwinkle ? [getImageAsset("glowstone")] : []),
                                        ...(FireworkShapes[exp.shape] != null ? [findImageAsset(FireworkShapes[exp.shape] as string)] : []),
                                        getImageAsset("gunpowder")
                                    ]} output={getFireworkStarImage(exp.colors)}/>

                                    {exp.fadeColors.length > 0 && (
                                        <>
                                            <p className="text-xl font-semibold text-center my-2">Explosion {index + 1} - Fading</p>
                                            <CraftingCanvas inputs={[
                                                getFireworkStarImage(exp.colors),
                                                ...exp.fadeColors.map(e => findImageAsset(FireworkColorsReverse[e])),
                                            ]} output={getFireworkStarImage(exp.colors)}/>
                                        </>
                                    )}
                                </div>
                            ))}
                            <p className="text-xl font-semibold text-center my-2">Final Step - Rocket Crafting</p>
                            <CraftingCanvas inputs={[
                                getImageAsset("paper"),
                                ...Array(parseInt(duration)).fill(getImageAsset("gunpowder")),
                                ...Object.values(explosions).map(e => getFireworkStarImage(e.colors)),
                            ]} output={getImageAsset("firework")} />
                        </div>
                    )}
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
                src={findImageAsset(shape.toLowerCase(), "fireworks")}
                alt={shape}
                width={150}
                height={150}
                className="select-none pointer-events-none"
            />
            <p className="mt-2">{toTitleCase(shape, true)}</p>
        </div>
    )
}

function FireworkPreview({canvasRef, setParticleCount, handleLaunch, randomRotation, setRandomRotation, particleCount, setRenderCanvas, explosions}: {
    explosions: FireworkExplosion[]
    handleLaunch: (explosionIds: string[]) => void ;
    particleCount: number;
    randomRotation: boolean;
    setRandomRotation: (enabled: boolean) => void;
    canvasRef: RefObject<FireworkCanvasRef | null>;
    setParticleCount: React.Dispatch<React.SetStateAction<number>>;
    setRenderCanvas: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const values = explosions.map(((_e, id) => (id + 1).toString()))
    const [selected, setSelected] = useState<string[]>(values);

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
                                    items={values}
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

function DyeChooser({explosion, addColor, removeColor, isFade}: {
    explosion: FireworkExplosion,
    addColor: (color: string, isFade: boolean) => void
    removeColor: (color: string, isFade: boolean) => void,
    isFade: boolean
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col items-center">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center justify-between">
                        Add Color <Plus />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="p-2 w-auto max-w-[90vw] mx-2 box-border">
                    <DyePicker
                        colorList={FireworkColors}
                        onSelectAction={(color) => {
                            addColor(color, isFade);
                            setOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
            {(isFade ? explosion.fadeColors : explosion.colors).length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {(isFade ? explosion.fadeColors : explosion.colors).map((color, index) => (
                        <Badge key={index} style={{ backgroundColor: color }} className="group ring-1 relative text-white text-stroke-black cursor-pointer" onClick={() => {removeColor(color, isFade)}}>
                            <span className="opacity-100 group-hover:opacity-0 transition-opacity">
                                <div className="flex gap-2 items-center">
                                    <ImageObj
                                        src={findImageAsset(FireworkColorsReverse[color])}
                                        alt={""}
                                        width={16}
                                        height={16}
                                    />
                                    {toTitleCase(FireworkColorsReverse[color], true)}
                                </div>
                            </span>

                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 text-red-400 text-stroke-black" />
                            </span>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
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