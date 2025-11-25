import Link from "next/link";
import { FC } from "react";

const NavBar: FC = () => {
  return (
    <nav className="bg-background border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between">
        <Link href="/" className="font-bold text-lg">
          Tools4Minecraft
        </Link>
        <div className="space-x-4">
          <Link href="/tools/give">Give</Link>
          <Link href="/tools/effects">Effects</Link>
          <Link href="/tools/nbt">NBT</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
