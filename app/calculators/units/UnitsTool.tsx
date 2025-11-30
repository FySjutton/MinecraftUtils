"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComboBox } from "@/components/ComboBox"
import { CopyInput } from "@/components/CopyInput"
import {Separator} from "@/components/ui/separator";

const typeOptions = ["Items", "Stacks (16)", "Stacks (64)", "Shulker Boxes (27 slots)"]

const conversionMap: Record<string, number> = {
    "Items": 1,
    "Stacks (16)": 16,
    "Stacks (64)": 64,
    "Shulker Boxes (27 slots)": 27 * 64
}

export default function UnitsTool() {
    const [inputValue, setInputValue] = useState<number>(0)
    const [inputType, setInputType] = useState<string>("Items")

    const totalItems = inputValue * conversionMap[inputType]

    const shulkerBoxes = Math.floor(totalItems / (27 * 64))
    const remainingStacks = Math.floor((totalItems - shulkerBoxes * (27 * 64)) / 64)
    const totalStacks = Math.floor(totalItems / 64)
    const remainingItems = totalItems % 64

    return (
        <div className="flex gap-6 p-6">
            {/* Left Card */}
            <Card className="w-1/2">
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
                    <CopyInput
                        value={inputValue.toString()}
                        label="Enter amount"
                        onChange={(val) => setInputValue(Number(val))}
                    />
                </CardContent>
            </Card>

            {/* Right Card */}
            <Card className="w-1/2">
                <CardHeader>
                    <CardTitle>Output</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <CopyInput
                        value={shulkerBoxes.toString()}
                        label="Shulker Boxes"
                        readOnly
                    />
                    <CopyInput
                        value={remainingStacks.toString()}
                        label="Remaining Stacks"
                        readOnly
                    />
                    <CopyInput
                        value={remainingItems.toString()}
                        label="Remaining Items"
                        readOnly
                    />
                    <Separator></Separator>
                    <CopyInput
                        value={totalItems.toString()}
                        label="Total Items"
                        readOnly
                    />
                    <CopyInput
                        value={totalStacks.toString()}
                        label="Total Stacks"
                        readOnly
                    />
                </CardContent>
            </Card>
        </div>
    )
}
