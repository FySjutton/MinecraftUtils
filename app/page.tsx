import ToolCard from "@/app/components/ToolCard";
import NavBar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";

export default function HomePage() {
    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            <NavBar />

            <main className="flex-1 max-w-7xl mx-auto p-8 space-y-12">
                <section className="text-center">
                    <h1 className="text-5xl font-bold">Tools for Minecraft</h1>
                    <p className="mt-4 text-muted-foreground">
                        Generate Minecraft items, effects, and NBT data easily!
                    </p>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <ToolCard
                        title="Give Generator"
                        description="Generate /give commands easily"
                        href="/tools/give"
                    />
                    <ToolCard
                        title="Effects Generator"
                        description="Generate potion effects commands"
                        href="/tools/effects"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />
                    <ToolCard
                        title="NBT Generator"
                        description="Generate custom NBT data"
                        href="/tools/nbt"
                    />

                </section>
            </main>

            <Footer />
        </div>
    );
}
