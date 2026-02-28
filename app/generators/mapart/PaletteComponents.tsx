'use client';

import React, { memo, useState } from 'react';
import { ChevronDown, ChevronUp, Dot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ImageObj from 'next/image';
import { Brightness } from '@/app/generators/mapart/utils/types';
import { ALIASES, BASE_COLORS, scaleRGB } from '@/app/generators/mapart/utils/constants';
import { numberToHex } from '@/app/generators/mapart/color/matching';
import { findImageAsset, getImageAsset } from '@/lib/images/getImageAsset';
import { toTitleCase } from '@/lib/StringUtils';
import { Label } from '@/components/ui/label';

export interface PaletteGroupProps {
    group: string[];
    groupId: number;
    selectedBlock: string | null;
    toggleBlockSelection: (groupId: number, blockName: string | null) => void;
}

export const PaletteGroup = memo(function PaletteGroup({ group, groupId, selectedBlock, toggleBlockSelection }: PaletteGroupProps) {
    const [open, setOpen] = useState(false);

    const baseColor = BASE_COLORS[groupId];
    const normalHex = numberToHex(scaleRGB(baseColor, Brightness.NORMAL));
    const lightHex = numberToHex(scaleRGB(baseColor, Brightness.LOW));
    const highHex = numberToHex(scaleRGB(baseColor, Brightness.HIGH));
    const selectedIndex = selectedBlock != null ? group.indexOf(selectedBlock) : -1;

    return (
        <div className="border rounded p-2">
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex">
                    {groupId !== 11 && (
                        <>
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: lightHex }} />
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: normalHex }} />
                        </>
                    )}
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: highHex }} />
                </div>
                <span>Group {groupId + 1}</span>
                <div className="flex gap-2 items-center">
                    <Dot />
                    <span>{group.length > 5 && `${open ? group.length : (5 + (selectedIndex > 4 ? 1 : 0))} /`} {group.length} blocks</span>
                    {group.length > 5 && (
                        <Button onClick={() => setOpen(o => !o)} variant="secondary" className="h-6 mr-4 px-2 text-xs">
                            {open ? <p className="flex gap-2">Hide<ChevronUp /></p> : <p className="flex gap-2">Show<ChevronDown /></p>}
                        </Button>
                    )}
                </div>
            </div>
            <InlineGroupSwitch
                group={group}
                selectedBlock={selectedBlock}
                callback={toggleBlockSelection}
                groupId={groupId}
                open={open}
            />
        </div>
    );
});

export interface InlineGroupSwitchProps {
    group: string[];
    selectedBlock: string | null;
    callback: (groupId: number, blockName: string | null) => void;
    groupId: number;
    open: boolean;
    removeBtn?: boolean;
}

export const InlineGroupSwitch = memo(function InlineGroupSwitch({ group, selectedBlock, callback, groupId, open, removeBtn = false }: InlineGroupSwitchProps) {
    return (
        <div className="flex flex-wrap gap-1">
            {removeBtn && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => { if (selectedBlock) callback(groupId, null); }} variant="outline" size="sm"
                                    className={`px-2 py-2 flex-col border h-auto ${!selectedBlock ? "inset-ring-2" : ""}`}>
                                <ImageObj src={getImageAsset("none")} alt="None" width={16} height={16} className="h-10 w-auto image-pixelated" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">Disable Group</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {group.map((blockName, idx) => {
                if (!(idx < (open ? group.length : Math.min(group.length, 5)) || selectedBlock === blockName)) return null;
                const isSelected = selectedBlock === blockName;
                const imageName = "2d_" + (blockName in ALIASES ? ALIASES[blockName] : blockName);
                return (
                    <TooltipProvider key={`${groupId}-${blockName}-${idx}`} delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => callback(groupId, blockName)} variant="outline" size="sm" className={`px-2 py-2 flex-col border h-auto ${isSelected ? "inset-ring-2" : ""}`}>
                                    <ImageObj src={findImageAsset(imageName, "block")} alt={blockName} width={16} height={16} className="h-10 w-10 image-pixelated" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="center">{toTitleCase(blockName, true)}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
});

export { Label };
