'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToolbar } from '@/components/editor/toolbar-provider'
import { useEditorState } from '@tiptap/react'
import { ColorList } from '@/lib/Colors'
import { Palette, X } from 'lucide-react'
import { ButtonGroup } from '@/components/ui/button-group'

interface InlinePaletteButtonProps {
    alwaysActive?: boolean // if true, a color must always be active
    initialColor?: string  // required if alwaysActive is true
}

export default function InlinePaletteButton({ alwaysActive = false, initialColor }: InlinePaletteButtonProps) {
    const { editor } = useToolbar()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const state = useEditorState({
        editor,
        selector: ctx => ({ color: ctx.editor.getAttributes('textStyle').color }),
    })

    // Initialize color if alwaysActive
    useEffect(() => {
        if (editor && alwaysActive && initialColor) {
            editor.chain().focus().setColor(initialColor).run()
        }
    }, [editor, alwaysActive, initialColor])

    // Close when clicking outside
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
        <ButtonGroup ref={ref} className="flex flex-nowrap">
            {/* Main palette toggle button */}
            <Button
                size="sm"
                variant={state?.color ? 'secondary' : 'outline'}
                onClick={() => setOpen(prev => !prev)}
            >
                <span
                    className="rounded-full w-3 h-3 mr-1"
                    style={{ backgroundColor: state?.color || 'transparent', border: state?.color ? '' : '1px solid gray' }}
                />
                <Palette />
            </Button>

            {/* Inline color buttons, shown only when open */}
            {open && (
                <div className="flex gap-1">
                    {ColorList.map(c => {
                        const isActive = state?.color === c
                        return (
                            <Button
                                key={c}
                                size="sm"
                                variant="outline"
                                className="aspect-square p-0 relative flex items-center justify-center"
                                onClick={() => {
                                    editor.chain().focus().setColor(c).run()
                                    setOpen(false)
                                }}
                            >
                                <span
                                    className="block w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: c }}
                                />
                                {isActive && (
                                    <span className="absolute inset-0 w-5 h-5 m-auto rounded-full ring-1 ring-white-500 pointer-events-none" />
                                )}
                            </Button>
                        )
                    })}

                    {/* Clear color button only if not alwaysActive */}
                    {!alwaysActive && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="aspect-square p-0 relative flex items-center justify-center"
                            onClick={() => {
                                editor.chain().focus().unsetColor().run()
                                setOpen(false)
                            }}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            )}
        </ButtonGroup>
    )
}