import {Metadata} from "next";
import CoordinateConverterTool from "@/app/calculators/coordinate-calculator/CoordinateCalculatorTool";
import {ClientWrapper} from "@/components/ClientLoadingWrapper";

export default function Page() {
    return (
        <>
            <h1 className="text-3xl font-bold mb-2 mx-auto mt-2 text-center">Coordinate Calculator</h1>
            <p className="px-5 mx-auto w-full text-center">Convert coordinates between the overworld, chunks, regions as well as nether coordinates.</p>
            <ClientWrapper component={CoordinateConverterTool} />;
        </>
    )
}

export const metadata: Metadata = {
    title: "Coordinate Calculator",
    description: "Convert coordinates between the overworld, chunks, regions as well as nether coordinates."
};