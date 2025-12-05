'use client'

import { ToolbarProvider } from '@/components/toolbars/toolbar-provider'
import { EditorContent, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import History from '@tiptap/extension-history'

import { FormattingToolbar } from '@/components/toolbars/FormattingToolbar'
import {Color, TextStyle} from "@tiptap/extension-text-style";

const extensions = [
    Document,
    Paragraph,
    Text,
    Color,
    TextStyle,

    Bold,
    Italic,
    Underline,
    Strike,
    History,
]

export const MinimalToolbarEditor = () => {
    const editor = useEditor({
        extensions,
        editorProps: {
            attributes: {
                class: 'm-2 focus:outline-none',
            },
        },
        content: '<p>Hello world 🌍</p>',
        immediatelyRender: false
    })

    if (!editor) return null

    return (
        <div className="border w-full h-full relative rounded-md overflow-hidden pb-3">
            {/* Toolbar */}
            <div className="flex w-full items-center py-2 px-2 justify-between border-b sticky top-0 left-0 bg-background z-20">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-2">
                        <FormattingToolbar />
                    </div>
                </ToolbarProvider>
            </div>

            {/* Editor content */}
            <div
                onClick={() => editor.chain().focus().run()}
                className="cursor-text w-full h-full bg-background"
            >
                <EditorContent
                    editor={editor}
                />
            </div>
        </div>
    )
}

export default MinimalToolbarEditor
