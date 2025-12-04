"use client"

import { useState } from "react"
import {
    InitialConfigType,
    LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ParagraphNode, TextNode } from "lexical"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin"
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin"
import { OverflowNode } from "@lexical/overflow"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"
import {FontFormatToolbarPlugin} from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import {HistoryToolbarPlugin} from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import {ActionsPlugin} from "@/components/editor/plugins/actions/actions-plugin";
import {Button} from "@/components/ui/button";
import {Trash2Icon} from "lucide-react";
import {ClearEditorPlugin} from "@lexical/react/LexicalClearEditorPlugin";
import {ClearEditorActionPlugin} from "@/components/editor/plugins/actions/clear-editor-plugin";
import {CounterCharacterPlugin} from "@/components/editor/plugins/actions/counter-character-plugin";
import {MaxLengthPlugin} from "@/components/editor/plugins/actions/max-length-plugin";
import {CharacterLimitPlugin} from "@lexical/react/LexicalCharacterLimitPlugin";
import {ContextMenuPlugin} from "@/components/editor/plugins/context-menu-plugin";
import {RemoveHighlightStylePlugin} from "@/components/editor/plugins/obfuscation-plugin";
import {ObfuscatedTextNode} from "@/components/editor/nodes/obfuscated-node";

const maxLength = 100

const editorConfig: InitialConfigType = {
    namespace: "Editor",
    theme: editorTheme,
    nodes: [HeadingNode, ParagraphNode, ObfuscatedTextNode, QuoteNode, OverflowNode],
    onError: (error: Error) => {
        console.error(error)
    },
}

export default function RichTextEditorDemo() {
    return (
        <div className="bg-background w-full overflow-hidden rounded-lg border">
            <LexicalComposer
                initialConfig={{
                    ...editorConfig,
                }}
            >
                <TooltipProvider>
                    <Plugins />
                </TooltipProvider>
            </LexicalComposer>
        </div>
    )
}

const placeholder = "Start typing..."

export function Plugins() {
    const [floatingAnchorElem, setFloatingAnchorElem] =
        useState<HTMLDivElement | null>(null)

    const onRef = (_floatingAnchorElem: HTMLDivElement) => {
        if (_floatingAnchorElem !== null) {
            setFloatingAnchorElem(_floatingAnchorElem)
        }
    }

    return (
        <div className="relative">
            {/* toolbar plugins */}
            <ToolbarPlugin>
                {() => (
                    <div className="vertical-align-middle sticky top-0 z-10 flex gap-2 overflow-auto border-b p-1">
                        <HistoryToolbarPlugin />
                        <FontFormatToolbarPlugin />
                        <FontColorToolbarPlugin />
                    </div>
                )}
            </ToolbarPlugin>

            <div className="relative">
                <RichTextPlugin
                    contentEditable={
                        <div className="">
                            <div className="" ref={onRef}>
                                <ContentEditable
                                    placeholder={placeholder}
                                    className="ContentEditable__root relative block h-72 min-h-72 min-h-full overflow-auto px-8 py-4 focus:outline-none"
                                />
                            </div>
                        </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                {/* rest of the plugins */}
                <HistoryPlugin />
                <ContextMenuPlugin />
            </div>
            <ActionsPlugin>
                <div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t p-1">
                    <div className="flex flex-1 justify-start">
                        {/* left side action buttons */}
                        <MaxLengthPlugin maxLength={maxLength} />
                        <CharacterLimitPlugin maxLength={maxLength} charset="UTF-16" />
                    </div>
                    <div>{/* center action buttons */}
                        <CounterCharacterPlugin charset="UTF-16" />

                    </div>
                    <div className="flex flex-1 justify-end">
                        {/* right side action buttons */}
                        <ClearEditorActionPlugin />
                        <ClearEditorPlugin />
                    </div>
                </div>
            </ActionsPlugin>
        </div>
    )
}
