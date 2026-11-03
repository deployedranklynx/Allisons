import React, { useState, useEffect } from "react";
import { SiteThemeConfig, SiteCustomization, DEFAULT_SITE_THEME } from "../types";
import { fetchCloudSiteSettings, saveCloudSiteSettings } from "../lib/cloudAds";
import {
  Palette,
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  RotateCcw,
  Layout,
  Check,
  Type,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AdminThemeManagerProps {
  onSiteSettingsUpdated?: (newSettings: SiteCustomization) => void;
}

// 8 Curated High-Conversion Themes
interface PresetTheme {
  id: string;
  name: string;
  description: string;
  primary: string;
  hover: string;
  accent: string;
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  sidebarText: string;
  footerBg: string;
  footerText: string;
  bodyBg: string;
  borderRadius: SiteThemeConfig["borderRadius"];
  fontFamily: SiteThemeConfig["fontFamily"];
}

const PRESET_THEMES: PresetTheme[] = [
  {
    id: "classic-blue",
    name: "Retool Classic Blue",
    description: "Original modern corporate SaaS aesthetic with clean contrast",
    primary: "#0984E3",
    hover: "#0770C2",
    accent: "#00CEC9",
    headerBg: "#FFFFFF",
    headerText: "#0F172A",
    sidebarBg: "#FFFFFF",
    sidebarText: "#334155",
    footerBg: "#0F172A",
    footerText: "#94A3B8",
    bodyBg: "#F8F9FA",
    borderRadius: "rounded-xl",
    fontFamily: "Inter",
  },
  {
    id: "emerald-growth",
    name: "Emerald Authority & Ad Growth",
    description: "Finance, high-yield AdSense and wealth authority palette",
    primary: "#059669",
    hover: "#047857",
    accent: "#10B981",
    headerBg: "#FFFFFF",
    headerText: "#064E3B",
    sidebarBg: "#FFFFFF",
    sidebarText: "#1F2937",
    footerBg: "#064E3B",
    footerText: "#A7F3D0",
    bodyBg: "#F0FDF4",
    borderRadius: "rounded-xl",
    fontFamily: "Plus Jakarta Sans",
  },
  {
    id: "midnight-purple",
    name: "Midnight Cyberpunk Violet",
    description: "Futuristic developer-first tech aesthetic with vibrant purple accents",
    primary: "#7C3AED",
    hover: "#6D28D9",
    accent: "#C084FC",
    headerBg: "#0F172A",
    headerText: "#FFFFFF",
    sidebarBg: "#0F172A",
    sidebarText: "#E2E8F0",
    footerBg: "#090D16",
    footerText: "#94A3B8",
    bodyBg: "#F8FAFC",
    borderRadius: "rounded-xl",
    fontFamily: "Poppins",
  },
  {
    id: "sunset-crimson",
    name: "Sunset Crimson & Rose",
    description: "High-energy marketing, affiliate, and viral publisher styling",
    primary: "#E11D48",
    hover: "#BE123C",
    accent: "#FB7185",
    headerBg: "#FFFFFF",
    headerText: "#1E293B",
    sidebarBg: "#FFFFFF",
    sidebarText: "#334155",
    footerBg: "#1C1917",
    footerText: "#A8A29E",
    bodyBg: "#FFF1F2",
    borderRadius: "rounded-xl",
    fontFamily: "Outfit",
  },
  {
    id: "dark-slate",
    name: "Executive Dark Slate",
    description: "Ultra sleek dark-mode header & footer with cyber blue highlights",
    primary: "#0284C7",
    hover: "#0369A1",
    accent: "#38BDF8",
    headerBg: "#0F172A",
    headerText: "#F8FAFC",
    sidebarBg: "#1E293B",
    sidebarText: "#E2E8F0",
    footerBg: "#0B0F17",
    footerText: "#94A3B8",
    bodyBg: "#F1F5F9",
    borderRadius: "rounded-lg",
    fontFamily: "Inter",
  },
  {
    id: "golden-amber",
    name: "Golden Amber & Champagne",
    description: "Prestigious editorial journal with warm warm-gold tones",
    primary: "#D97706",
    hover: "#B45309",
    accent: "#FBBF24",
    headerBg: "#FFFFFF",
    headerText: "#18181B",
    sidebarBg: "#FFFFFF",
    sidebarText: "#27272A",
    footerBg: "#1C1917",
    footerText: "#D6D3D1",
    bodyBg: "#FFFBEB",
    borderRadius: "rounded-xl",
    fontFamily: "Plus Jakarta Sans",
  },
  {
    id: "nordic-teal",
    name: "Nordic Clean Teal",
    description: "Minimalist Scandinavian design with refreshing clean seafoam hues",
    primary: "#0D9488",
    hover: "#0F766E",
    accent: "#2DD4BF",
    headerBg: "#FFFFFF",
    headerText: "#134E4A",
    sidebarBg: "#FFFFFF",
    sidebarText: "#334155",
    footerBg: "#134E4A",
    footerText: "#99F6E4",
    bodyBg: "#F0FDFA",
    borderRadius: "rounded-xl",
    fontFamily: "Inter",
  },
  {
    id: "royal-indigo",
    name: "Royal Enterprise Indigo",
    description: "High-trust corporate intelligence styling used by leading analytics suites",
    primary: "#4F46E5",
    hover: "#4338CA",
    accent: "#818CF8",
    headerBg: "#FFFFFF",
    headerText: "#1E1B4B",
    sidebarBg: "#FFFFFF",
    sidebarText: "#312E81",
    footerBg: "#1E1B4B",
    footerText: "#C7D2FE",
    bodyBg: "#EEF2FF",
    borderRadius: "rounded-2xl",
    fontFamily: "Plus Jakarta Sans",
  },
];

// Helper to inject CSS variables live into document
export function applyThemeVariablesToDOM(theme: SiteThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", theme.primaryColor);
  root.style.setProperty("--theme-primary-hover", theme.primaryHoverColor);
  root.style.setProperty("--theme-accent", theme.accentColor);
  root.style.setProperty("--theme-header-bg", theme.headerBg);
  root.style.setProperty("--theme-header-text", theme.headerText);
  root.style.setProperty("--theme-sidebar-bg", theme.sidebarBg);
  root.style.setProperty("--theme-sidebar-text", theme.sidebarText);
  root.style.setProperty("--theme-footer-bg", theme.footerBg);
  root.style.setProperty("--theme-footer-text", theme.footerText);
  root.style.setProperty("--theme-body-bg", theme.bodyBg);
  root.style.setProperty("--theme-font-family", theme.fontFamily);
}

export const AdminThemeManager: React.FC<AdminThemeManagerProps> = ({
  onSiteSettingsUpdated,
}) => {
  const [siteSettings, setSiteSettings] = useState<SiteCustomization | null>(null);
  const [theme, setTheme] = useState<SiteThemeConfig>(DEFAULT_SITE_THEME);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [livePreviewActive, setLivePreviewActive] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>("classic-blue");

  // Load site settings
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchCloudSiteSettings();
        if (data) {
          setSiteSettings(data);
          const currentTheme = data.theme || DEFAULT_SITE_THEME;
          setTheme(currentTheme);
          if (livePreviewActive) {
            applyThemeVariablesToDOM(currentTheme);
          }
        }
      } catch (err) {
        console.error("Failed to load theme settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Update theme state and apply live if toggle is on
  const handleThemeChange = (updates: Partial<SiteThemeConfig>) => {
    setTheme((prev) => {
      const next = { ...prev, ...updates };
      if (livePreviewActive) {
        applyThemeVariablesToDOM(next);
      }
      return next;
    });
    setActivePresetId(null); // Custom edited
  };

  // 1-Click apply preset
  const handleApplyPreset = (preset: PresetTheme) => {
    const nextTheme: SiteThemeConfig = {
      primaryColor: preset.primary,
      primaryHoverColor: preset.hover,
      accentColor: preset.accent,
      headerBg: preset.headerBg,
      headerText: preset.headerText,
      sidebarBg: preset.sidebarBg,
      sidebarText: preset.sidebarText,
      footerBg: preset.footerBg,
      footerText: preset.footerText,
      bodyBg: preset.bodyBg,
      borderRadius: preset.borderRadius,
      fontFamily: preset.fontFamily,
    };
    setTheme(nextTheme);
    setActivePresetId(preset.id);
    if (livePreviewActive) {
      applyThemeVariablesToDOM(nextTheme);
    }
  };

  // Toggle live preview on the real DOM
  const handleToggleLivePreview = () => {
    const next = !livePreviewActive;
    setLivePreviewActive(next);
    if (next) {
      applyThemeVariablesToDOM(theme);
    } else if (siteSettings?.theme) {
      applyThemeVariablesToDOM(siteSettings.theme);
    }
  };

  // Save to Firebase Cloud Firestore and server
  const handleSaveTheme = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const currentSettings = siteSettings || (await fetchCloudSiteSettings());
      const updatedSettings: SiteCustomization = {
        ...currentSettings,
        theme,
        updatedAt: new Date().toISOString(),
      };

      const success = await saveCloudSiteSettings(updatedSettings);
      if (success) {
        setSiteSettings(updatedSettings);
        applyThemeVariablesToDOM(theme);
        if (onSiteSettingsUpdated) {
          onSiteSettingsUpdated(updatedSettings);
        }
        setSaveSuccessMsg("Theme & colors saved live! All visitors will now see your custom colors.");
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveErrorMsg("Failed to save theme to Firebase Cloud. Please check your connection.");
      }
    } catch {
      setSaveErrorMsg("Network error saving theme settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Reset all colors and typography to Retool Classic Blue default?")) {
      setTheme(DEFAULT_SITE_THEME);
      setActivePresetId("classic-blue");
      if (livePreviewActive) {
        applyThemeVariablesToDOM(DEFAULT_SITE_THEME);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E9ECEF] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-[#0984E3] animate-spin" />
        <span className="text-sm font-medium text-[#636E72]">Loading theme customization studio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-white" />
            <h2 className="text-lg sm:text-xl font-bold">Custom Theme & Live Colors Studio</h2>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            Apni site ke colors, buttons, header/footer backgrounds aur fonts live customize karein. Preset themes chunein ya khud colors pick karein!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleLivePreview}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              livePreviewActive
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Toggle live reflection on the entire applet"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{livePreviewActive ? "Live Preview: ON" : "Live Preview: OFF"}</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Reset
          </button>

          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving Live..." : "Save & Publish Theme"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{saveErrorMsg}</span>
        </div>
      )}

      {/* SECTION 1: 1-CLICK PRO PRESET THEMES */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1-Click Pro Theme Presets</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Click any verified design palette to instantly apply matched colors across headers, buttons, cards, and footers.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            8 Ready Presets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_THEMES.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div>
                  {/* Color Swatch Bar */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.primary }}
                      title={`Primary: ${preset.primary}`}
                    />
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.accent }}
                      title={`Accent: ${preset.accent}`}
                    />
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.headerBg }}
                      title={`Header: ${preset.headerBg}`}
                    />
                    <span
                      className="w-6 h-6 rounded-md shadow-xs border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.footerBg }}
                      title={`Footer: ${preset.footerBg}`}
                    />
                  </div>

                  <h4 className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                    <span>{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span>Font: {preset.fontFamily}</span>
                  <span className="font-mono text-gray-400">{preset.primary}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LIVE INTERACTIVE PREVIEW CANVAS */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Real-Time Live Preview Canvas</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Tweak any color below and watch this interactive preview update in real-time instantly.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Reactive
          </span>
        </div>

        {/* Live Mock UI Component */}
        <div
          className="rounded-2xl border border-gray-300 overflow-hidden shadow-sm transition-all"
          style={{
            backgroundColor: theme.bodyBg,
            fontFamily: theme.fontFamily,
          }}
        >
          {/* Mock Header */}
          <div
            className="px-5 py-3.5 flex items-center justify-between border-b border-black/10 transition-colors"
            style={{
              backgroundColor: theme.headerBg,
              color: theme.headerText,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs text-white shadow-xs"
                style={{ backgroundColor: theme.primaryColor }}
              >
                R
              </div>
              <span className="text-sm font-bold tracking-tight">
                {siteSettings?.siteName || "RankLynx"}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-1"
                style={{
                  backgroundColor: `${theme.primaryColor}20`,
                  color: theme.primaryColor,
                }}
              >
                PRO SUITE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium opacity-80 hidden sm:inline">Overview</span>
              <span className="text-xs font-bold" style={{ color: theme.primaryColor }}>
                Editorial
              </span>
              <button
                className="px-3 py-1 rounded text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-2xs"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Launch Tool
              </button>
            </div>
          </div>

          {/* Mock Body Content with Sidebar and Card */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Mock Mini Sidebar */}
            <div
              className="md:col-span-4 p-4 rounded-xl border border-black/5 shadow-2xs space-y-2 transition-colors"
              style={{
                backgroundColor: theme.sidebarBg,
                color: theme.sidebarText,
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                SEO Utilities
              </div>
              <div
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                <span>🔗 Hyperlink Suite</span>
                <span className="text-[10px] font-mono">ACTIVE</span>
              </div>
              <div className="px-3 py-1.5 rounded text-xs font-medium opacity-70 hover:opacity-100">
                <span>🌐 Domain Metrics</span>
              </div>
              <div className="px-3 py-1.5 rounded text-xs font-medium opacity-70 hover:opacity-100">
                <span>📖 Classique Articles</span>
              </div>
            </div>

            {/* Mock Main Action Area */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      High-Yield Monetization & On-Page SEO
                    </h4>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      borderColor: theme.accentColor,
                      color: theme.primaryColor,
                      backgroundColor: `${theme.accentColor}15`,
                    }}
                  >
                    Google Index Ready
                  </span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  Fast multi-platform ad placements with real-time on-page SEO targeting keyword difficulty, canonical tags, and schema rich results.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Primary Action
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                    style={{
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                      backgroundColor: "transparent",
                    }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Footer */}
          <div
            className="px-5 py-4 flex items-center justify-between border-t border-black/10 text-xs transition-colors"
            style={{
              backgroundColor: theme.footerBg,
              color: theme.footerText,
            }}
          >
            <span>© 2026 {siteSettings?.siteName || "RankLynx"} • Professional SEO Suite</span>
            <span className="opacity-75 font-mono text-[11px]">Dynamic Theme Engine</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: GRANULAR LIVE COLOR PICKERS */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Full Color Palette Control</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Click on the color swatches or type custom Hex values (e.g. #0984E3) to customize any specific part of the interface.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Primary Brand Color */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Primary Brand Color
            </label>
            <p className="text-[11px] text-[#64748B]">Buttons, active tabs, main accents, and links</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => handleThemeChange({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => handleThemeChange({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 2. Primary Hover Color */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Primary Hover State
            </label>
            <p className="text-[11px] text-[#64748B]">Buttons when hovered or focused by user</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.primaryHoverColor}
                onChange={(e) => handleThemeChange({ primaryHoverColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.primaryHoverColor}
                onChange={(e) => handleThemeChange({ primaryHoverColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 3. Accent Highlight Color */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Accent / Highlight Color
            </label>
            <p className="text-[11px] text-[#64748B]">Badges, progress meters, and special highlights</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleThemeChange({ accentColor: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => handleThemeChange({ accentColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 4. Header Background */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Header Background
            </label>
            <p className="text-[11px] text-[#64748B]">Top navigation bar background color</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.headerBg}
                onChange={(e) => handleThemeChange({ headerBg: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.headerBg}
                onChange={(e) => handleThemeChange({ headerBg: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 5. Header Text Color */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Header Text Color
            </label>
            <p className="text-[11px] text-[#64748B]">Links & titles in top navigation</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.headerText}
                onChange={(e) => handleThemeChange({ headerText: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.headerText}
                onChange={(e) => handleThemeChange({ headerText: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 6. Sidebar Background */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Sidebar Background
            </label>
            <p className="text-[11px] text-[#64748B]">Left tool navigation panel background</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.sidebarBg}
                onChange={(e) => handleThemeChange({ sidebarBg: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.sidebarBg}
                onChange={(e) => handleThemeChange({ sidebarBg: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 7. Footer Background */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Footer Background
            </label>
            <p className="text-[11px] text-[#64748B]">Bottom website footer background color</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.footerBg}
                onChange={(e) => handleThemeChange({ footerBg: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.footerBg}
                onChange={(e) => handleThemeChange({ footerBg: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 8. Footer Text Color */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Footer Text & Links
            </label>
            <p className="text-[11px] text-[#64748B]">Text and disclaimer contrast in footer</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.footerText}
                onChange={(e) => handleThemeChange({ footerText: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.footerText}
                onChange={(e) => handleThemeChange({ footerText: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>

          {/* 9. Body / Canvas Background */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Workspace Body Canvas
            </label>
            <p className="text-[11px] text-[#64748B]">Main background behind tools and articles</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={theme.bodyBg}
                onChange={(e) => handleThemeChange({ bodyBg: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.bodyBg}
                onChange={(e) => handleThemeChange({ bodyBg: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-[#0F172A] uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TYPOGRAPHY & SHAPE CORNERS */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600" />
              <span>Typography & Border Radiuses</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Choose the global typeface and border roundness across buttons, modals, and tool inputs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Font Family */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
              Primary Font Family
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "Inter", label: "Inter (Modern Tech)" },
                  { id: "Poppins", label: "Poppins (Geometric)" },
                  { id: "Plus Jakarta Sans", label: "Jakarta (Premium)" },
                  { id: "Roboto", label: "Roboto (Clean Standard)" },
                  { id: "Outfit", label: "Outfit (Bold Display)" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleThemeChange({ fontFamily: f.id })}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    theme.fontFamily === f.id
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                  style={{ fontFamily: f.id }}
                >
                  <div>{f.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1">Sample 123 Aa</div>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
              Corner Rounding (Border Radius)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "rounded-none", label: "Sharp Modern", corner: "rounded-none" },
                  { id: "rounded-md", label: "Subtle (6px)", corner: "rounded-md" },
                  { id: "rounded-lg", label: "Standard (8px)", corner: "rounded-lg" },
                  { id: "rounded-xl", label: "Smooth (12px)", corner: "rounded-xl" },
                  { id: "rounded-2xl", label: "Curved (16px)", corner: "rounded-2xl" },
                  { id: "rounded-full", label: "Pill Shape", corner: "rounded-full" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleThemeChange({ borderRadius: r.id })}
                  className={`p-3 border text-xs font-medium text-left transition-all cursor-pointer ${r.corner} ${
                    theme.borderRadius === r.id
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div>{r.label}</div>
                  <div
                    className={`w-full h-2.5 mt-2 bg-indigo-600/30 ${r.corner}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar at Bottom */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Theme changes save to Firebase Cloud Firestore and apply permanently for all visitors.</span>
        </div>

        <button
          onClick={handleSaveTheme}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving Live..." : "Save Theme & Apply Live"}</span>
        </button>
      </div>
    </div>
  );
};
