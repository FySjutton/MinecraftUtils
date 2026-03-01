"use client"

import BeaconToGlassTool from "@/app/generators/beacon-color/subtools/beaconToGlassTool";
import GlassToBeaconColor from "@/app/generators/beacon-color/subtools/glassToBeaconTool";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useQueryState} from "nuqs";
import {enumParser, useUrlUpdateEmitter} from "@/lib/urlParsers";

const tabs = ["tool", "verify"] as const;
type Tab = (typeof tabs)[number];

export default function BeaconColorGenerator() {
    useUrlUpdateEmitter()
    const [tab, setTab] = useQueryState<Tab>("tab", enumParser(tabs).withDefault("tool"));

    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Beacon Beam Calculator</h1>
            <p className="px-5 mx-auto w-3/4 text-center max-[1100]:w-full">Calculate the best glass combination to achieve a certain hex color. With accurate results and different presets you can find the best solutions. </p>
            <Tabs value={tab} onValueChange={v => setTab(v == 'verify' ? v : 'tool')} className="w-full">
                <TabsList>
                    <TabsTrigger value="tool">Beacon Beam</TabsTrigger>
                    <TabsTrigger value="verify">Glass Tester</TabsTrigger>
                </TabsList>

                <TabsContent value="tool" forceMount className="data-[state=inactive]:hidden">
                    <BeaconToGlassTool setTabAction={setTab}/>
                </TabsContent>

                <TabsContent value="verify" forceMount className="data-[state=inactive]:hidden">
                    <GlassToBeaconColor/>
                </TabsContent>
            </Tabs>
        </>
    )
}