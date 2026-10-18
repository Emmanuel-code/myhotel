import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
  invert,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
  invert?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl mb-14", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <div className={cn("eyebrow mb-4", invert && "text-primary-glow")}>{eyebrow}</div>
      )}
      <h2 className={cn("font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05]", invert ? "text-background" : "text-foreground")}>
        {title}
      </h2>
      {copy && (
        <p className={cn("mt-6 text-base md:text-lg leading-relaxed", invert ? "text-background/70" : "text-muted-foreground")}>
          {copy}
        </p>
      )}
      <div className={cn("hairline mt-8", align === "center" && "mx-auto")} />
    </div>
  );
}
