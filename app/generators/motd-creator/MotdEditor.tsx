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
import {useEffect, useRef, useState} from "react";
import {jsonToMinecraftText} from "@/lib/MinecraftText";
import {Colors} from "@/lib/Colors";

export default function MotdEditor() {
    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            TextStyle,
            Color,
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
        },        immediatelyRender: false
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

    // Automatic scaling for MOTD widget
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const DESIGN_WIDTH = 305

    useEffect(() => {
        function updateScale() {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth
                setScale(containerWidth / DESIGN_WIDTH)
            }
        }
        requestAnimationFrame(updateScale)
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])


    if (!editor) return null

    return (
        <div className="border w-full h-full relative rounded-md font-minecraft pb-3">
            <div className="flex w-full items-center py-2 px-2 justify-between border-b sticky top-0 left-0 z-20">
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
                        <div className="w-[32px] h-[32px] flex-shrink-0">
                            <img
                                src="https://yt3.googleusercontent.com/ytc/AIdro_nRBawueDy4A2hLalZPoCWcyppX48dJhGWbKlqCn6S7s8w=s900-c-k-c0x00ffffff-no-rj"
                                alt="icon"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Right content */}
                        <div className="flex-1 flex flex-col ml-[2px] mr-[4px] overflow-hidden">
                            {/* Top bar split left/right */}
                            <div className="h-[10px] w-full flex items-center justify-between mt-0.5 overflow-hidden">
                                {/* Left section */}
                                <span className="text-white text-[9px] truncate">
                                  Some text here
                                </span>

                                {/* Right section */}
                                <div className="flex items-center gap-[2px]">
                                    <span className="text-white text-[9px]">10/20</span>
                                    <img
                                        src="/assets/ping_5.png"
                                        alt="icon"
                                        className="w-[10px] h-[10px] object-contain"
                                        style={{ imageRendering: 'pixelated' }}
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

            {/*<textarea*/}
            {/*    className="border p-2 w-full min-h-[80px]"*/}
            {/*    value={mcText}*/}
            {/*    readOnly*/}
            {/*/>*/}
            </div>
        </div>
    )
}