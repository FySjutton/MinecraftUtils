import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { FC } from "react";

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
}

const ToolCard: FC<ToolCardProps> = ({ title, description, href }) => {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ToolCard;
