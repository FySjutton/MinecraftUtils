import ConverterBase from "@/app/components/ConverterBase"

export default function Page() {
    return (
        <ConverterBase
            inputTypeSlot={<div>Input type</div>}
            outputTypeSlot={<div>Output type</div>}
            inputValueSlot={<div>Input value</div>}
            outputValueSlot={<div>Output value</div>}
        />
    )
}
