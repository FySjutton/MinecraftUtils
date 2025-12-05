'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useToolbar } from '@/components/editor/toolbar-provider'
import { useEditorState } from '@tiptap/react'
import ColorPickerButton from "@/components/editor/ColorPalette";
import React from "react";
import { Bold, Italic, Underline, UndoIcon, RedoIcon, Strikethrough } from 'lucide-react';
import {IconCurrencyIranianRial} from "@tabler/icons-react";

export default function FormattingToolbar({ initialColor }: { initialColor: string }) {
    const { editor } = useToolbar()
    const state = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isBold: editor.isActive('bold'),
            isItalic: editor.isActive('italic'),
            isUnderline: editor.isActive('underline'),
            isStrike: editor.isActive('strike'),
            isObfuscated: editor.isActive('obfuscated'),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
        }),
    })

    return (
        <div className="flex gap-2">
            {/* Undo / Redo */}
            <ButtonGroup>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!state?.canUndo}
                >
                    <UndoIcon className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!state?.canRedo}
                >
                    <RedoIcon className="w-4 h-4" />
                </Button>
            </ButtonGroup>

            {/* Basic formatting buttons */}
            <ButtonGroup>
                <Button
                    variant={state?.isBold ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold />
                </Button>
                <Button
                    variant={state?.isItalic ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic />
                </Button>
                <Button
                    variant={state?.isUnderline ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <Underline />
                </Button>
                <Button
                    variant={state?.isStrike ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough />
                </Button>
                <Button
                    variant={state?.isObfuscated ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleObfuscated().run()}
                >
                    <IconCurrencyIranianRial />
                </Button>
            </ButtonGroup>

            <ButtonGroup>
                <ColorPickerButton initialColor={initialColor} />
            </ButtonGroup>
        </div>
    )
}
