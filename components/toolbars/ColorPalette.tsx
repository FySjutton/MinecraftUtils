'use client'

import {Button} from '@/components/ui/button'
import {useToolbar} from '@/components/toolbars/toolbar-provider'
import {useEditorState} from '@tiptap/react'
import React, {useState, useRef, useEffect} from 'react'

const COLORS = [
    '#958DF1', '#F98181', '#FBBC88', '#FAF594',
    '#70CFF8', '#94FADB', '#B9F18D', '#F5A9F2',
    '#FF9F1C', '#FF4040', '#FFD166', '#06D6A0',
    '#118AB2', '#073B4C', '#EF476F', '#FFC43D',
]

export const ColorPickerButton = () => {
    const {editor} = useToolbar()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const state = useEditorState({
        editor,
        selector: ctx => ({color: ctx.editor.getAttributes('textStyle').color}),
    })

    // Close dropdown on click outside
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
            {/* Main toolbar button */}
            <Button
                size="sm"
                variant={state?.color ? 'secondary' : 'outline'}
                onClick={() => setOpen(prev => !prev)}
            >
                Color
            </Button>

            {/* Dropdown card */}
            {open && (
                <div
                    className="absolute z-50 mt-1 p-2 bg-background border rounded shadow-lg grid grid-cols-4 gap-2"
                    style={{
                        minWidth: 'auto',          // don't stretch
                        width: 'max-content',      // fit content
                        maxWidth: '90vw',          // responsive for small screens
                    }}
                >
                    {COLORS.map(c => {
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
