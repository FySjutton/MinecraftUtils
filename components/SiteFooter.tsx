import Link from "next/link";
import GithubIcon from "@/app/components/icons/GithubIcon";
import DiscordIcon from "@/app/components/icons/DiscordIcon";
import {Button} from "@/components/ui/button";

export default function SiteFooter() {
    return (
        <footer className="w-full border-t mt-16 py-6 flex justify-between items-center px-4 md:px-8">
            <p className="text-sm opacity-70">
                © {new Date().getFullYear()} Fy17. MIT Licensed.
            </p>
            <div className="flex gap-4">
                <a href="https://discord.gg/tqn38v6w7k" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full">
                        <DiscordIcon className="h-5 w-5" />
                    </Button>
                </a>

                <a href="https://github.com/FySjutton/MinecraftUtils" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" className="rounded-full">
                        <GithubIcon className="h-5 w-5" />
                    </Button>
                </a>
            </div>
        </footer>
    );
}