"use client"

import ConverterBase from "@/app/components/ConverterBase"
import {Combobox} from "@/components/ComboBox";
import ImageSlider from "@/app/components/ImageSlider";

const typeOptions = [
    { value: "levels", label: "Levels" },
    { value: "points", label: "Points" },
]

export default function Page() {
    return (
        <ConverterBase
            inputTypeSlot={<Combobox options={typeOptions} />}
            outputTypeSlot={<Combobox options={typeOptions} />}
            inputValueSlot={<ImageSlider />}
            outputValueSlot={null}
        />
    )
}
