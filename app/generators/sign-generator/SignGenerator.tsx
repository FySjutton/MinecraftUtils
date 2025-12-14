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

export interface SignSide {
    lines: MinecraftText[][]
    color: string
    glowing: boolean
}

export interface SignData {
    front: SignSide
    back: SignSide
}

export default function SignGenerator() {
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
    const [signData, setSignData] = useState<SignData>({
        front: { lines: [], color: 'none', glowing: false },
        back: { lines: [], color: 'none', glowing: false },
    })

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Sign Generator</CardTitle>
                <CardDescription>Edit the sign content directly on the sign.</CardDescription>
            </CardHeader>

            <CardContent className="h-full">
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
                                            value={signData.front.color}
                                            onChange={color =>
                                                setSignData(prev => ({ ...prev, front: { ...prev.front, color } }))
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
                                <label>Sign Color</label>
                                <ColorSelect
                                    value={signData.back.color}
                                    onChange={color =>
                                        setSignData(prev => ({ ...prev, back: { ...prev.back, color } }))
                                    }
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-4">
                    <SignPreview front={signData.front} back={signData.back} />
                </div>
            </CardContent>
        </Card>
    )
}
