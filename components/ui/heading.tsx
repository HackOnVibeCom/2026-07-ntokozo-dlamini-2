import { cn } from "@/lib/utils";
import React from "react";

export function Heading({
  level = 1,
  className,
  ...props
}: React.ComponentProps<"h1" | "h2" | "h3" | "h4"> & {
  level?: 1 | 2 | 3 | 4;
}) {
  const Tag = `h${level}` as React.ElementType;
  return (
    <Tag
      className={cn(
        "font-bold tracking-tight",
        level === 1 && "text-3xl",
        level === 2 && "text-2xl",
        level === 3 && "text-lg",
        level === 4 && "text-base",
        className
      )}
      {...props}
    />
  );
}