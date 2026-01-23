import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  title?: string;
  description?: string;
  text?: string;
  type?: string;
}

export function InsightCard({ title, description, text, type }: InsightCardProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30">
      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        {title && <h4 className="text-sm font-medium text-foreground">{title}</h4>}
        <p className="text-sm text-muted-foreground leading-relaxed">{description || text}</p>
      </div>
    </div>
  );
}
