import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatItemCount(count: number, stackSize: number = 64): string {
    if (count <= stackSize) return `${count}`;

    const sbSize = 1728;
    const fullSBs = Math.floor(count / sbSize);
    const remainderAfterSB = count % sbSize;

    const fullStacks = Math.floor(remainderAfterSB / stackSize);
    const remainder = remainderAfterSB % stackSize;

    const parts = [];
    if (fullSBs > 0) parts.push(`${fullSBs}sb`);
    if (fullStacks > 0) parts.push(`${fullStacks}*${stackSize}`);
    if (remainder > 0) parts.push(`${remainder}`);

    return `${count} (${parts.join("+")})`;
}
