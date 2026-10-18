import { useState, type FormEvent } from "react";
import { Sparkles, MapPin } from "lucide-react";
import { useHotelBrand } from "@/hooks/useHotelBrand";

/**
 * First-visit onboarding: playfully "forces" the prospect to enter their
 * hotel name, then the whole demo personalizes around it.
 */
export default function WelcomeModal() {
  const { hasCustomBrand, setBrand } = useHotelBrand();
  const [name, setName] = useState("");
  const [town, setTown] = useState("");

  if (hasCustomBrand) return null;

  const ready = name.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (ready) setBrand(name, town);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0d10]/97 backdrop-blur-sm p-6 overflow-y-auto">
      <form onSubmit={submit} className="max-w-xl w-full text-center py-10">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-amber-200/80 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          A live website demo
        </div>
        <h1 className="font-display text-4xl md:text-6xl text-neutral-100 leading-[1.05] mb-5">
          Welcome to your new website.
        </h1>
        <p className="text-neutral-400 text-base md:text-lg leading-relaxed mb-10 max-w-md mx-auto">
          Tell us your hotel&apos;s name — and watch this entire demo become{" "}
          <em className="text-amber-200 not-italic font-medium">yours</em>.
        </p>

        <div className="space-y-4 max-w-md mx-auto text-left">
          <div>
            <label
              htmlFor="demo-hotel-name"
              className="text-[10px] uppercase tracking-[0.32em] text-neutral-500"
            >
              Your hotel&apos;s name
            </label>
            <input
              id="demo-hotel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Aknac Hotel"
              autoFocus
              autoComplete="off"
              className="mt-2 w-full bg-transparent border-b border-white/20 focus:border-amber-200 py-4 font-display text-2xl md:text-3xl text-neutral-100 placeholder:text-neutral-600 focus-visible:outline-none transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="demo-hotel-town"
              className="text-[10px] uppercase tracking-[0.32em] text-neutral-500"
            >
              Town or city <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                id="demo-hotel-town"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="Accra"
                autoComplete="off"
                className="mt-2 w-full bg-transparent border-b border-white/20 focus:border-amber-200 py-3 pl-7 text-lg text-neutral-100 placeholder:text-neutral-600 focus-visible:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className="mt-10 px-12 py-4 text-xs uppercase tracking-[0.3em] font-medium bg-amber-200 text-black hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ✨ Make it mine
        </button>

        <p className="mt-8 text-xs text-neutral-600">
          Your details stay in this browser — nothing is sent anywhere.
        </p>
      </form>
    </div>
  );
}
