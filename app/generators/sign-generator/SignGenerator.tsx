"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useState} from "react";
import SignPreview from "@/app/generators/sign-generator/SignPreview";
import SignEditor from "@/app/generators/sign-generator/SignEditor";
import {MinecraftText} from "@/lib/MinecraftText";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export default function SignGenerator() {
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
    const [output, setOutputAction] = useState<{
        front: MinecraftText[][]
        back: MinecraftText[][]
    }>({
        front: [],
        back: [],
    })


    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Sign Generator</CardTitle>
                <CardDescription>Edit the sign content directly on the sign.</CardDescription>
            </CardHeader>

            <CardContent className="h-full">
                <Tabs value={activeSide} onValueChange={value => setActiveSide(value as 'front' | 'back')}>
                    <TabsList>
                        <TabsTrigger value="front">Front</TabsTrigger>
                        <TabsTrigger value="back">Back</TabsTrigger>
                    </TabsList>

                    <TabsContent value="front">
                        <SignEditor
                            key="front"
                            output={output.front}
                            setOutputAction={lines =>
                                setOutputAction(prev => ({ ...prev, front: [...lines] }))
                            }
                        />
                    </TabsContent>

                    <TabsContent value="back">
                        <SignEditor
                            key="back"
                            output={output.back}
                            setOutputAction={lines =>
                                setOutputAction(prev => ({ ...prev, back: [...lines] }))
                            }
                        />
                    </TabsContent>

                </Tabs>

                <SignPreview
                    linesFront={output.front}
                    linesBack={output.back}
                />
            </CardContent>
        </Card>
    )
}

