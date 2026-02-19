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
    onChange?: (value: string) => void
    variant?: "text" | "number"
    maxLength?: number
    allowNegative?: boolean
    min?: number
    max?: number
}

export function InputField({label, showCopy = false, value = "", onChange, variant = "text", maxLength = 10, allowNegative = false, min, max, ...props}: InputProps) {
    const { copyToClipboard, isCopied } = useCopyToClipboard()
    const [inputValue, setInputValue] = React.useState(String(value))
    const [isValid, setIsValid] = React.useState(true)

    React.useEffect(() => {
        setInputValue(String(value))
    }, [value])

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

            setInputValue(val)

            const numericValue = parseInt(val.replace(/,/g, ""), 10)

            let valid = true
            if (isNaN(numericValue)) {
                valid = false
            } else {
                if (min !== undefined && numericValue < min) valid = false
                if (max !== undefined && numericValue > max) valid = false
            }

            setIsValid(valid)

            if (valid) {
                onChange?.(val)
            }
        } else {
            setInputValue(val)
            onChange?.(val)
            setIsValid(true)
        }
    }

    const handleCopy = () => {
        copyToClipboard(String(value))
    }

    return (
        <div className="flex flex-col gap-1 w-full relative">
            {label && <label className="text-sm font-medium text-gray-300">{label}</label>}

            <div
                onClick={showCopy ? handleCopy : undefined}
                className={`relative flex items-center gap-2 rounded-md border-input border bg-transparent dark:bg-input/30 px-3 py-2 text-sm ${
                    showCopy ? "cursor-pointer hover:bg-muted" : ""
                } ${!isValid ? "border-destructive ring-destructive/20 dark:ring-destructive/40" : ""}`}
            >
                {showCopy && isCopied && (
                    <div className="absolute left-[50%] -top-full translate-x-[-50%] translate-y-[65%] rounded bg-lime-300 px-2 py-1 text-xs text-black">
                        Copied!
                    </div>
                )}

                    {!isValid && variant === "number" && (
                        <div className="absolute left-[50%] -top-full translate-x-[-50%] translate-y-[65%] rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                            {min !== undefined && max !== undefined
                                ? `${min}-${max}`
                                : min !== undefined
                                    ? `Min: ${min}`
                                    : `Max: ${max}`}
                        </div>
                    )}

                    <input
                        value={inputValue}
                        onChange={handleChange}
                        readOnly={showCopy}
                        className={`min-w-0 bg-transparent outline-none ${
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