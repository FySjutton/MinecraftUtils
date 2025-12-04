'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useToolbar } from '@/components/toolbars/toolbar-provider'
import { UndoIcon, RedoIcon } from 'lucide-react'
import { useEditorState } from '@tiptap/react'
import {ColorPickerButton} from "@/components/toolbars/ColorPalette";

export const FormattingToolbar = () => {
    const { editor } = useToolbar()

    const state = useEditorState({
        editor,
        selector: ({ editor }) => ({
            isBold: editor.isActive('bold'),
            isItalic: editor.isActive('italic'),
            isUnderline: editor.isActive('underline'),
            isStrike: editor.isActive('strike'),
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
                    B
                </Button>
                <Button
                    variant={state?.isItalic ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    I
                </Button>
                <Button
                    variant={state?.isUnderline ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    U
                </Button>
                <Button
                    variant={state?.isStrike ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    S
                </Button>
            </ButtonGroup>

            <ButtonGroup>
                <ColorPickerButton />
            </ButtonGroup>
        </div>
    )
}
