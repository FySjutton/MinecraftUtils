"use client"

import * as React from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"

interface LabeledInputWithCopyProps {
    value: string
    label: string
    readOnly?: boolean
    onChange?: (val: string) => void
}

export function CopyInput({value, label, readOnly = false, onChange}: LabeledInputWithCopyProps) {
    const { copyToClipboard, isCopied } = useCopyToClipboard()

    return (
        <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-gray-300">{label}</label>

            <InputGroup className="w-full">
                <InputGroupInput
                    placeholder={readOnly ? "" : label}
                    readOnly={readOnly}
                    value={value}
                    onChange={(e) => onChange && onChange(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        aria-label="Copy"
                        title="Copy"
                        size="icon-xs"
                        onClick={() => copyToClipboard(value)}
                    >
                        {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    )
}
