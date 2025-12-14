'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import SignPreview from '@/app/generators/sign-generator/SignPreview'
import SignEditor from '@/app/generators/sign-generator/SignEditor'
import { MinecraftText } from '@/lib/MinecraftText'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SignGenerator() {
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
    const [output, setOutputAction] = useState<{ front: MinecraftText[][]; back: MinecraftText[][] }>({front: [], back: []})

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
                        <SignEditor
                            output={output.front}
                            setOutputAction={lines =>
                                setOutputAction(prev => ({ ...prev, front: lines }))
                            }
                        />
                    </TabsContent>

                    <TabsContent value="back" forceMount className="data-[state=inactive]:hidden">
                        <SignEditor
                            output={output.back}
                            setOutputAction={lines =>
                                setOutputAction(prev => ({ ...prev, back: lines }))
                            }
                        />
                    </TabsContent>
                </Tabs>

                <div className="mt-4">
                    <SignPreview linesFront={output.front} linesBack={output.back} />
                </div>
            </CardContent>
        </Card>
    )
}
