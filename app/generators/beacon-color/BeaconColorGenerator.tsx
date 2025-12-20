"use client"

import { useState } from 'react'
import BeaconColorTool from "@/app/generators/beacon-color/beaconColorTool";
import GlassToBeaconColor from "@/app/generators/beacon-color/glassToBeaconColor";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function BeaconColorGenerator() {
    const [tab, setTab] = useState<'tool' | 'verify'>('tool');
    return (
        <Tabs value={tab} onValueChange={v => setTab(v as 'tool' | 'verify')} className="w-full">
            <TabsList className="mx-auto">
                <TabsTrigger value="tool">Beacon to Glass Calculator</TabsTrigger>
                <TabsTrigger value="verify">Glass to Beacon Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="tool" forceMount className="data-[state=inactive]:hidden">
                <BeaconColorTool/>
            </TabsContent>

            <TabsContent value="verify" forceMount className="data-[state=inactive]:hidden">
                <GlassToBeaconColor/>
            </TabsContent>
        </Tabs>
    )
}