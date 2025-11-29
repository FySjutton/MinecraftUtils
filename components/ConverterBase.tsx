"use client"

import React, {useState, useEffect} from "react"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"

export default function ConverterBase({
                                          leftTypeSlot,
                                          rightTypeSlot,
                                          leftValueSlot,
                                          rightValueSlot,
                                      }:
                                      {
                                          leftTypeSlot?: React.ReactNode
                                          rightTypeSlot?: React.ReactNode
                                          leftValueSlot?: React.ReactNode
                                          rightValueSlot?: React.ReactNode
                                      }
) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    if (isMobile) {
        return (
            <div className="w-[90%] mx-auto flex flex-col gap-4">
                <div className="border bg-muted/30 p-2">{leftTypeSlot}</div>
                <div className="border bg-muted/30 p-2">{leftValueSlot}</div>
                <div className="border bg-muted/30 p-2">{rightTypeSlot}</div>
                <div className="border bg-muted/30 p-2">{rightValueSlot}</div>
            </div>
        )
    }

    return (
        <div className="w-[90%] mx-auto h-[500px] rounded-xl overflow-hidden">
            <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={25}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {leftTypeSlot}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {rightTypeSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle/>

                <ResizablePanel defaultSize={75}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {leftValueSlot}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {rightValueSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
