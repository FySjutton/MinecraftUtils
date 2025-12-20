"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GLASS_COLORS, beaconColor, deltaE_lab_rgb, RGB } from "@/app/generators/beacon-color/colorCalculator";

const COLOR_NAMES = Object.keys(GLASS_COLORS);

export default function GlassToBeaconColor() {
    const [input, setInput] = useState('Yellow, Gray, Yellow, Green');
    const [targetHex, setTargetHex] = useState('#00eb76');
    const [result, setResult] = useState<any>(null);

    const target = useMemo(() => {
        const h = targetHex.startsWith('#') ? targetHex.slice(1) : targetHex;
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)] as RGB;
    }, [targetHex]);

    function parseStack(str: string): RGB[] {
        return str.split(',').map(s => s.trim()).map(name => {
            const key = COLOR_NAMES.find(k => k.toLowerCase() === name.toLowerCase());
            return key ? GLASS_COLORS[key] : null;
        }).filter(Boolean) as RGB[];
    }

    function onCalculate() {
        const stack = parseStack(input);
        if (stack.length === 0) return;
        const color = beaconColor(stack);
        const dist = deltaE_lab_rgb(target, color);
        const maxDist = deltaE_lab_rgb([0,0,0],[255,255,255]);
        const accuracy = Math.max(0, 1 - dist / maxDist) * 100;
        setResult({ stack, color, dist, accuracy });
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Glass → Beacon Color (verify)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Input type="color" value={targetHex} onChange={e=>setTargetHex(e.target.value)} />
                        <span className="text-sm">Target: {targetHex}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Enter stack (bottom → top), comma separated</label>
                        <Input value={input} onChange={e=>setInput(e.target.value)} />
                    </div>
                    <Button onClick={onCalculate}>Calculate</Button>

                    {result && <>
                        <Separator />
                        <div className="font-semibold">Beacon Result</div>
                        <ul className="list-disc list-inside">
                            {result.stack.map((rgb:RGB, i:number)=>{
                                const name = COLOR_NAMES.find(k => GLASS_COLORS[k][0]===rgb[0] && GLASS_COLORS[k][1]===rgb[1] && GLASS_COLORS[k][2]===rgb[2]);
                                return <li key={i}>{name ?? `RGB(${rgb.join(',')})`}</li>
                            })}
                        </ul>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border" style={{backgroundColor: `rgb(${result.color.join(',')})`}} />
                            <span>Beacon RGB: {result.color.join(', ')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">ΔE (CIEDE2000): {result.dist.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Accuracy: {result.accuracy.toFixed(2)}%</div>
                    </>}
                </CardContent>
            </Card>
        </div>
    )
}
