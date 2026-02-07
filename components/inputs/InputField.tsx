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

    const handleCopy = () => {
        copyToClipboard(String(value))
    }

    return (
        <div className="flex flex-col gap-1 w-full relative">
            {label && <label className="text-sm font-medium text-gray-300">{label}</label>}

            <div
                onClick={showCopy ? handleCopy : undefined}
                className={`relative flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm ${
                    showCopy ? "cursor-pointer hover:bg-muted" : ""
                }`}
            >
                {showCopy && isCopied && (
                    <div className="absolute left-[50%] -top-full translate-x-[-50%] translate-y-[65%] rounded bg-lime-300 px-2 py-1 text-xs text-black">
                        Copied!
                    </div>
                )}

                <input
                    value={value}
                    onChange={handleChange}
                    readOnly={showCopy}
                    className={`flex-1 bg-transparent outline-none ${
                        showCopy ? "cursor-pointer select-all truncate" : ""
                    }`}
                    {...props}
                />

                {showCopy && (
                    <div>
                        {isCopied ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                        ) : (
                            <IconCopy className="h-4 w-4 opacity-60" />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

