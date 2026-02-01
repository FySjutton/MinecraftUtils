"use client"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {JSX, useEffect, useState} from "react";
import {ColorMeta, Colors} from "@/lib/Colors";

const colorPreview = (hex: string) => (
    <div
        style={{
            backgroundColor: hex,
            width: "100px",
            height: "24px",
            borderRadius: "4px"
        }}
    />
);

const obfuscationChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:'\",.<>/?\\|`~";

function useObfuscated(text: string, interval = 80) {
    const [obfuscated, setObfuscated] = useState(text);

    useEffect(() => {
        const timer = setInterval(() => {
            setObfuscated(
                text.split("").map(char => char === " " ? " " : obfuscationChars[Math.floor(Math.random() * obfuscationChars.length)]).join("")
            );
        }, interval);

        return () => clearInterval(timer);
    }, [text, interval]);

    return obfuscated;
}




export default function ColorCodeReference() {
    const obfuscatedExample = useObfuscated("Example");

    type FormattingCode = {
        preview: JSX.Element
        name: string
        formatting: string
        hex?: string
        motd: string
    }

    const formattingCodes: FormattingCode[] = ColorMeta.map(color => ({
        preview: colorPreview(Colors[color.key as keyof typeof Colors]),
        name: color.name,
        formatting: color.formatting,
        hex: Colors[color.key as keyof typeof Colors],
        motd: color.motd,
    }))

    formattingCodes.push(
        { preview: <span style={{ fontWeight: "bold" }}>Example</span>, name: "Bold", formatting: "§l", motd: "\\u00A7l" },
        { preview: <span style={{ fontStyle: "italic" }}>Example</span>, name: "Italic", formatting: "§o", motd: "\\u00A7o" },
        { preview: <span style={{ textDecoration: "underline" }}>Example</span>, name: "Underline", formatting: "§n", motd: "\\u00A7n" },
        { preview: <span style={{ textDecoration: "line-through" }}>Example</span>, name: "Strikethrough", formatting: "§m", motd: "\\u00A7m" },
        { preview: <span>{obfuscatedExample}</span>, name: "Obfuscated", formatting: "§k", motd: "\\u00A7k" },
        { preview: <span>Example</span>, name: "Reset", formatting: "§r", motd: "\\u00A7r" }
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Minecraft Formatting Codes</CardTitle>
                <CardDescription>
                    Here you can view a list of all formatting codes available for Minecraft Java Edition.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Table>
                    <TableCaption>A list of all Minecraft&#39;s formatting codes.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead style={{ width: "20%" }}>Preview</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Formatting Code</TableHead>
                            <TableHead>Hex</TableHead>
                            <TableHead>MOTD</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formattingCodes.map((code) => (
                            <TableRow key={code.name}>
                                <TableCell className="font-medium">{code.preview}</TableCell>
                                <TableCell>{code.name}</TableCell>
                                <TableCell>{code.formatting}</TableCell>
                                <TableCell>{code.hex}</TableCell>
                                <TableCell>{code.motd}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    )
}