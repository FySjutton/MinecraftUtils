"use client"

import { useCallback, useState } from "react"
import { $isTableSelection } from "@lexical/table"
import { $isRangeSelection, BaseSelection, FORMAT_TEXT_COMMAND, TextFormatType, $getSelection, $isTextNode } from "lexical"
import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, Wand2Icon } from "lucide-react"
import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const FORMATS = [
    { format: "bold", icon: BoldIcon, label: "Bold" },
    { format: "italic", icon: ItalicIcon, label: "Italic" },
    { format: "underline", icon: UnderlineIcon, label: "Underline" },
    { format: "strikethrough", icon: StrikethroughIcon, label: "Strikethrough" },
    { format: "highlight", icon: Wand2Icon, label: "Obfuscated" }
] as const

export function FontFormatToolbarPlugin() {
    const { activeEditor } = useToolbarContext()
    const [activeFormats, setActiveFormats] = useState<string[]>([])

    const $updateToolbar = useCallback((selection: BaseSelection) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
            const formats: string[] = []
            FORMATS.forEach(({ format }) => {
                if ($isRangeSelection(selection) && selection.hasFormat(format as TextFormatType)) {
                    formats.push(format)
                }
            })
            setActiveFormats((prev) => {
                if (prev.length !== formats.length || !formats.every((f) => prev.includes(f))) return formats
                return prev
            })
        }
    }, [activeEditor])

    useUpdateToolbarHandler($updateToolbar)

    return (
        <ToggleGroup
            type="multiple"
            value={activeFormats}
            onValueChange={setActiveFormats}
            variant="outline"
            size="sm"
        >
            {FORMATS.map(({ format, icon: Icon, label }) => (
                <ToggleGroupItem
                    key={format}
                    value={format}
                    aria-label={label}
                    onClick={() => {
                        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format as TextFormatType)
                    }}
                >
                    <Icon className="size-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}
