import * as React from "react";
import {useState} from "react";
import {HexColorPicker} from "react-colorful";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {InputField} from "@/components/InputField";
import {IconCheck, IconCopy} from "@tabler/icons-react";
import {useCopyToClipboard} from "@/hooks/useCopyToClipboard";

type RGB = { r: number; g: number; b: number };
type Mode = "hex" | "rgb";

interface ColorPickerProps {
    initialValue?: string;
    onChange?: (hex: string) => void;
}

function isValidHex(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function clamp(n: number): number {
    if (n < 0) return 0;
    if (n > 255) return 255;
    return Math.floor(n);
}

function normalizeToHashHex(value: string): string {
    if (value.startsWith("#")) return value;
    return "#" + value;
}

function hexToRgb(hex: string): RGB {
    const int = parseInt(hex.slice(1), 16);
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
}

function rgbToHex(rgb: RGB): string {
    const r = clamp(rgb.r).toString(16).padStart(2, "0");
    const g = clamp(rgb.g).toString(16).padStart(2, "0");
    const b = clamp(rgb.b).toString(16).padStart(2, "0");
    return "#" + r + g + b;
}

export function ColorPicker(props: ColorPickerProps) {
    const initial = props.initialValue && isValidHex(normalizeToHashHex(props.initialValue)) ? normalizeToHashHex(props.initialValue) : "#6366f1";

    const [hex, setHex] = useState(initial);
    const [hexDraft, setHexDraft] = useState(initial);
    const [mode, setMode] = useState<Mode>("hex");

    const { copyToClipboard, isCopied } = useCopyToClipboard()

    const rgb = hexToRgb(hex);

    function onHexChangeFromPicker(newHex: string) {
        setHex(newHex);
        setHexDraft(function(prevDraft) {
            if (prevDraft === hex) {
                return newHex;
            }
            return prevDraft;
        });

        if (props.onChange) {
            props.onChange(newHex);
        }
    }

    function commitHex(): void {
        const trimmed = hexDraft.trim();
        const normalized = normalizeToHashHex(trimmed);

        if (isValidHex(normalized)) {
            setHex(normalized);
        } else {
            setHexDraft(hex);
        }
    }

    function updateRgb(channel: keyof RGB, raw: string): void {
        if (!/^\d*$/.test(raw)) return;

        let normalized = raw;
        if (raw.length > 1) {
            normalized = raw.replace(/^0+/, "");
            if (normalized === "") normalized = "0";
        }

        const value = clamp(Number(normalized));
        const next = {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
        };

        next[channel] = value;
        setHex(rgbToHex(next));
    }

    function renderHexInput() {
        return (
            <InputField
                value={hexDraft.toUpperCase()}
                onChange={function (e) {
                    setHexDraft(e);
                }}
                onBlur={commitHex}
                onKeyDown={function (e) {
                    if (e.key === "Enter") commitHex();
                    if (e.key === "Escape") setHexDraft(hex);
                }}
                className="font-mono"
                showCopy={true}
            />
        );
    }

    function renderRgbInputs() {
        function getRgbString() {
            return `${rgb.r}, ${rgb.g}, ${rgb.b}`
        }

        return (
            <div className="flex items-center gap-2 w-full">
                <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="R"
                    value={String(rgb.r)}
                    onChange={function (e) {
                        updateRgb("r", e.target.value);
                    }}
                    className="w-1/3 text-center font-mono"
                />
                <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="G"
                    value={String(rgb.g)}
                    onChange={function (e) {
                        updateRgb("g", e.target.value);
                    }}
                    className="w-1/3 text-center font-mono"
                />
                <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="B"
                    value={String(rgb.b)}
                    onChange={function (e) {
                        updateRgb("b", e.target.value);
                    }}
                    className="w-1/3 text-center font-mono"
                />
                <Button
                    variant="outline"
                    onClick={() => copyToClipboard(String(getRgbString()))}
                    className="flex-shrink-0"
                    aria-label="Copy RGB"
                >
                    {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
                </Button>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-3">
                    <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: hex }}/>
                    <span className="font-mono text-sm">{hex.toUpperCase()}</span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 space-y-4 p-4">
                <div
                    className="h-8 w-full rounded-md border"
                    style={{ backgroundColor: hex }}
                />

                <div className="w-full">
                    <HexColorPicker
                        color={hex}
                        onChange={onHexChangeFromPicker}
                        className="w-full"
                        style={{ width: "100%", height: 160 }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {mode.toUpperCase()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={function () {
                                    setMode("hex");
                                }}
                            >
                                HEX
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={function () {
                                    setMode("rgb");
                                }}
                            >
                                RGB
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {mode === "hex" && renderHexInput()}
                    {mode === "rgb" && renderRgbInputs()}
                </div>
            </PopoverContent>
        </Popover>
    );
}
