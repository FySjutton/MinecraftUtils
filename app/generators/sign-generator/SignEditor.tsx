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
import React, {useEffect, useRef, useState} from "react";
import {jsonToMinecraftText} from "@/lib/MinecraftText";
import {Colors} from "@/lib/Colors";
import {PasteColorFilter} from "@/components/editor/PasteColorFilter";
import {MaxLines} from "@/components/editor/MaxLines";
import {Upload} from "lucide-react";

export default function SignEditor({ output, setOutputAction }: { output: string, setOutputAction: React.Dispatch<React.SetStateAction<string>> }) {
    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            TextStyle,
            Color,

            PasteColorFilter.configure({
                initialColor: Colors.GRAY,
            }),
            MaxLines.configure({ max: 4 }),

            History,

            Bold,
            Italic,
            Underline,
            Strike,
            Obfuscated,
        ],
        onCreate({ editor }) {
            editor.chain().focus().setColor(Colors.GRAY).run()
        },
        onUpdate({ editor }) {
            const { ranges } = editor.state.selection

            const hasColor = ranges.some(range => {
                const marks = range.$from.marks()
                return marks.some(mark => mark.type.name === 'textStyle' && mark.attrs.color)
            })

            if (!hasColor) {
                editor.chain().focus().setColor(Colors.GRAY).run()
            }
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none ',
            },
        },
        content: {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Click here and type to edit!',
                            marks: [
                                {
                                    type: 'textStyle',
                                    attrs: { color: '#AAAAAA' }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        immediatelyRender: false
    })

    useEffect(() => {
        if (!editor) return;

        const updateListener = () => {
            const json = editor.getJSON();
            const mc = jsonToMinecraftText(json, "\\u00a7").replace(/\\n$/, '');
            setOutputAction(mc);
        };

        editor.on('update', updateListener);

        updateListener();

        return () => {
            editor.off('update', updateListener);
        };
    }, [editor]);

    if (editor == null) return null;

    return (
        <div className="border w-full relative rounded-md font-minecraft mb-[20px]">
            <div className="relative flex overflow-x-auto overflow-y-hidden w-full items-center py-2 px-2 justify-between border-b sticky top-0 left-0 z-20">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-2">
                        <FormattingToolbar initialColor={Colors.GRAY}/>
                    </div>
                </ToolbarProvider>
            </div>

            <div className="m-2">
                <EditorContent
                    editor={editor}
                    spellCheck={false}
                    className="w-full h-full break-words whitespace-pre-wrap inline"
                />
            </div>
        </div>
    )
}