"use client"

import { useCallback, useState } from "react"
import {
    $getSelectionStyleValueForProperty,
    $patchStyleText,
} from "@lexical/selection"
import { $getSelection, $isRangeSelection, BaseSelection } from "lexical"
import { BaselineIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"

import {
    ColorPicker,
    ColorPickerTrigger,
    ColorPickerContent,
    ColorPickerArea,
} from "@/components/editor/editor-ui/minecraft-color-picker"

import { Button } from "@/components/ui/button"

export function FontColorToolbarPlugin() {
    const { activeEditor } = useToolbarContext()
    const [fontColor, setFontColor] = useState("#000")

    const $updateToolbar = (selection: BaseSelection) => {
        if ($isRangeSelection(selection)) {
            setFontColor(
                $getSelectionStyleValueForProperty(selection, "color", "#000")
            )
        }
    }

    useUpdateToolbarHandler($updateToolbar)

    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            activeEditor.update(() => {
                const selection = $getSelection()
                activeEditor.setEditable(false)
                if (selection) {
                    $patchStyleText(selection, styles)
                }
            })
        },
        [activeEditor]
    )

    const onFontColorSelect = useCallback(
        (hex: string) => {
            applyStyleText({ color: hex })
        },
        [applyStyleText]
    )

    return (
        <ColorPicker
            defaultValue={fontColor}
            onValueChange={onFontColorSelect}
            onOpenChange={(open) => {
                if (!open) {
                    activeEditor.setEditable(true)
                    activeEditor.focus()
                }
            }}
        >
            <ColorPickerTrigger asChild>
                <Button variant="outline" size="icon-sm">
                    <BaselineIcon className="size-4" />
                </Button>
            </ColorPickerTrigger>

            <ColorPickerContent>
                <ColorPickerArea />
            </ColorPickerContent>
        </ColorPicker>
    )
}
