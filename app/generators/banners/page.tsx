import {Metadata} from "next";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import React from "react";
import UtilSelector from "@/app/generators/banners/UtilSelector";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Banners</h1>
            <p className="px-5 mx-auto w-full text-center">Generate custom banners and shields for minecraft with interactive editor and command output.</p>

            <div className="flex w-full justify-center my-6">
                <Link href="/generators/banners/editor">
                    <Card>
                        <CardContent className="flex flex-col">
                            <div className="relative h-80 flex">
                                <Image
                                    src={`/assets/tool/banner/utils/editor.png`}
                                    alt={"Banner Editor"}
                                    width={500}
                                    height={358}
                                    className="w-auto h-full"
                                />
                                <div className="flex flex-col justify-center text-center ml-6 max-w-70">
                                    <p className="font-bold">Banner Editor</p>
                                    <p>Generate custom banners and shields for minecraft with interactive editor and command output.</p>
                                </div>
                            </div>
                            <Button className="mt-6 mx-auto cursor-pointer">Click to open editor!</Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <h2 className="text-2xl font-bold mb-2 mx-auto mt-2 text-center">Other Banner Generators</h2>
            <p className="px-5 mx-auto w-full text-center">Other banner generators, like the alphabet and more.</p>
            <div className="flex w-full justify-center mt-4">
                <UtilSelector />
            </div>
        </div>
    )
}

export const metadata: Metadata = {
    title: "Banners",
    description: "Generate custom banners and shields for minecraft with interactive editor and command output.",
};