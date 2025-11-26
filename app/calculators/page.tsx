import DashboardLayout from "@/app/components/DashboardLayout"
import ToolCard from "@/app/components/ToolCard"

export default function Calculators() {
    return (
        <DashboardLayout activeCategory="Calculators">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <ToolCard title="Give Generator" description="Generate /give commands easily" href="/tools/give" />
                <ToolCard title="Effects Generator" description="Generate potion effects commands" href="/tools/effects" />
                <ToolCard title="NBT Generator" description="Generate custom NBT data" href="/tools/nbt" />
                <ToolCard title="NBT Generator" description="Generate custom NBT data" href="/tools/nbt" />
                <ToolCard title="NBT Generator" description="Generate custom NBT data" href="/tools/nbt" />
                <ToolCard title="NBT Generator" description="Generate custom NBT data" href="/tools/nbt" />
            </div>
        </DashboardLayout>
    )
}
