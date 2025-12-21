"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface StepSliderProps
    extends Omit<
        React.ComponentProps<typeof SliderPrimitive.Root>,
        "value" | "defaultValue" | "onValueChange"
    > {
    value?: number
    defaultValue?: number
    onValueChange?: (value: number) => void
    min?: number
    max?: number
    warningStep?: number
}

const StepSlider: React.FC<StepSliderProps> = ({
                                                   value,
                                                   defaultValue,
                                                   onValueChange,
                                                   min = 0,
                                                   max = 10,
                                                   warningStep = 7,
                                                   className,
                                                   ...props
                                               }) => {
    const [internalValue, setInternalValue] = React.useState<number>(
        value ?? defaultValue ?? min
    )

    React.useEffect(() => {
        if (value !== undefined) setInternalValue(value)
    }, [value])

    const handleChange = (vals: number[]) => {
        setInternalValue(vals[0])
        onValueChange?.(vals[0])
    }

    const isHigh = internalValue >= warningStep

    return (
        <div className="flex flex-col items-center w-full relative">
            {/* Step labels as circles above the track */}
            <div className="relative w-full flex justify-between mb-2">
                {Array.from({ length: max - min + 1 }, (_, i) => {
                    const step = i + min
                    return (
                        <div
                            key={step}
                            className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                                step >= warningStep ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-700"
                            )}
                        >
                            {step}
                        </div>
                    )
                })}
            </div>

            <SliderPrimitive.Root
                value={[internalValue]}
                defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
                min={min}
                max={max}
                step={1}
                onValueChange={handleChange}
                className={cn(
                    "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
                    className
                )}
                {...props}
            >
                <SliderPrimitive.Track
                    className="bg-muted relative grow overflow-hidden rounded-full h-1.5 w-full"
                >
                    <SliderPrimitive.Range
                        className={cn(
                            "absolute h-full",
                            isHigh ? "bg-red-500" : "bg-primary"
                        )}
                    />
                </SliderPrimitive.Track>

                <SliderPrimitive.Thumb
                    className={cn(
                        "border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-none",
                        isHigh ? "border-red-500" : "border-primary"
                    )}
                />
            </SliderPrimitive.Root>
        </div>
    )
}

export { StepSlider }
