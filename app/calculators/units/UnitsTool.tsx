"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {ComboBox} from "@/components/inputs/dropdowns/ComboBox"
import {Separator} from "@/components/ui/separator"
import {InputField} from "@/components/inputs/InputField"
import {CopyShareLinkInput} from "@/components/inputs/CopyShareLinkInput";
import {useQueryState} from "nuqs";
import {enumParser, useUrlUpdateEmitter} from "@/lib/urlParsers";

const typeOptions = ["Items", "Stacks (16)", "Stacks (64)", "Shulker Boxes (27 slots)"]

const conversionMap: Record<string, number> = {
    "Items": 1,
    "Stacks (16)": 16,
    "Stacks (64)": 64,
    "Shulker Boxes (27 slots)": 27 * 64
}
const typeParser = enumParser(typeOptions).withDefault("Items");

export default function UnitsTool() {
    useUrlUpdateEmitter()
    const [inputValue, setInputValue] = useQueryState("value", {defaultValue: "0"});
    const [inputType, setInputType] = useQueryState("type", typeParser);

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
        <div className="flex flex-col md:flex-row gap-6">
            <Card className="w-full md:w-1/2">
                <CardHeader>
                    <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-wrap w-full">
                    <div className="flex flex-col gap-4 w-full">
                        <ComboBox
                            items={typeOptions}
                            value={inputType}
                            onChange={setInputType}
                            placeholder="Select type"
                            placeholderSearch="Search type..."
                            className="w-full"
                        />
                        <InputField
                            variant="number"
                            maxLength={10}
                            value={inputValue}
                            label="Enter amount"
                            onChange={setInputValue}
                        />
                    </div>
                    <CopyShareLinkInput className="mx-auto mt-2 md:mt-auto"></CopyShareLinkInput>
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
