"use client"

import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import React from "react";

export default function ConverterBase({
                                          inputTypeSlot,
                                          outputTypeSlot,
                                          inputValueSlot,
                                          outputValueSlot,
                                      }: {
    inputTypeSlot?: React.ReactNode
    outputTypeSlot?: React.ReactNode
    inputValueSlot?: React.ReactNode
    outputValueSlot?: React.ReactNode
}) {
    return (
        <div className="w-[90%] mx-auto h-[500px] rounded-xl overflow-hidden">
            <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={25}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {inputTypeSlot}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {outputTypeSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle/>

                <ResizablePanel defaultSize={75}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {inputValueSlot}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle/>
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2 flex items-center justify-center">
                                {outputValueSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
