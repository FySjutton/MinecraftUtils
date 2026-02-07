"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
    className?: string;
    label?: string;
}

export function CopyShareLinkInput({ className, label = "Copy Share Link:" }: Props) {
    const [value, setValue] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const update = () => setValue(window.location.href);

        update();

        window.addEventListener("popstate", update);
        window.addEventListener("share-url-updated", update);

        return () => {
            window.removeEventListener("popstate", update);
            window.removeEventListener("share-url-updated", update);
        };
    }, []);

    const copy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return (
        <div className={`relative w-full ${className ?? ""}`}>
            {label != "" && (
                <label className="mb-1 ml-1 block text-sm font-medium">
                    {label}
                </label>
            )}

            <div onClick={copy} className="relative flex items-center gap-2 cursor-pointer rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                {copied && (
                    <div className="absolute left-[50%] translate-x-[-50%] -top-full translate-y-[65%] mb-10 rounded bg-lime-300 px-2 py-1text-xs text-black">Copied!</div>
                )}

                <div className="flex-1 overflow-hidden">
                    <input readOnly value={value} className="w-full bg-transparent outline-none cursor-pointer select-all truncate"/>
                </div>

                {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                ) : (
                    <Copy className="h-4 w-4 opacity-60" />
                )}
            </div>
        </div>
    );
}
