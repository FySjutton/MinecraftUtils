"use client"

import {useState} from "react";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import ImageSlider from "@/app/calculators/experience/ImageSlider";
import {InputField} from "@/components/InputField";
import {CopyShareLinkInput} from "@/app/CopyShareLinkInput";
import {useQueryState} from "nuqs";
import {numberParser, useUrlUpdateEmitter} from "@/lib/share/urlParsers";

export default function ExperienceTool() {
    useUrlUpdateEmitter()
    // Set initial xp to 9 for a nice look, equals 1 level and about 22% progress.
    const [xp, setXp] = useQueryState("xp", numberParser.withDefault(9));
    const [level, setLevel] = useQueryState("level", numberParser.withDefault(1));
    const [progress, setProgress] = useState(22)

    const [lastSource, setLastSource] = useState<"slider" | "input" | null>(null)

    return (
        <div className="w-[100%] lg:w-[80%] md:w-[90%] mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Experience Levels to Experience Points</CardTitle>
                    <CardDescription>
                        Drag the interactive experience bar to change the progress, and click the level number to edit
                        it.
                    </CardDescription>
                    <CardAction>
                        <Button variant="outline" onClick={() => {
                            setLastSource("input")
                            setXp(9)
                            setLevel(1)
                            setProgress(22)
                        }}>Reset</Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <ImageSlider
                        xp={xp}
                        lastSource={lastSource}
                        onSliderAction={(total, barLevel, barProgress) => {
                            setLastSource("slider")
                            setXp(Math.floor(total))
                            setLevel(barLevel)
                            setProgress(Math.floor(barProgress))
                        }}
                    />

                    <CardDescription className="text-center pt-10 pb-5">Experience bar: {level} levels, {progress}% progress, total experience:</CardDescription>

                    <div className="relative w-[100%] lg:w-[30%] md:w-[60%] mx-auto">
                        <InputField
                            variant="number"
                            className=" pr-12"
                            type="text"
                            value={xp === null ? "" : Math.floor(xp)}
                            maxLength={11}
                            onChange={(e) => {
                                setLastSource("input")
                                setXp(e === "" ? 0 : Number(e))
                            }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            XP
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="my-6">
                <CardContent>
                    <CopyShareLinkInput className="mx-auto mt-2 md:mt-auto"></CopyShareLinkInput>
                </CardContent>
            </Card>
        </div>
    )
}