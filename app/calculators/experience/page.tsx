"use client"

import { Input } from "@/components/ui/input"
import ConverterBase from "@/app/components/ConverterBase"
import { Combobox } from "@/components/ComboBox"
import ImageSlider from "@/app/calculators/experience/ImageSlider"
import { useState } from "react"

const typeOptions = [
    { value: "levels", label: "Levels" },
    { value: "points", label: "Points" },
]

type ValueSlotProps = {
    type: string
    xp: number
    setXp: (xp: number) => void
}

function ValueSlot({ type, xp, setXp }: ValueSlotProps) {
    if (type === "levels") {
        return <ImageSlider xp={xp} xpChangeAction={setXp} />
    } else {
        return (
            <Input
                type="number"
                value={xp === null ? "" : Math.floor(xp)}
                onChange={(e) => {
                    const val = e.target.value
                    setXp(val === "" ? 0 : Number(val))
                }}
                className="w-[90%]"
            />
        )
    }
}

export default function Page() {
    const [xp, setXp] = useState(0)
    const [leftType, setLeftType] = useState<string>("levels")
    const [rightType, setRightType] = useState<string>("levels")


    return (
        <ConverterBase
            leftTypeSlot={
                <Combobox
                    options={typeOptions}
                    value={leftType}
                    onChangeAction={(val) => setLeftType(val)}
                />
            }
            leftValueSlot={<ValueSlot type={leftType} xp={xp} setXp={setXp} />}
            rightTypeSlot={
                <Combobox
                    options={typeOptions}
                    value={rightType}
                    onChangeAction={(val) => setRightType(val)}
                />
            }
            rightValueSlot={<ValueSlot type={rightType} xp={xp} setXp={setXp} />}
        />
    )
}
