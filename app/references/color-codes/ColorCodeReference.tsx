"use client"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";

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

    const formattingCodes = [
        {
            preview: colorPreview("#000000"),
            name: "Black",
            formatting: "§0",
            hex: "#000000",
            motd: "\\u00A70",
        },
        {
            preview: colorPreview("#0000AA"),
            name: "Dark Blue",
            formatting: "§1",
            hex: "#0000AA",
            motd: "\\u00A71",
        },
        {
            preview: colorPreview("#00AA00"),
            name: "Dark Green",
            formatting: "§2",
            hex: "#00AA00",
            motd: "\\u00A72",
        },
        {
            preview: colorPreview("#00AAAA"),
            name: "Dark Aqua",
            formatting: "§3",
            hex: "#00AAAA",
            motd: "\\u00A73",
        },
        {
            preview: colorPreview("#AA0000"),
            name: "Dark Red",
            formatting: "§4",
            hex: "#AA0000",
            motd: "\\u00A74",
        },
        {
            preview: colorPreview("#AA00AA"),
            name: "Dark Purple",
            formatting: "§5",
            hex: "#AA00AA",
            motd: "\\u00A75",
        },
        {
            preview: colorPreview("#FFAA00"),
            name: "Gold",
            formatting: "§6",
            hex: "#FFAA00",
            motd: "\\u00A76",
        },
        {
            preview: colorPreview("#AAAAAA"),
            name: "Gray",
            formatting: "§7",
            hex: "#AAAAAA",
            motd: "\\u00A77",
        },
        {
            preview: colorPreview("#555555"),
            name: "Dark Gray",
            formatting: "§8",
            hex: "#555555",
            motd: "\\u00A78",
        },
        {
            preview: colorPreview("#5555FF"),
            name: "Blue",
            formatting: "§9",
            hex: "#5555FF",
            motd: "\\u00A79",
        },
        {
            preview: colorPreview("#55FF55"),
            name: "Green",
            formatting: "§a",
            hex: "#55FF55",
            motd: "\\u00A7a",
        },
        {
            preview: colorPreview("#55FFFF"),
            name: "Aqua",
            formatting: "§b",
            hex: "#55FFFF",
            motd: "\\u00A7b",
        },
        {
            preview: colorPreview("#FF5555"),
            name: "Red",
            formatting: "§c",
            hex: "#FF5555",
            motd: "\\u00A7c",
        },
        {
            preview: colorPreview("#FF55FF"),
            name: "Light Purple",
            formatting: "§d",
            hex: "#FF55FF",
            motd: "\\u00A7d",
        },
        {
            preview: colorPreview("#FFFF55"),
            name: "Yellow",
            formatting: "§e",
            hex: "#FFFF55",
            motd: "\\u00A7e",
        },
        {
            preview: colorPreview("#FFFFFF"),
            name: "White",
            formatting: "§f",
            hex: "#FFFFFF",
            motd: "\\u00A7f",
        },
        {
            preview: <span style={{ fontWeight: "bold" }}>Example</span>,
            name: "Bold",
            formatting: "§l",
            motd: "\\u00A7l",
        },
        {
            preview: <span style={{ fontStyle: "italic" }}>Example</span>,
            name: "Italic",
            formatting: "§o",
            motd: "\\u00A7o",
        },
        {
            preview: <span style={{ textDecoration: "underline" }}>Example</span>,
            name: "Underline",
            formatting: "§n",
            motd: "\\u00A7n",
        },
        {
            preview: <span style={{ textDecoration: "line-through" }}>Example</span>,
            name: "Strikethrough",
            formatting: "§m",
            motd: "\\u00A7m",
        },
        {
            preview: <span>{obfuscatedExample}</span>,
            name: "Obfuscated",
            formatting: "§k",
            motd: "\\u00A7k",
        },
        {
            preview: <span>Example</span>,
            name: "Reset",
            formatting: "§r",
            motd: "\\u00A7r",
        }
    ];

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