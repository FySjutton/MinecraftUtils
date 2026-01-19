"use client"
import React from "react"
import {ColorPicker} from "@/components/ColorPicker";

export type UtilInput<T = any> = {
    name: string
    label: string
    kind: "text" | "color"
    defaultValue?: T
}

export type UtilBaseProps<TValues> = {
    title: string
    inputs: UtilInput[]
    onGenerate: (values: TValues) => void
    renderResult?: () => React.ReactNode
}

export default function UtilBase<TValues extends Record<string, any>>({
                                                                          title,
                                                                          inputs,
                                                                          onGenerate,
                                                                          renderResult,
                                                                      }: UtilBaseProps<TValues>) {

    const valuesRef = React.useRef<Record<string, any>>({})

    function setValue(name: string, value: any) {
        valuesRef.current[name] = value
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        onGenerate(valuesRef.current as TValues)
    }

    return (
        <div className="util-base">
            <h1>{title}</h1>

            <form onSubmit={handleSubmit}>
                {inputs.map(input => (
                    <InputField
                        key={input.name}
                        input={input}
                        setValue={setValue}
                    />
                ))}

                <button type="submit">Generate</button>
            </form>

            {renderResult?.()}
        </div>
    )
}

function InputField({
                        input,
                        setValue,
                    }: {
    input: UtilInput
    setValue: (name: string, value: any) => void
}) {
    const [value, setLocalValue] = React.useState(
        input.defaultValue ?? ""
    )

    React.useEffect(() => {
        setValue(input.name, value)
    }, [value])

    return (
        <div>
            <label>{input.label}</label>

            {input.kind === "text" && (
                <input
                    type="text"
                    value={value}
                    onChange={e => setLocalValue(e.target.value)}
                />
            )}

            {input.kind === "color" && (
                <ColorPicker
                    hex={value}
                    setHex={setLocalValue}
                />
            )}
        </div>
    )
}
