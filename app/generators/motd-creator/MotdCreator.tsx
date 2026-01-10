"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import MotdEditor from "@/app/generators/motd-creator/MotdEditor";
import {useState} from "react";
import {InputField} from "@/components/InputField";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";

export default function MotdCreator() {
    const [output, setOutputAction] = useState('');

    return (
        <><Card className="w-full">
            <CardHeader>
                <CardTitle>Motd Creator</CardTitle>
                <CardDescription>Edit the server image directly and get a ready-to-paste content for your server
                    motd.</CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <MotdEditor output={output} setOutputAction={setOutputAction}/>
                <div className="mb-5"/>
                <InputField
                    showCopy
                    value={output}
                    label="Ready to paste content for your server motd."
                    readOnly/>
            </CardContent>
        </Card><Card>
            <CardHeader>
                <CopyShareLinkInput/>
            </CardHeader>
        </Card></>
    )
}
