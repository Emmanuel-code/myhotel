import { useState } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import { THEMES, useDemoTheme, type ThemeId } from "@/hooks/useDemoTheme";
import { useHotelBrand } from "@/hooks/useHotelBrand";

/**
 * Floating color-theme picker for the live demo. Lets a prospect restyle the
 * whole site in one tap — their pick doubles as the design spec if they buy.
 */
export default function ThemePicker() {
  const { theme, setTheme, resetTheme } = useDemoTheme();
  const { resetBrand } = useHotelBrand();
  const [open, setOpen] = useState(false);

  const pick = (id: ThemeId) => {
    setTheme(id);
  };

  const startOver = () => {
    resetTheme();
    resetBrand(); // reopens the welcome modal
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[90] flex flex-col items-start gap-3">
      {open && (
        <div className="w-64 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-4 shadow-lift">
          <p className="eyebrow mb-1">Demo theme</p>
          <p className="text-sm text-muted-foreground mb-3">
            Try your hotel in different colors — your pick becomes the design brief.
          </p>
          <div className="flex flex-col gap-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary ${
                  theme === t.id ? "bg-secondary" : ""
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full border border-border shrink-0"
                  style={{ background: t.swatch }}
                  aria-hidden
                />
                <span className="text-sm font-medium flex-1">{t.name}</span>
                {theme === t.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
          <button
            onClick={startOver}
            className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start over with a new hotel
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change demo color theme"
        title="Try different color themes"
        className="w-12 h-12 rounded-full bg-card/90 backdrop-blur border border-border shadow-lift flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Palette className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}
