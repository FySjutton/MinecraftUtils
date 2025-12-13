"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useState} from "react";
import SignPreview from "@/app/generators/sign-generator/SignPreview";
import SignEditor from "@/app/generators/sign-generator/SignEditor";
import {MinecraftText} from "@/lib/MinecraftText";


export default function SignGenerator() {
    const [output, setOutputAction] = useState<MinecraftText[][]>([[], [], [], [],])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Sign Generator</CardTitle>
                <CardDescription>
                    Edit the sign content directly on the sign, and copy the output command.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <SignEditor output={output} setOutputAction={setOutputAction} />
                <SignPreview lines={output} />
                {/*<div className="mb-5" />*/}
                {/*<InputField*/}
                {/*    showCopy*/}
                {/*    value={output}*/}
                {/*    label="Ready to paste content for your server motd."*/}
                {/*    readOnly*/}
                {/*/>*/}
            </CardContent>
        </Card>
    )
}
