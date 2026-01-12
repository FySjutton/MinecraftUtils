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

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label?: string
    showCopy?: boolean
    copyLabel?: string
    onChange?: (value: string) => void
    variant?: "text" | "number"
    maxLength?: number
    allowNegative?: boolean
}

export function InputField({
                               label,
                               showCopy = false,
                               copyLabel = "Copy",
                               value = "",
                               onChange,
                               variant = "text",
                               maxLength = 10,
                               allowNegative = false,
                               ...props
                           }: InputProps) {
    const { copyToClipboard, isCopied } = useCopyToClipboard()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        if (variant === "number") {
            // Remove any character that is not 0-9, comma, or "-" (if allowed)
            const regex = allowNegative ? /[^0-9\-,]/g : /[^0-9,]/g
            val = val.replace(regex, "")

            if (val.length > maxLength) val = val.slice(0, maxLength)

            // Replace leading "0" if user types a digit
            if (value === "0" && val.length > 0) {
                val = val.slice(-1)
            }

            if (val === "" || val === ",") val = "0"
        }

        onChange?.(val)
    }

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-gray-300">{label}</label>}

            <InputGroup className="w-full">
                <InputGroupInput
                    value={value}
                    onChange={handleChange}
                    className="outline-none"
                    {...props}
                />
                {showCopy && (
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            aria-label={copyLabel}
                            title={copyLabel}
                            size="icon-xs"
                            onClick={() => copyToClipboard(String(value))}
                        >
                            {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
                        </InputGroupButton>
                    </InputGroupAddon>
                )}
            </InputGroup>
        </div>
    )
}
