'use client'

import {Button} from '@/components/ui/button'
import {useToolbar} from '@/components/editor/toolbar-provider'
import {useEditorState} from '@tiptap/react'
import React, {useState, useRef, useEffect} from 'react'
import {ColorList} from "@/lib/Colors";
import {Palette} from "lucide-react";

export default function ColorPickerButton({ initialColor }: { initialColor: string }) {
    const {editor} = useToolbar()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const state = useEditorState({
        editor,
        selector: ctx => ({color: ctx.editor.getAttributes('textStyle').color}),
    })

    useEffect(() => {
        if (editor && initialColor) {
            editor.chain().focus().setColor(initialColor).run()
        }
    }, [editor, initialColor])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!editor) return null

    return (
        <div className="relative inline-block" ref={ref}>
            <Button
                size="sm"
                variant={state?.color ? 'secondary' : 'outline'}
                onClick={() => setOpen(prev => !prev)}
            >
                <span className="rounded-full w-3 h-3 mr-1"
                      style={{ backgroundColor: state?.color }}
                />
                <Palette />
            </Button>

            {open && (
                <div
                    className="absolute z-50 mt-1 p-2 bg-background border rounded shadow-lg grid grid-cols-4 gap-2"
                    style={{
                        minWidth: 'auto',
                        width: 'max-content',
                        maxWidth: '90vw',
                    }}
                >
                    {ColorList.map(c => {
                        const isActive = state?.color === c
                        return (
                            <Button
                                key={c}
                                size="sm"
                                variant={isActive ? 'secondary' : 'outline'}
                                className="w-7 h-7 p-0 flex items-center justify-center"
                                onClick={() => {
                                    editor.chain().focus().setColor(c).run()
                                    setOpen(false)
                                }}
                            >
                              <span
                                  className="block w-4 h-4 rounded-full border"
                                  style={{backgroundColor: c}}
                              />
                            </Button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
