'use client'

import {EditorContent, useEditor} from '@tiptap/react'
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
import {ToolbarProvider} from '@/components/editor/toolbar-provider'
import {Obfuscated} from "@/components/editor/Obfuscated";

import "@/components/editor/editor.css"
import React, {useEffect, useMemo, useRef, useState} from "react";
import {Colors} from "@/lib/Colors";
import {PasteColorFilter} from "@/components/editor/PasteColorFilter";
import {MaxLines} from "@/components/editor/MaxLines";
import {Upload} from "lucide-react";
import {tiptapToMinecraftText} from "@/lib/converters/tiptapToMinecraftText";
import {minecraftTextToString} from "@/lib/converters/minecraftTextToString";
import {minecraftTextToTiptap} from "@/lib/converters/minecraftTextToTiptap";
import {JSONContent} from "@tiptap/core";
import Image from "next/image";
import {createParser, useQueryState} from "nuqs";

export default function MotdEditor({ output, setOutputAction }: { output: string, setOutputAction: React.Dispatch<React.SetStateAction<string>> }) {
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
            MaxLines.configure({ max: 2 }),

            History,

            Bold,
            Italic,
            Underline,
            Strike,
            Obfuscated,
        ],
        onCreate({ editor }) {
            // apply default to existing content
            editor.chain().focus().setColor(Colors.GRAY).run()
        },
        onUpdate({ editor }) {
            // whenever user types without color, apply default
            const { empty, ranges } = editor.state.selection

            // only if no existing color mark
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

    const DEFAULT_CONTENT = useMemo(() => {
        return {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Click here and type to edit!',
                            marks: [{type: 'textStyle', attrs: {color: Colors.GRAY}}],
                        },
                    ],
                },
            ],
        }
    }, [])

    const jsonParser = useMemo(() => createParser<JSONContent>({
        serialize: (json) => {
            const minecraftLines = tiptapToMinecraftText(json, 4);
            return minecraftTextToString(minecraftLines, "\u00a7");
        },
        parse: (raw) => {
            if (!raw) return DEFAULT_CONTENT;
            return minecraftTextToTiptap(raw);
        }
        }).withDefault(editor?.getJSON() ?? DEFAULT_CONTENT),
    [DEFAULT_CONTENT, editor]);

    const [editorContent, setEditorContent] = useQueryState("motd", jsonParser)

    useEffect(() => {
        if (!editor) return;

        const updateListener = () => {
            const json = editor.getJSON();
            setEditorContent(json);
        };

        editor.on('update', updateListener);

        return () => {
            editor.off('update', updateListener);
        };
    }, [editor, setEditorContent]);

    useEffect(() => {
        if (!editor) return;

        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(editorContent)) {
            editor.commands.setContent(editorContent);
        }
    }, [editorContent, editor]);

    useEffect(() => {
        if (!editor) return;

        const updateListener = () => {
            const json = editor.getJSON();
            const minecraftText = tiptapToMinecraftText(json, 3)
            setOutputAction(minecraftTextToString(minecraftText, "\\u00a7"));
        };

        editor.on('update', updateListener);

        updateListener();

        return () => {
            editor.off('update', updateListener);
        };
    }, [editor, setOutputAction]);

    // Automatic scaling for MOTD widget
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [height, setHeight] = useState("1")
    const DESIGN_WIDTH = 305;

    useEffect(() => {
        function updateScale() {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth
                setScale(containerWidth / DESIGN_WIDTH)
                setHeight((32 * containerWidth / DESIGN_WIDTH + 100).toString())
            }
        }
        requestAnimationFrame(updateScale)
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    // File preview
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    if (!editor) return null

    return (
        <div className="border w-full relative rounded-md font-minecraft pb-3" style={{ height: `${height}px` }}>
            <div className="relative flex overflow-x-auto overflow-y-hidden w-full items-center py-2 px-2 justify-between border-b top-0 left-0 z-20">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-2">
                        <FormattingToolbar initialColor={Colors.GRAY}/>
                    </div>
                </ToolbarProvider>
            </div>

            <div className="w-[90%] h-[90%] m-auto mt-5">
                <div ref={containerRef} className="w-full h-full">
                    <div className="origin-top-left w-fit" style={{ transform: `scale(${scale})` }}>
                        <div className="w-[307px] h-[34px] bg-black border-1 border-white flex">
                            {/* Left icon */}
                            <div className="w-[32px] h-[32px] relative flex-shrink-0 p-px cursor-pointer" onClick={handleClick}>
                                <Image
                                    src={preview ?? "/assets/tool/motd/unknown_server.png"}
                                    alt="icon"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 flex justify-center items-center">
                                    <Upload strokeWidth={3} className="w-full h-full bg-opacity-90 bg-black opacity-0 hover:opacity-100"/>
                                </div>

                                {/* Hidden input (for uploading image) */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Right content */}
                            <div className="flex-1 flex flex-col ml-[2px] mr-[4px] overflow-hidden">
                                {/* Top bar split left/right */}
                                <div className="h-[10px] w-full flex items-center justify-between mt-0.5 overflow-hidden">
                                    {/* Left section */}
                                    <span className="text-white text-[9px] truncate">
                                      Minecraft Server
                                    </span>

                                    {/* Right section */}
                                    <div className="flex items-center gap-[2px]">
                                        <span className="text-white text-[9px]" style={{color: Colors.GRAY}}>17/20</span>
                                        <Image
                                            src="/assets/tool/motd/ping_5.png"
                                            alt="icon"
                                            width={16}
                                            height={16}
                                            className="w-[10px] h-[10px] object-contain image-pixelated"
                                        />
                                    </div>
                                </div>

                                {/* Editor content */}
                                <div className="flex-1 mt-0.3 cursor-text w-full overflow-hidden">
                                    <EditorContent
                                        editor={editor}
                                        spellCheck={false}
                                        className="w-full h-full text-[8px] leading-[8px] break-words whitespace-pre-wrap inline"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}