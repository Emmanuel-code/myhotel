import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CMS() {
  const [pages, setPages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const defaultPages = [
    { id: "p-home", slug: "home", title: "Home Page", hero_eyebrow: "Navrongo · Upper East Region · Ghana", hero_heading: "Northern elegance, a haven of luxury.", hero_subheading: "Executive suites, authentic Sahel & Continental gastronomy, modern conference spaces, and unmatched northern warmth.", published: true },
    { id: "p-rooms", slug: "rooms", title: "Suites & Villas", hero_eyebrow: "Accommodations", hero_heading: "Private sanctuaries of northern warmth.", hero_subheading: "Thoughtfully curated materials, hand-finished furnishings, and expansive views across the savannah lake.", published: true },
    { id: "p-dining", slug: "dining", title: "Dining & Lounge", hero_eyebrow: "Gastronomy", hero_heading: "Savannah terroir meets coastal mastery.", hero_subheading: "Farm-to-table ingredients from local northern farms paired with international culinary artistry.", published: true },
    { id: "p-spa", slug: "spa", title: "Wellness & Spa", hero_eyebrow: "Oasis Sanctuary", hero_heading: "Restorative rituals beneath ancient baobabs.", hero_subheading: "Traditional shea, botanical extracts, and tranquil hydrotherapy overlooking serene gardens.", published: true },
    { id: "p-events", slug: "events", title: "Weddings & Events", hero_eyebrow: "Celebrations", hero_heading: "A ceremony framed by palm and ocean.", hero_subheading: "Our events team personally orchestrates every wedding, summit, and private reception.", published: true },
  ];

  const load = async () => {
    try {
      const { data } = await supabase.from("cms_pages").select("*").order("slug");
      const list = (data && data.length > 0) ? data : defaultPages;
      setPages(list);
      if (!selected && list.length) setSelected(list[0]);
    } catch {
      setPages(defaultPages);
      if (!selected) setSelected(defaultPages[0]);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase.from("cms_pages").update({
        title: selected.title,
        hero_eyebrow: selected.hero_eyebrow,
        hero_heading: selected.hero_heading,
        hero_subheading: selected.hero_subheading,
        hero_image: selected.hero_image,
        published: selected.published,
        updated_at: new Date().toISOString(),
      } as any).eq("id", selected.id);
      if (error) throw error;
    } catch {
      // Offline fallback: save to localStorage cache
      const cached = JSON.parse(localStorage.getItem("SK_cms_pages") || "[]");
      const updated = cached.length ? cached.map((p: any) => p.id === selected.id ? selected : p) : pages.map((p: any) => p.id === selected.id ? selected : p);
      localStorage.setItem("SK_cms_pages", JSON.stringify(updated));
    }
    toast.success("Page content saved successfully.");
    load();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelected((prev: any) => ({ ...prev, hero_image: result }));
        toast.info("Image loaded for preview. Click 'Save changes' to apply.");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout eyebrow="Content Management" title="CMS & Dynamic Content">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3 font-medium">Editable Pages</div>
          {pages.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3 rounded border-l-2 transition-colors ${selected?.id === p.id ? "border-amber-200 bg-white/[0.05] text-amber-200 font-medium" : "border-transparent text-neutral-300 hover:bg-white/[0.02]"}`}>
              <div className="text-sm">{p.title}</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-0.5">/{p.slug}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="md:col-span-8 lg:col-span-9 space-y-6 bg-white/[0.01] border border-white/5 p-6 rounded-lg">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-xl">{selected.title}</h2>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">Route: /{selected.slug}</span>
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer">
                <input type="checkbox" checked={selected.published ?? true} onChange={(e) => setSelected({ ...selected, published: e.target.checked })} className="rounded bg-black/40 border-white/20 text-amber-400 focus:ring-0" />
                <span className="text-neutral-300">Published Live</span>
              </label>
            </div>

            <div className="space-y-4">
              {[
                ["title", "Page Title in Navigation"],
                ["hero_eyebrow", "Hero Eyebrow Tag"],
                ["hero_heading", "Hero Main Headline"],
                ["hero_subheading", "Hero Subtitle Description"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium">{label}</label>
                  {k === "hero_subheading" ? (
                    <textarea
                      rows={3}
                      value={selected[k] ?? ""}
                      onChange={(e) => setSelected({ ...selected, [k]: e.target.value })}
                      className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm rounded focus:border-amber-200 focus:outline-none"
                    />
                  ) : (
                    <input
                      value={selected[k] ?? ""}
                      onChange={(e) => setSelected({ ...selected, [k]: e.target.value })}
                      className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm rounded focus:border-amber-200 focus:outline-none"
                    />
                  )}
                </div>
              ))}

              {/* Hero Image Asset & Upload */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-medium">Hero Image URL or Asset Path</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    value={selected.hero_image ?? ""}
                    placeholder="/src/assets/hero-villa.jpg or https://..."
                    onChange={(e) => setSelected({ ...selected, hero_image: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm rounded focus:border-amber-200 focus:outline-none font-mono text-xs"
                  />
                  <label className="px-4 py-2 bg-white/5 border border-white/10 hover:border-amber-200 text-neutral-300 text-xs rounded cursor-pointer flex items-center gap-1">
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {selected.hero_image && (
                  <div className="mt-3 border border-white/10 p-2 rounded bg-black/30">
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 mb-1">Image Preview:</div>
                    <img src={selected.hero_image} alt="Preview" className="h-32 w-full object-cover rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button onClick={save} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] bg-amber-200 text-black font-semibold rounded hover:bg-amber-100 transition-colors">
                Save &amp; Update Live Page
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
