import { cn } from "@/lib/utils";
import React from "react";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Section({ title, subtitle, children, className, style }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)} style={style}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
