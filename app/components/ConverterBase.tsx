"use client"

import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"

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

                {/* TOP ROW */}
                <ResizablePanel defaultSize={25}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2">
                                {inputTypeSlot}
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2">
                                {outputTypeSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle />

                {/* BOTTOM ROW */}
                <ResizablePanel defaultSize={75}>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2">
                                {inputValueSlot}
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        <ResizablePanel defaultSize={50}>
                            <div className="h-full border bg-muted/30 p-2">
                                {outputValueSlot}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>

            </ResizablePanelGroup>
        </div>
    )
}
