"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComboBox } from "@/components/ComboBox"
import { Separator } from "@/components/ui/separator"
import { InputField } from "@/components/InputField"

const typeOptions = ["Items", "Stacks (16)", "Stacks (64)", "Shulker Boxes (27 slots)"]

const conversionMap: Record<string, number> = {
    "Items": 1,
    "Stacks (16)": 16,
    "Stacks (64)": 64,
    "Shulker Boxes (27 slots)": 27 * 64
}

export default function UnitsTool() {
    const [inputValue, setInputValue] = useState("0")
    const [inputType, setInputType] = useState<string>("Items")

    const safeNumber = (val: string) => {
        const n = Number(val.replace(",", "."))
        return isNaN(n) ? 0 : n
    }

    const totalItems = safeNumber(inputValue) * conversionMap[inputType]

    const shulkerBoxes = Math.floor(totalItems / (27 * 64))
    const remainingStacks = Math.floor((totalItems - shulkerBoxes * (27 * 64)) / 64)
    const totalStacks = Math.floor(totalItems / 64)
    const remainingItems = totalItems % 64

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6">
            <Card className="w-full md:w-1/2">
                <CardHeader>
                    <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <ComboBox
                        items={typeOptions}
                        value={inputType}
                        onChange={setInputType}
                        placeholder="Select type"
                        placeholderSearch="Search type..."
                        width="300px"
                    />
                    <InputField
                        variant="number"
                        maxLength={10}
                        value={inputValue}
                        label="Enter amount"
                        onChange={setInputValue}
                    />
                </CardContent>
            </Card>

            <Card className="w-full md:w-1/2">
                <CardHeader>
                    <CardTitle>Output</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <InputField
                        showCopy
                        value={shulkerBoxes.toString()}
                        label="Shulker Boxes"
                        readOnly
                    />
                    <InputField
                        showCopy
                        value={remainingStacks.toString()}
                        label="Remaining Stacks"
                        readOnly
                    />
                    <InputField
                        showCopy
                        value={remainingItems.toString()}
                        label="Remaining Items"
                        readOnly
                    />
                    <Separator />
                    <InputField
                        showCopy
                        value={totalItems.toString()}
                        label="Total Items"
                        readOnly
                    />
                    <InputField
                        showCopy
                        value={totalStacks.toString()}
                        label="Total Stacks"
                        readOnly
                    />
                </CardContent>
            </Card>
        </div>

    )
}
