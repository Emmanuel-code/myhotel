import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type HotelBrand = { name: string; town: string };

export const DEFAULT_BRAND: HotelBrand = { name: "Your Hotel", town: "Accra" };
const STORAGE_KEY = "SK_demo_brand";

function loadBrand(): { brand: HotelBrand; custom: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.name && String(p.name).trim()) {
        return {
          brand: { name: String(p.name).trim(), town: String(p.town || "").trim() || "Accra" },
          custom: true,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { brand: DEFAULT_BRAND, custom: false };
}

type BrandContextValue = {
  brand: HotelBrand;
  hasCustomBrand: boolean;
  setBrand: (name: string, town: string) => void;
  resetBrand: () => void;
};

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  hasCustomBrand: false,
  setBrand: () => {},
  resetBrand: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadBrand);

  useEffect(() => {
    document.title = `${state.brand.name} — Luxury Hotel & Experiences`;
  }, [state.brand.name]);

  const setBrand = (name: string, town: string) => {
    const brand: HotelBrand = {
      name: name.trim() || DEFAULT_BRAND.name,
      town: town.trim() || "Accra",
    };
    setState({ brand, custom: true });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    } catch {
      /* ignore */
    }
  };

  const resetBrand = () => {
    setState({ brand: DEFAULT_BRAND, custom: false });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <BrandContext.Provider
      value={{ brand: state.brand, hasCustomBrand: state.custom, setBrand, resetBrand }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export const useHotelBrand = () => useContext(BrandContext);
