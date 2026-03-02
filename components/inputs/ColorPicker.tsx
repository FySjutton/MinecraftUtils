import * as React from "react";
import {useState, useEffect, useRef} from "react";
import {HexColorPicker} from "react-colorful";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {InputField} from "@/components/inputs/InputField";
import {IconCheck, IconCopy} from "@tabler/icons-react";
import {useCopyToClipboard} from "@/hooks/useCopyToClipboard";

type RGB = { r: number; g: number; b: number };
type Mode = "hex" | "rgb";

interface ColorPickerProps {
    initialValue?: string;
    hex: string;
    setHex: React.Dispatch<React.SetStateAction<string>>;
    useDebounce?: boolean;
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

const DEBOUNCE_MS = 300;

export function ColorPicker({initialValue, hex, setHex, useDebounce = false}: ColorPickerProps) {
    const initial = initialValue && isValidHex(normalizeToHashHex(initialValue))
        ? normalizeToHashHex(initialValue)
        : "#6366f1";

    const [previewHex, setPreviewHex] = useState(hex || initial);
    const [hexDraft, setHexDraft] = useState(hex || initial);
    const [mode, setMode] = useState<Mode>("hex");

    const {copyToClipboard, isCopied} = useCopyToClipboard();
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDragging = useRef(false);
    const previewHexRef = useRef(previewHex);

    const rgb = hexToRgb(previewHex);

    useEffect(() => {
        setPreviewHex(hex);
        setHexDraft(hex);
        previewHexRef.current = hex;
    }, [hex]);

    function scheduleCommit(value: string): void {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setHex(value);
        }, DEBOUNCE_MS);
    }

    function commitToParent(value: string): void {
        if (useDebounce) {
            if (!isDragging.current) {
                scheduleCommit(value);
            }
        } else {
            setHex(value);
        }
    }

    function setColor(newHex: string): void {
        setPreviewHex(newHex);
        setHexDraft(newHex);
        previewHexRef.current = newHex;
        commitToParent(newHex);
    }

    function commitHex(): void {
        const trimmed = hexDraft.trim();
        const normalized = normalizeToHashHex(trimmed);
        if (isValidHex(normalized)) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            setPreviewHex(normalized);
            previewHexRef.current = normalized;
            setHex(normalized);
        }
    }

    function flushDebounce(): void {
        if (useDebounce && debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
            setHex(previewHexRef.current);
        }
    }

    function updateRgb(channel: keyof RGB, raw: string): void {
        if (!/^\d*$/.test(raw)) return;

        let normalized = raw;
        if (raw.length > 1) {
            normalized = raw.replace(/^0+/, "");
            if (normalized === "") {
                normalized = "0";
            }
        }

        const value = clamp(Number(normalized));
        const next = {r: rgb.r, g: rgb.g, b: rgb.b};
        next[channel] = value;
        setColor(rgbToHex(next));
    }

    function renderHexInput() {
        return (
            <InputField
                value={hexDraft.toUpperCase()}
                onChange={(e: React.SetStateAction<string>) => setHexDraft(e)}
                onBlur={commitHex}
                onKeyDown={(e: { key: string }) => {
                    if (e.key === "Enter") {
                        commitHex();
                    }
                    if (e.key === "Escape") {
                        setHexDraft(previewHex);
                    }
                }}
                className="font-mono"
                showCopy={true}
            />
        );
    }

    function renderRgbInputs() {
        return (
            <div className="flex items-center gap-2 w-full">
                <Input
                    inputMode="numeric" pattern="[0-9]*" placeholder="R"
                    value={String(rgb.r)}
                    onChange={(e) => updateRgb("r", e.target.value)}
                    onBlur={flushDebounce}
                    className="w-1/3 text-center font-mono"
                />
                <Input
                    inputMode="numeric" pattern="[0-9]*" placeholder="G"
                    value={String(rgb.g)}
                    onChange={(e) => updateRgb("g", e.target.value)}
                    onBlur={flushDebounce}
                    className="w-1/3 text-center font-mono"
                />
                <Input
                    inputMode="numeric" pattern="[0-9]*" placeholder="B"
                    value={String(rgb.b)}
                    onChange={(e) => updateRgb("b", e.target.value)}
                    onBlur={flushDebounce}
                    className="w-1/3 text-center font-mono"
                />
                <Button
                    variant="outline"
                    onClick={() => copyToClipboard(`${rgb.r}, ${rgb.g}, ${rgb.b}`)}
                    className="shrink-0"
                    aria-label="Copy RGB"
                >
                    {isCopied ? <IconCheck className="text-green-500"/> : <IconCopy/>}
                </Button>
            </div>
        );
    }

    function onPickerMouseDown() {
        isDragging.current = true;
    }

    function onPickerMouseUp() {
        isDragging.current = false;
        if (useDebounce) {
            scheduleCommit(previewHexRef.current);
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-3">
                    <span className="h-4 w-4 rounded-sm border" style={{backgroundColor: previewHex}}/>
                    <span className="font-mono text-sm">{previewHex.toUpperCase()}</span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 space-y-4 p-4">
                <div className="h-8 w-full rounded-md border" style={{backgroundColor: previewHex}}/>

                <div
                    className="w-full"
                    onMouseDown={onPickerMouseDown}
                    onMouseUp={onPickerMouseUp}
                >
                    <HexColorPicker
                        color={previewHex}
                        onChange={setColor}
                        className="w-full"
                        style={{width: "100%", height: 160}}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">{mode.toUpperCase()}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setMode("hex")}>HEX</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMode("rgb")}>RGB</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {mode === "hex" && renderHexInput()}
                    {mode === "rgb" && renderRgbInputs()}
                </div>
            </PopoverContent>
        </Popover>
    );
}