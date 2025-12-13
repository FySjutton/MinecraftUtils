"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import MotdEditor from "@/app/generators/motd-creator/MotdEditor";
import {SetStateAction, useState} from "react";
import {InputField} from "@/components/InputField";
import SignPreview from "@/app/generators/sign-generator/SignPreview";
import SignEditor from "@/app/generators/sign-generator/SignEditor";

function getLines(output: string): string[] {
    const split = output.split('\n')
    const lines = split.slice(0, 4)
    while (lines.length < 4) lines.push('')
    return lines
}

export default function SignGenerator() {
    const [output, setOutputAction] = useState('')

    const lines = getLines(output)

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
                <SignPreview lines={lines} />
                <div className="mb-5" />
                <InputField
                    showCopy
                    value={output}
                    label="Ready to paste content for your server motd."
                    readOnly
                />
            </CardContent>
        </Card>
    )
}
