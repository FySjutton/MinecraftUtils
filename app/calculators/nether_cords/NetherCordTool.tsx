"use client"

import { useState } from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InputField } from "@/components/InputField"

export default function NetherCordTool() {
    const [owX, setOwX] = useState("0")
    const [owY, setOwY] = useState("63")
    const [owZ, setOwZ] = useState("0")

    const [nX, setNX] = useState("0")
    const [nY, setNY] = useState("63")
    const [nZ, setNZ] = useState("0")

    const [active, setActive] = useState<"ow" | "nether" | null>(null)

    const safeNumber = (val: string) => {
        if (val === "" || val === "-" || val === ",") return 0
        const n = Number(val.replace(",", "."))
        return isNaN(n) ? 0 : n
    }

    const handleOwChange = (x: string, y: string, z: string) => {
        setActive("ow")
        setOwX(x || "0")
        setOwY(y || "0")
        setOwZ(z || "0")

        if (active !== "ow") return

        setNX(Math.floor(safeNumber(x) / 8).toString())
        setNY(y)
        setNZ(Math.floor(safeNumber(z) / 8).toString())
    }

    const handleNetherChange = (x: string, y: string, z: string) => {
        setActive("nether")
        setNX(x || "0")
        setNY(y || "0")
        setNZ(z || "0")

        if (active !== "nether") return

        setOwX((safeNumber(x) * 8).toString())
        setOwY(y)
        setOwZ((safeNumber(z) * 8).toString())
    }

    const reset = () => {
        setOwX("0")
        setOwY("63")
        setOwZ("0")
        setNX("0")
        setNY("63")
        setNZ("0")
        setActive(null)
    }

    return (
        <div className="w-[100%] lg:w-[80%] md:w-[90%] mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nether ↔ Overworld Coordinates Converter</CardTitle>
                    <CardDescription>
                        Edit any coordinate in either dimension and the other dimension updates automatically.
                    </CardDescription>
                    <CardAction>
                        <Button variant="outline" onClick={reset}>Reset</Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <CardDescription className="font-medium">Overworld Coordinates</CardDescription>
                        <div className="grid grid-cols-3 gap-2">
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={owX}
                                onFocus={() => setActive("ow")}
                                onChange={(val) => handleOwChange(val, owY, owZ)}
                                placeholder="X"
                            />
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={owY}
                                onFocus={() => setActive("ow")}
                                onChange={(val) => handleOwChange(owX, val, owZ)}
                                placeholder="Y"
                            />
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={owZ}
                                onFocus={() => setActive("ow")}
                                onChange={(val) => handleOwChange(owX, owY, val)}
                                placeholder="Z"
                            />
                        </div>
                    </div>

                    <div>
                        <CardDescription className="font-medium">Nether Coordinates</CardDescription>
                        <div className="grid grid-cols-3 gap-2">
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={nX}
                                onFocus={() => setActive("nether")}
                                onChange={(val) => handleNetherChange(val, nY, nZ)}
                                placeholder="X"
                            />
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={nY}
                                onFocus={() => setActive("nether")}
                                onChange={(val) => handleNetherChange(nX, val, nZ)}
                                placeholder="Y"
                            />
                            <InputField
                                variant="number"
                                allowNegative={true}
                                value={nZ}
                                onFocus={() => setActive("nether")}
                                onChange={(val) => handleNetherChange(nX, nY, val)}
                                placeholder="Z"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
