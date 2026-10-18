import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { accolades } from "@/data/hotel";
import { useHotelBrand } from "@/hooks/useHotelBrand";
import { useDemoTheme } from "@/hooks/useDemoTheme";
import { Sparkles } from "lucide-react";

export default function Footer() {
  const { brand, resetBrand } = useHotelBrand();
  const { resetTheme } = useDemoTheme();
  return (
    <footer className="bg-foreground text-background mt-32">
      <div className="container-prose py-20">
        {/* Accolades strip */}
        <div className="border-y border-background/15 py-8 mb-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[10px] uppercase tracking-[0.32em] text-background/60">
          {accolades.map((a) => <span key={a}>{a}</span>)}
        </div>

        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="font-display text-3xl mb-3 text-primary">{brand.name}</div>
            <p className="text-background/80 max-w-md leading-relaxed text-sm">
{brand.town}'s premier luxury oasis in Ghana. Modern elegance, authentic hospitality, executive suites, and world-class event hosting.
            </p>
            <div className="mt-4 space-y-1 text-xs text-background/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{brand.town}, Ghana</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>+233 (0) 50 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>reservations@yourhotel.com</span>
              </div>
            </div>
            <div className="flex gap-5 mt-6">
              <a href="mailto:reservations@yourhotel.com" aria-label="Email" className="hover:text-primary transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <div className="eyebrow text-primary mb-5">Explore</div>
            <ul className="space-y-3 text-sm text-background/80">
              <li><Link to="/rooms" className="link-underline">Executive Rooms & Suites</Link></li>
              <li><Link to="/booking" className="link-underline">Book a Stay</Link></li>
              <li><Link to="/restaurant" className="link-underline">Sankofa Kitchen</Link></li>
              <li><Link to="/spa" className="link-underline">Wellness & Pool</Link></li>
              <li><Link to="/events" className="link-underline">Conferences & Receptions</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow text-primary mb-5">Find Us</div>
            <p className="text-sm text-background/70 mb-4 leading-relaxed">
              Ideally situated for travelers visiting {brand.town}&apos;s landmarks, cultural sites, and business districts.
            </p>
            <div className="text-xs text-primary uppercase tracking-widest font-mono">
              24/7 Front Desk &amp; Concierge
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/15 flex flex-col md:flex-row justify-between text-xs text-background/50 gap-3">
          <span>© {new Date().getFullYear()} {brand.name}, {brand.town}. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <span>Privacy Policy · Terms of Service</span>
            <button onClick={() => { resetTheme(); resetBrand(); }} className="inline-flex items-center gap-1 hover:text-primary transition-colors" aria-label="Personalize this demo">
              <Sparkles className="w-3 h-3" /> Personalize this demo
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
}
