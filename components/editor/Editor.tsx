'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import History from '@tiptap/extension-history'
import {Color, TextStyle} from "@tiptap/extension-text-style";

import FormattingToolbar from '@/components/editor/FormattingToolbar'
import { ToolbarProvider } from '@/components/editor/toolbar-provider'
import {Obfuscated} from "@/components/editor/Obfuscated";

import "@/components/editor/editor.css"
import {useEffect, useState} from "react";
import {jsonToMinecraftText} from "@/lib/MinecraftText";

const extensions = [
    Document,
    Paragraph,
    Text,
    Color,
    TextStyle,

    History,

    Bold,
    Italic,
    Underline,
    Strike,
    Obfuscated
]

export default function Editor({ initialColor }: { initialColor: string }) {
    const editor = useEditor({
        extensions,
        editorProps: {
            attributes: {
                class: 'm-2 focus:outline-none',
            },
        },
        content: "",
        immediatelyRender: false
    })



    const [mcText, setMcText] = useState('');

    useEffect(() => {
        if (!editor) return;

        const updateListener = () => {
            const json = editor.getJSON();
            const mc = jsonToMinecraftText(json);
            setMcText(mc);
        };

        editor.on('update', updateListener);

        // initialize
        updateListener();

        return () => {
            editor.off('update', updateListener);
        };
    }, [editor]);

    if (!editor) return null

    return (
        <div className="border w-full h-full relative rounded-md overflow-hidden pb-3">
            <div className="flex w-full items-center py-2 px-2 justify-between border-b sticky top-0 left-0 bg-background z-20">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-2">
                        <FormattingToolbar initialColor={initialColor}/>
                    </div>
                </ToolbarProvider>
            </div>

            <div
                onClick={() => editor.chain().focus().run()}
                className="cursor-text w-full bg-background"
            >
                <EditorContent
                    editor={editor}
                />
            </div>
            <textarea
                className="border p-2 w-full min-h-[80px]"
                value={mcText}
                readOnly
            />
        </div>
    )
}