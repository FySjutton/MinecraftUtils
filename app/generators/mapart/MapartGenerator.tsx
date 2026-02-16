'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {Upload, Download, RotateCcw, ChevronDown, ChevronUp, Dot} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    ProcessingStats,
    BlockSelection,
    MaterialCount,
    ColorDistanceMethod,
    StaircasingMode,
    Brightness,
    scaleRGB,
    getMaterialList,
    BLOCK_GROUPS, BASE_COLORS, getDefaultBlockSelection, ALIASES, Preset, Presets
} from './utils/utils';
import {numberToHex} from './utils/colorMatching';
import { processImage } from './utils/imageProcessing';
import { ZoomViewport } from './ZoomViewport';
import {ditheringMethods, DitheringMethodName, DitheringMethods} from './utils/dithering';
import ImageObj from "next/image";
import {findImageAsset, getImageAsset} from "@/lib/images/getImageAsset";

import ImagePreprocessing from './ImagePreprocessing';
import {InputField} from "@/components/inputs/InputField";
import {ComboBox} from "@/components/inputs/dropdowns/ComboBox";
import {Separator} from "@/components/ui/separator";
import {toTitleCase} from "@/lib/StringUtils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import "./mapart.css"
import {export3d, exportPNG} from "@/app/generators/mapart/utils/exporting";
import presetsData from './inputs/presets.json';

export default function MapartGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [mapWidth, setMapWidth] = useState(1);
    const [mapHeight, setMapHeight] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [ditheringMethod, setDitheringMethod] = useState<DitheringMethodName>(DitheringMethods.FloydSteinberg);
    const [staircasingMode, setStaircasingMode] = useState<StaircasingMode>(StaircasingMode.STANDARD);
    const [colorDistanceMethod, setColorDistanceMethod] = useState<ColorDistanceMethod>(ColorDistanceMethod.WEIGHTED_RGB);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [blockSelection, setBlockSelection] = useState<BlockSelection>(() => getDefaultBlockSelection());
    const [materialList, setMaterialList] = useState<MaterialCount[]>([]);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [brightnessMap, setBrightnessMap] = useState<Brightness[][] | null>(null);
    const [groupIdMap, setGroupIdMap] = useState<number[][] | null>(null);
    const [yMap, setYMap] = useState<number[][] | null>(null);
    const [addSupportBlocks, setAddSupportBlocks] = useState(true);
    const [preprocessedCanvas, setPreprocessedCanvas] = useState<HTMLCanvasElement | null>(null);
    const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
    const [materialBlockSnapshot, setMaterialBlockSnapshot] = useState<BlockSelection>({})

    const expandedRef = useRef<HTMLDivElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMaterialBlockSnapshot({ ...blockSelection })
    }, [materialList]) // do NOT add blockSelection to this

    const [currentPreset, setCurrentPreset] = useState<string>("Custom");
    const presetInputRef = useRef<HTMLInputElement>(null);

// Apply a preset
    const applyPreset = (presetName: string) => {
        console.log("APPLYING PRESET")
        if (presetName === "Custom") return;

        const preset = presetsData[presetName as Preset];
        if (!preset) return;

        const newSelection: BlockSelection = {};
        Object.entries(preset).forEach(([groupId, blockName]) => {
            newSelection[parseInt(groupId) - 1] = blockName as string;
        });

        setBlockSelection(newSelection);
        setCurrentPreset(presetName);
    };

// Export preset
    const handleExportPreset = () => {
        console.log("EXPORTING")
        const presetName = currentPreset === "Custom" ? "My_Preset" : currentPreset;
        const data = { [presetName]: blockSelection };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presetName.toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

// Import preset
    const handleImportPreset = (file: File) => {
        console.log("IMPORTING")
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                const presetName = Object.keys(imported)[0];
                const presetData = imported[presetName];

                const newSelection: BlockSelection = {};
                Object.entries(presetData).forEach(([groupId, blockName]) => {
                    newSelection[parseInt(groupId)] = blockName as string;
                });

                setBlockSelection(newSelection);
                setCurrentPreset(presetName);
            } catch (error) {
                alert('Invalid preset file');
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        if (expandedGroup === null) return

        const handleClickOutside = (e: MouseEvent) => {
            if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
                setExpandedGroup(null)
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setExpandedGroup(null)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [expandedGroup])

    const getEnabledGroups = useCallback((): Set<number> => {
        const enabled = new Set<number>();
        Object.entries(blockSelection).forEach(([groupId, blockName]) => {
            if (blockName !== null) {
                enabled.add(parseInt(groupId));
            }
        });
        if (enabled.size === 0) {
            for (let i = 0; i < BLOCK_GROUPS.length; i++) {
                enabled.add(i);
            }
        }
        return enabled;
    }, [blockSelection]);

    const handleProcessImage = useCallback(() => {
        if (!preprocessedCanvas) return;

        setTimeout(() => {
            const enabledGroups = getEnabledGroups();
            const blockSize = mapWidth * 128;
            const blockHeight = mapHeight * 128;

            const img = new Image();
            img.src = preprocessedCanvas.toDataURL();

            img.onload = () => {
                const result = processImage(
                    img,
                    blockSize,
                    blockHeight,
                    enabledGroups,
                    ditheringMethod,
                    staircasingMode,
                    colorDistanceMethod
                );

                const materials = getMaterialList(result.brightnessMap, result.groupIdMap);
                setMaterialList(materials);

                setProcessingStats({
                    width: blockSize,
                    height: blockHeight,
                    totalBlocks: blockSize * blockHeight,
                    uniqueBlocks: materials.length
                });

                setProcessedImageData(result.imageData);
                setBrightnessMap(result.brightnessMap);
                setGroupIdMap(result.groupIdMap);
                setYMap(result.yMap);
            };
        }, 50);
    }, [preprocessedCanvas, mapWidth, mapHeight, ditheringMethod, staircasingMode, colorDistanceMethod, getEnabledGroups, blockSelection]);

    useEffect(() => {
        if (preprocessedCanvas) {
            handleProcessImage();
        }
    }, [preprocessedCanvas, handleProcessImage]);

    const handleFileUpload = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target?.result as string;
                setImage(imgSrc);

                // Create image element for preprocessing
                const img = new Image();
                img.onload = () => setSourceImageElement(img);
                img.src = imgSrc;

                setProcessingStats(null);
                setMaterialList([]);
                setProcessedImageData(null);
                setBrightnessMap(null);
                setGroupIdMap(null);
                setYMap(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileUpload(file);
    };

    const handleExportPNG = async () => {
        await exportPNG(processedImageData, processingStats, mapWidth, mapHeight)
    };

    const handleExport3D = async () => {
        await export3d(processedImageData, processingStats, mapWidth, mapHeight, brightnessMap, groupIdMap, yMap, blockSelection, staircasingMode, addSupportBlocks)
    };

    const handleReset = () => {
        setImage(null);
        setSourceImageElement(null);
        setPreprocessedCanvas(null);
        setProcessingStats(null);
        setMaterialList([]);
        setProcessedImageData(null);
        setBrightnessMap(null);
        setGroupIdMap(null);
        setYMap(null);
    };

    const toggleBlockSelection = (groupId: number, blockName: string) => {
        setCurrentPreset("Custom"); // Switch to Custom when user manually changes
        setBlockSelection(prev => {
            const current = prev[groupId];
            if (current === blockName) {
                const newSelection = { ...prev };
                delete newSelection[groupId];
                return newSelection;
            } else {
                return { ...prev, [groupId]: blockName };
            }
        });
    };

    return (
        <div className={`grid-parent ${image ? "grid-full" : "grid-start"}`}>
            <Card id="upload-image">
                <CardHeader>
                    <CardTitle>Upload Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                        }`}
                    >
                        <Upload className="mx-auto mb-2" size={32} />
                        <p className="text-sm">Drop image or click to browse</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </div>
                </CardContent>
            </Card>

            {image && (
                <>
                    {/*{image && sourceImageElement && (*/}
                        <ImagePreprocessing
                            sourceImage={sourceImageElement}
                            targetWidth={mapWidth * 128}
                            targetHeight={mapHeight * 128}
                            onProcessed={setPreprocessedCanvas}
                            id="preprocessing"
                        />
                    {/*)}*/}

                    <Card id="settings">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    value={mapWidth}
                                    onChange={(e) => setMapWidth(parseInt(e))}
                                    max={20}
                                    min={1}
                                    variant="number"
                                    label="Map Width (X)"
                                />
                                <InputField
                                    value={mapHeight}
                                    onChange={(e) => setMapHeight(parseInt(e))}
                                    max={20}
                                    min={1}
                                    variant="number"
                                    label="Map Height (Y)"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-1">Total size: {mapWidth * 128}x{mapHeight * 128} pixels ({mapWidth}x{mapHeight} maps)</p>

                            <Label className="mt-4 mb-2">Dithering Method</Label>
                            <ComboBox
                                items={Object.keys(ditheringMethods)}
                                value={ditheringMethod}
                                onChange={(e) => setDitheringMethod(e as DitheringMethodName)}
                            />

                            <Label className="mt-4 mb-2">Staircasing Method</Label>
                            <ComboBox
                                items={Object.values(StaircasingMode)}
                                value={staircasingMode}
                                onChange={(e) => setStaircasingMode(e as StaircasingMode)}
                                getDisplayName={(v) => {
                                    return v == StaircasingMode.NONE ? "Flat Map (2d)" : (v == StaircasingMode.STANDARD ? "Staircasing 3d" : (v == StaircasingMode.VALLEY ? "Valley" : "Valley (Max 3)"))
                                }}
                                renderItem={(v) => {
                                    return v == StaircasingMode.VALLEY_3_LEVEL ? "Max 3 high" : ""
                                }}
                            />

                            <Separator className="my-4" />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="support"
                                    checked={addSupportBlocks}
                                    onCheckedChange={(checked) => setAddSupportBlocks(checked as boolean)}
                                />
                                <Label htmlFor="support">
                                    Add Support Blocks
                                </Label>
                            </div>

                            <Label className="mt-4 mb-2">Color Matching</Label>
                            <ComboBox
                                items={Object.values(ColorDistanceMethod)}
                                value={colorDistanceMethod}
                                onChange={(e) => setColorDistanceMethod(e as ColorDistanceMethod)}
                                getDisplayName={(v) => {
                                    return v == ColorDistanceMethod.WEIGHTED_RGB ? "Weighted RGB" : (v == ColorDistanceMethod.EUCLIDEAN ? "Euclidean" : "Delta E")
                                }}
                                renderItem={(v) => {
                                    return v == ColorDistanceMethod.WEIGHTED_RGB ? "Recommended" : (v == ColorDistanceMethod.EUCLIDEAN ? "Fast" : "Perceptual")
                                }}
                            />

                            <Separator className="my-4" />

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleExport3D} className="flex-1" disabled={!processingStats}>
                                    <Download className="mr-2" size={16} />
                                    Export NBT
                                </Button>
                                <Button onClick={handleExportPNG} className="flex-1" disabled={!processingStats}>
                                    <Download className="mr-2" size={16} />
                                    Export PNG
                                </Button>
                                <Button onClick={handleReset} variant="destructive" className="flex-1">
                                    <RotateCcw className="mr-2" size={16} />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {processingStats && (
                        <Card id="stats">
                            <CardHeader>
                                <CardTitle>Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Dimensions:</span>
                                    <span className="font-mono">{processingStats.width} x {processingStats.height}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Blocks:</span>
                                    <span className="font-mono">{processingStats.totalBlocks.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unique Colors:</span>
                                    <span className="font-mono">{processingStats.uniqueBlocks}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card id="palette">
                        <CardHeader>
                            <CardTitle>Block Palette</CardTitle>
                            <CardDescription className="space-y-2 text-sm">
                                {Object.keys(blockSelection).length} / 61 colors enabled
                            </CardDescription>
                            <div className="flex gap-2 mt-4">
                                <div className="flex-1">
                                    <ComboBox
                                        items={["Custom", ...Presets]}
                                        value={currentPreset}
                                        onChange={(value) => applyPreset(value)}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleExportPreset}
                                >
                                    <Download className="mr-1" size={14} />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => presetInputRef.current?.click()}
                                >
                                    <Upload className="mr-1" size={14} />
                                </Button>
                                <input
                                    ref={presetInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImportPreset(file);
                                    }}
                                    className="hidden"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="aspect-square space-y-2 overflow-y-auto">
                            {BLOCK_GROUPS.map((group, groupId) => (
                                <PaletteGroup
                                    key={groupId}
                                    group={group}
                                    groupId={groupId}
                                    blockSelection={blockSelection}
                                    toggleBlockSelection={toggleBlockSelection}
                                />
                            ))}
                        </CardContent>
                    </Card>

                    <Card id="preview">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="w-full aspect-square p-2">
                            {(processedImageData && processingStats) && (
                                <ZoomViewport cellWidth={processingStats.width} cellHeight={processingStats.height}>
                                    <canvas
                                        width={processingStats.width}
                                        height={processingStats.height}
                                        style={{
                                            imageRendering: 'pixelated',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                        ref={(canvas) => {
                                            if (canvas && processedImageData) {
                                                const ctx = canvas.getContext('2d');
                                                if (ctx) {
                                                    ctx.putImageData(processedImageData, 0, 0);
                                                }
                                            }
                                        }}
                                    />
                                </ZoomViewport>
                            )}
                        </CardContent>
                    </Card>

                    {materialList.length > 0 && (
                        <Card className="gap-2" id="material-list">
                            <CardHeader>
                                <CardTitle>Material List</CardTitle>
                                <CardDescription>Click on materials to edit them.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">
                                    <Separator />
                                    <p className="flex text-gray-400 mt-2 mb-1 ">Stats: {processingStats?.uniqueBlocks} materials<Dot />{processingStats?.totalBlocks} blocks</p>
                                    <Separator />

                                    <div className="space-y-2 max-h-90 overflow-y-auto mt-1">
                                        {materialList.map((material, idx) => {
                                            const selectedBlock = blockSelection[material.groupId] as string;
                                            if (!selectedBlock) return null;

                                            const imageName: string = "2d_" + (selectedBlock in ALIASES ? ALIASES[selectedBlock] : selectedBlock);
                                            const isExpanded = expandedGroup === material.groupId;

                                            return (
                                                <div key={idx}>
                                                    {!isExpanded ? (
                                                            <div className="flex items-center justify-between p-2 border rounded-md mr-2 cursor-pointer" onClick={(e) => {
                                                                e.stopPropagation()
                                                                setExpandedGroup(material.groupId)
                                                            }}>
                                                                <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                                                                    <ImageObj
                                                                        src={findImageAsset(imageName, "block")}
                                                                        alt={selectedBlock}
                                                                        width={16}
                                                                        height={16}
                                                                        className="h-full w-auto image-pixelated aspect-ratio"
                                                                    />
                                                                    <span className="truncate text-xs">{toTitleCase(selectedBlock, true)}</span>
                                                                </div>
                                                                <span className="font-mono text-xs shrink-0">{material.count}</span>
                                                            </div>
                                                        ) :
                                                        <div ref={expandedRef} className="mt-1 border p-2 rounded-md">
                                                            <Label className="mb-2 ml-1 mt-1">Select which material to use:</Label>
                                                            <InlineGroupSwitch
                                                                group={BLOCK_GROUPS[material.groupId]}
                                                                blockSelection={blockSelection}
                                                                callback={(groupId, block) => {
                                                                    setExpandedGroup(null)
                                                                    if (selectedBlock != block) {
                                                                        toggleBlockSelection(groupId, block ? block : selectedBlock);
                                                                    }
                                                                }}
                                                                groupId={material.groupId}
                                                                open={true}
                                                                removeBtn={true}
                                                            />
                                                        </div>
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

function PaletteGroup({group, groupId, blockSelection, toggleBlockSelection}: {group: string[], groupId: number, blockSelection: BlockSelection, toggleBlockSelection: (groupId: number, blockName: string) => void}) {
    const [open, setOpen] = useState(false);

    const baseColor = BASE_COLORS[groupId];

    const normalHex = numberToHex(scaleRGB(baseColor, Brightness.NORMAL));
    const lightHex = numberToHex(scaleRGB(baseColor, Brightness.LOW));
    const highHex = numberToHex(scaleRGB(baseColor, Brightness.HIGH));

    const selected = blockSelection[groupId]
    const selectedIndex = selected != null ? group.indexOf(selected) : -1

    return (
        <div key={groupId} className="border rounded p-2">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex">
                    {groupId != 11 && (
                        <>
                            <div className="w-4 h-4 rounded border" style={{backgroundColor: lightHex}}/>
                            <div className="w-4 h-4 rounded border" style={{backgroundColor: normalHex}}/>
                        </>
                    )}
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: highHex }}/>
                </div>

                <span>Group {groupId + 1}</span><Dot />
                <span>{group.length > 5 && `${open ? group.length : (5 + (selectedIndex > 4 ? 1 : 0))} /`} {group.length} blocks</span>
                {group.length > 5 && (
                    <Button onClick={() => setOpen(!open)} variant="secondary" className="h-6 mr-4 px-2 text-xs cursor-pointer">{open ?
                        <p className="flex gap-2">Hide<ChevronUp /></p> :
                        <p className="flex gap-2">Show<ChevronDown /></p>
                    }</Button>
                )}
            </div>
            <InlineGroupSwitch group={group} blockSelection={blockSelection} callback={(groupId, blockName) => {
                toggleBlockSelection(groupId, blockName as string);
            }} groupId={groupId} open={open} />
        </div>
    );
}

function InlineGroupSwitch({group, blockSelection, callback, groupId, open, removeBtn = false}: {group: string[], blockSelection: BlockSelection, callback: (groupId: number, blockName: string | null) => void, groupId: number, open: boolean, removeBtn?: boolean}) {
    const selected = blockSelection[groupId];

    return (
        <div className="flex flex-wrap gap-1">
            {removeBtn && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => {
                                if (selected) {
                                    callback(groupId, null)
                                }
                            }} variant="outline" size="sm" className={`px-2 py-2 flex-col border h-auto ${!selected ? "inset-ring-2" : ""}`}>
                                <ImageObj src={getImageAsset("none")} alt="None" width={16} height={16} className="h-10 w-auto image-pixelated" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">Disable Group</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {group.map((blockName, idx) => {
                if (!((idx < (open ? group.length : Math.min(group.length, 5))) || (selected == blockName))) return null
                const isSelected = selected === blockName
                const uniqueKey = `${groupId}-${blockName}-${idx}`
                const imageName = "2d_" + (blockName in ALIASES ? ALIASES[blockName] : blockName)

                return (
                    <TooltipProvider key={uniqueKey} delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => {callback(groupId, blockName)}}
                                    variant="outline"
                                    size="sm"
                                    className={`px-2 py-2 flex-col border h-auto ${isSelected ? "inset-ring-2" : ""}`}
                                >
                                    <ImageObj
                                        src={findImageAsset(imageName, "block")}
                                        alt={blockName}
                                        width={16}
                                        height={16}
                                        className="h-10 w-auto image-pixelated"/>
                                </Button>
                            </TooltipTrigger>

                            <TooltipContent side="bottom" align="center">
                                {toTitleCase(blockName, true)}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
        </div>
    )
}