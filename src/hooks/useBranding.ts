import { useState, useEffect } from "react";
import brainLogo from "@/assets/brain-logo.png";

export interface BrandingSettings {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
  primaryFont: string;
  secondaryFont: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  brandName: "Knowledge Assistant",
  primaryColor: "#6366f1",
  secondaryColor: "#c026d3",
  logo: brainLogo,
  primaryFont: "Inter",
  secondaryFont: "Georgia",
};

const STORAGE_KEY = "branding_settings";

export function useBranding() {
  const [settings, setSettings] = useState<BrandingSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Use brain logo as default if no logo is set
        return { ...DEFAULT_BRANDING, ...parsed, logo: parsed.logo || brainLogo };
      } catch {
        return DEFAULT_BRANDING;
      }
    }
    return DEFAULT_BRANDING;
  });

  const updateSettings = (newSettings: Partial<BrandingSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_BRANDING);
  };

  return { settings, updateSettings, resetSettings };
}
