'use client'

import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Page() {
    // Overworld coordinates
    const [owX, setOwX] = useState(0)
    const [owY, setOwY] = useState(63)
    const [owZ, setOwZ] = useState(0)

    // Nether coordinates
    const [nX, setNX] = useState(0)
    const [nY, setNY] = useState(63)
    const [nZ, setNZ] = useState(0)

    // Track which input the user is currently editing
    const [active, setActive] = useState<'ow' | 'nether' | null>(null)

    const handleOwChange = (x: number, y: number, z: number) => {
        setActive('ow')
        setOwX(x)
        setOwY(y)
        setOwZ(z)

        if (active !== 'ow') return
        setNX(Math.floor(x / 8))
        setNY(y)
        setNZ(Math.floor(z / 8))
    }

    const handleNetherChange = (x: number, y: number, z: number) => {
        setActive('nether')
        setNX(x)
        setNY(y)
        setNZ(z)

        if (active !== 'nether') return
        setOwX(x * 8)
        setOwY(y)
        setOwZ(z * 8)
    }

    const reset = () => {
        setOwX(0)
        setOwY(63)
        setOwZ(0)
        setNX(0)
        setNY(63)
        setNZ(0)
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
                    {/* Overworld Inputs */}
                    <div>
                        <CardDescription className="font-medium">Overworld Coordinates</CardDescription>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                type="number"
                                value={owX}
                                onFocus={() => setActive('ow')}
                                onChange={(e) => handleOwChange(Number(e.target.value), owY, owZ)}
                                placeholder="X"
                            />
                            <Input
                                type="number"
                                value={owY}
                                onFocus={() => setActive('ow')}
                                onChange={(e) => handleOwChange(owX, Number(e.target.value), owZ)}
                                placeholder="Y"
                            />
                            <Input
                                type="number"
                                value={owZ}
                                onFocus={() => setActive('ow')}
                                onChange={(e) => handleOwChange(owX, owY, Number(e.target.value))}
                                placeholder="Z"
                            />
                        </div>
                    </div>

                    {/* Nether Inputs */}
                    <div>
                        <CardDescription className="font-medium">Nether Coordinates</CardDescription>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                type="number"
                                value={nX}
                                onFocus={() => setActive('nether')}
                                onChange={(e) => handleNetherChange(Number(e.target.value), nY, nZ)}
                                placeholder="X"
                            />
                            <Input
                                type="number"
                                value={nY}
                                onFocus={() => setActive('nether')}
                                onChange={(e) => handleNetherChange(nX, Number(e.target.value), nZ)}
                                placeholder="Y"
                            />
                            <Input
                                type="number"
                                value={nZ}
                                onFocus={() => setActive('nether')}
                                onChange={(e) => handleNetherChange(nX, nY, Number(e.target.value))}
                                placeholder="Z"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
