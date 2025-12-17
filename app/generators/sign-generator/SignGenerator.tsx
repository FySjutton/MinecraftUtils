'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import SignPreview from '@/app/generators/sign-generator/SignPreview'
import SignEditor from '@/app/generators/sign-generator/SignEditor'
import { MinecraftText } from '@/lib/MinecraftText'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ColorSelect from '@/components/ColorSelect'
import {Toggle} from "@/components/ui/toggle";
import Image from "next/image";
import SignSelector, {SignState} from "@/app/generators/sign-generator/SignSelector";

export interface SignSide {
    lines: MinecraftText[][]
    color: string | null
    glowing: boolean,
    waxed: boolean
}

export interface SignData {
    front: SignSide
    back: SignSide
}

export default function SignGenerator() {
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
    const [signData, setSignData] = useState<SignData>({
        front: { lines: [], color: null, glowing: false, waxed: false },
        back: { lines: [], color: null, glowing: false, waxed: false },
    })
    const [sign, setSign] = useState<SignState>({
        signMaterial: "spruce",
        signType: "sign",
    })

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Sign Generator</CardTitle>
                <CardDescription>Edit the sign content directly on the sign.</CardDescription>
            </CardHeader>

            <CardContent className="h-full">
                <div className="mb-5">
                    <label>Sign Type</label>
                    <SignSelector
                        value={sign}
                        onChange={(newSign) => {
                            setSign(newSign)
                        }}
                    />
                </div>

                <Tabs value={activeSide} onValueChange={v => setActiveSide(v as 'front' | 'back')}>
                    <TabsList>
                        <TabsTrigger value="front">Front</TabsTrigger>
                        <TabsTrigger value="back">Back</TabsTrigger>
                    </TabsList>

                    <TabsContent value="front" forceMount className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Front Side</CardTitle>
                                <CardDescription>Edit the front text and choose color. Preview is below.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-full space-y-2">
                                <SignEditor
                                    output={signData.front.lines}
                                    setOutputAction={lines =>
                                        setSignData(prev => ({ ...prev, front: { ...prev.front, lines } }))
                                    }
                                />
                                <div className="flex gap-4">
                                    {/* Color select */}
                                    <div>
                                        <label>Sign Color</label>
                                        <ColorSelect
                                            value={signData.front.color ?? "none"}
                                            onChange={color =>

                                                setSignData(prev => ({ ...prev, front: { ...prev.front, color: (color == "none" ? null : color) } }))
                                            }
                                        />
                                    </div>

                                    {/* Glowing switch */}
                                    <div>
                                        <label>Glowing Text Color</label>
                                        <Toggle
                                            aria-label="Front Glowing"
                                            size="default"
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            pressed={signData.front.glowing ?? false}
                                            onPressedChange={checked =>
                                                setSignData(prev => ({
                                                    ...prev,
                                                    front: { ...prev.front, glowing: checked },
                                                }))
                                            }
                                        >
                                            <Image
                                                src={signData.front.glowing
                                                    ? "/assets/tool/sign/glow_ink_sac.png"
                                                    : "/assets/tool/sign/ink_sac.png"}
                                                alt="glowing icon"
                                                width={16}
                                                height={16}
                                                className="w-5 h-5"
                                            />
                                            <span>{signData.front.glowing ? "Glowing" : "Normal"}</span>
                                        </Toggle>
                                    </div>
                                    {/* Waxed switch */}
                                    <div>
                                        <label>Waxed</label>
                                        <Toggle
                                            aria-label="Waxed"
                                            size="default"
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            pressed={signData.front.waxed ?? false}
                                            onPressedChange={checked =>
                                                setSignData(prev => ({
                                                    ...prev,
                                                    front: { ...prev.front, waxed: checked },
                                                }))
                                            }
                                        >
                                            <Image
                                                src={signData.front.waxed
                                                    ? "/assets/tool/sign/honey_comb.png"
                                                    : "/assets/tool/sign/empty_honey_comb.png"}
                                                alt="waxed icon"
                                                width={16}
                                                height={16}
                                                className="w-5 h-5"
                                            />
                                            <span>{signData.front.waxed ? "Waxed" : "Normal"}</span>
                                        </Toggle>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="back" forceMount className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Back Side</CardTitle>
                                <CardDescription>Edit the back text and choose color. Preview is below.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-full space-y-2">
                                <SignEditor
                                    output={signData.back.lines}
                                    setOutputAction={lines =>
                                        setSignData(prev => ({ ...prev, back: { ...prev.back, lines } }))
                                    }
                                />
                                <div className="flex gap-4">
                                    {/* Color select */}
                                    <div>
                                        <label>Sign Color</label>
                                        <ColorSelect
                                            value={signData.back.color ?? "none"}
                                            onChange={color =>

                                                setSignData(prev => ({ ...prev, back: { ...prev.back, color: (color == "none" ? null : color) } }))
                                            }
                                        />
                                    </div>

                                    {/* Glowing switch */}
                                    <div>
                                        <label>Glowing Text Color</label>
                                        <Toggle
                                            aria-label="Back Glowing"
                                            size="default"
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            pressed={signData.back.glowing ?? false}
                                            onPressedChange={checked =>
                                                setSignData(prev => ({
                                                    ...prev,
                                                    back: { ...prev.back, glowing: checked },
                                                }))
                                            }
                                        >
                                            <Image
                                                src={signData.back.glowing
                                                    ? "/assets/tool/sign/glow_ink_sac.png"
                                                    : "/assets/tool/sign/ink_sac.png"}
                                                alt="glowing icon"
                                                width={16}
                                                height={16}
                                                className="w-5 h-5"
                                            />
                                            <span>{signData.back.glowing ? "Glowing" : "Normal"}</span>
                                        </Toggle>
                                    </div>
                                    {/* Waxed switch */}
                                    <div>
                                        <label>Waxed</label>
                                        <Toggle
                                            aria-label="Waxed"
                                            size="default"
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            pressed={signData.back.waxed ?? false}
                                            onPressedChange={checked =>
                                                setSignData(prev => ({
                                                    ...prev,
                                                    back: { ...prev.back, waxed: checked },
                                                }))
                                            }
                                        >
                                            <Image
                                                src={signData.back.waxed
                                                    ? "/assets/tool/sign/honey_comb.png"
                                                    : "/assets/tool/sign/empty_honey_comb.png"}
                                                alt="waxed icon"
                                                width={16}
                                                height={16}
                                                className="w-5 h-5"
                                            />
                                            <span>{signData.back.waxed ? "Waxed" : "Normal"}</span>
                                        </Toggle>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="w-full mt-4 h-[300px] border rounded-md">
                    <SignPreview front={signData.front} back={signData.back} signMaterial={sign.signMaterial} signType={sign.signType} />
                </div>
            </CardContent>
        </Card>
    )
}
