import React, { useState, useEffect, useRef } from "react";
import { SiteCustomization, DEFAULT_SITE_CUSTOMIZATION } from "../types";
import { fetchCloudSiteSettings, saveCloudSiteSettings } from "../lib/cloudAds";
import {
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  RefreshCw,
  Layout,
  ExternalLink,
  Sliders,
} from "lucide-react";

interface AdminBrandingManagerProps {
  onSiteSettingsUpdated?: (newSettings: SiteCustomization) => void;
}

export const AdminBrandingManager: React.FC<AdminBrandingManagerProps> = ({
  onSiteSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<SiteCustomization>(DEFAULT_SITE_CUSTOMIZATION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Toggle for whether footer uses same logo as header
  const [useHeaderLogoForFooter, setUseHeaderLogoForFooter] = useState<boolean>(true);

  // Hidden file input refs
  const headerFileRef = useRef<HTMLInputElement>(null);
  const footerFileRef = useRef<HTMLInputElement>(null);

  // Load current site settings on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const cloudData = await fetchCloudSiteSettings();
        if (cloudData) {
          setSettings(cloudData);
          setUseHeaderLogoForFooter(!cloudData.footerLogoUrl || cloudData.footerLogoUrl === cloudData.headerLogoUrl);
        }
      } catch (err) {
        console.error("Failed to load site branding settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle local image file upload (convert to Base64 Data URL so it saves instantly in Firestore without external hosting)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "header" | "footer"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveErrorMsg("Please choose a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    // Limit size to 1.5MB to avoid oversized base64 payloads
    if (file.size > 1.5 * 1024 * 1024) {
      setSaveErrorMsg("Image file is too large. Please select an image under 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (target === "header") {
          setSettings((prev) => ({
            ...prev,
            headerLogoUrl: result,
            headerLogoType: "image",
          }));
        } else {
          setSettings((prev) => ({
            ...prev,
            footerLogoUrl: result,
          }));
        }
        setSaveSuccessMsg(`Image uploaded successfully! Click 'Save Branding & Footer' to apply.`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const finalSettings: SiteCustomization = {
        ...settings,
        footerLogoUrl: useHeaderLogoForFooter ? settings.headerLogoUrl : settings.footerLogoUrl,
        updatedAt: new Date().toISOString(),
      };

      const success = await saveCloudSiteSettings(finalSettings);
      if (success) {
        setSaveSuccessMsg("Site branding, header & footer successfully saved and live on site!");
        if (onSiteSettingsUpdated) {
          onSiteSettingsUpdated(finalSettings);
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveErrorMsg("Could not save to Firebase Cloud. Please check your connection.");
      }
    } catch {
      setSaveErrorMsg("Unexpected error while saving branding settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default branding
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset branding to defaults?")) {
      setSettings(DEFAULT_SITE_CUSTOMIZATION);
      setUseHeaderLogoForFooter(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E9ECEF] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-[#0984E3] animate-spin" />
        <span className="text-sm font-medium text-[#636E72]">Loading branding & footer settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-white" />
            <h2 className="text-lg sm:text-xl font-bold">Site Branding & Header / Footer Control</h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Apni marzi se Header Logo, Brand Name, Tagline aur mukammal Footer customize karein. Yahan se tabdeeli krte hi poori site par live ho jayegi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-white text-[#0984E3] hover:bg-blue-50 text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving Live..." : "Save Branding & Footer"}</span>
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

      {/* SECTION 1: HEADER BRANDING & LOGO */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0984E3]" />
              <span>Header Branding & Logo</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Control your brand name, tagline, and logo shown in the top navigation bar and sidebar.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0984E3] border border-blue-100">
            Header Controls
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Site Brand Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              placeholder="e.g. RankLynx or ASA Tool"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-sm font-medium text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
            />
            <p className="text-[11px] text-[#636E72] mt-1">
              Appears on the header, sidebar, homepage hero, and footer.
            </p>
          </div>

          {/* Header Tagline */}
          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={settings.headerTagline}
              onChange={(e) => setSettings({ ...settings, headerTagline: e.target.value })}
              placeholder="e.g. Pro SEO & Link Suite"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-sm font-medium text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
            />
            <p className="text-[11px] text-[#636E72] mt-1">
              Small subtitle shown next to the brand name.
            </p>
          </div>
        </div>

        {/* Logo Type Selector */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-[#2D3436] mb-2 uppercase tracking-wide">
            Logo Format / Display Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, headerLogoType: "image" })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                settings.headerLogoType === "image"
                  ? "border-[#0984E3] bg-blue-50/50 ring-1 ring-[#0984E3]"
                  : "border-[#E9ECEF] hover:bg-gray-50"
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-100 text-[#0984E3]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#2D3436] block">Custom Image Logo</span>
                <span className="text-xs text-[#636E72]">
                  Upload an image file (PNG, JPG, SVG) from your computer or paste an image URL.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, headerLogoType: "icon" })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                settings.headerLogoType === "icon"
                  ? "border-[#0984E3] bg-blue-50/50 ring-1 ring-[#0984E3]"
                  : "border-[#E9ECEF] hover:bg-gray-50"
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-100 text-[#0984E3]">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#2D3436] block">Clean Minimalist Badge</span>
                <span className="text-xs text-[#636E72]">
                  A solid rounded badge with custom letter or icon (e.g. &apos;R&apos; or &apos;A&apos;).
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* If Custom Image Logo Selected */}
        {settings.headerLogoType === "image" && (
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
                  Header Logo Image
                </h4>
                <p className="text-xs text-[#636E72]">
                  Select an image from your computer or paste a direct image URL.
                </p>
              </div>

              {/* Upload from file button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={headerFileRef}
                  onChange={(e) => handleFileUpload(e, "header")}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => headerFileRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo File</span>
                </button>
                {settings.headerLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, headerLogoUrl: "" })}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Or Paste Image URL (https://...)
              </label>
              <input
                type="url"
                value={settings.headerLogoUrl}
                onChange={(e) => setSettings({ ...settings, headerLogoUrl: e.target.value })}
                placeholder="https://example.com/logo.png or data:image/..."
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            {/* Active Preview */}
            {settings.headerLogoUrl ? (
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-semibold text-[#64748B]">Preview:</span>
                <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] inline-flex items-center justify-center">
                  <img
                    src={settings.headerLogoUrl}
                    alt="Logo Preview"
                    className="h-10 max-w-[200px] object-contain rounded"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.3";
                    }}
                  />
                </div>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Logo loaded
                </span>
              </div>
            ) : (
              <p className="text-xs text-amber-600 italic">
                No image selected yet. Click &apos;Upload Logo File&apos; above to pick any picture from your device!
              </p>
            )}
          </div>
        )}

        {/* If Minimalist Badge Selected */}
        {settings.headerLogoType === "icon" && (
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase tracking-wide">
                Badge Letter or Monogram (1 - 3 characters)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={3}
                  value={settings.headerLogoIconLetter}
                  onChange={(e) =>
                    setSettings({ ...settings, headerLogoIconLetter: e.target.value.toUpperCase() })
                  }
                  placeholder="R"
                  className="w-20 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-center font-bold text-base text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B]">Preview:</span>
                  <div className="w-10 h-10 rounded-lg bg-[#0984E3] flex items-center justify-center text-white font-black text-lg shadow-sm">
                    {settings.headerLogoIconLetter || "R"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Header Simulation Bar */}
        <div className="pt-3 border-t border-[#F1F5F9]">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            Live Header Preview
          </span>
          <div className="h-14 bg-white border border-[#E2E8F0] rounded-xl px-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              {settings.headerLogoType === "image" && settings.headerLogoUrl ? (
                <img
                  src={settings.headerLogoUrl}
                  alt={settings.siteName}
                  className="h-8 max-w-[130px] object-contain rounded"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-[#0984E3] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  {settings.headerLogoIconLetter || "R"}
                </div>
              )}
              <div>
                <span className="font-bold text-sm text-[#0F172A]">{settings.siteName || "RankLynx"}</span>
                <span className="text-xs text-[#64748B] ml-2 font-medium">| {settings.headerTagline || "Pro SEO"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                Home
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-blue-50 text-[#0984E3] font-semibold">
                Blog
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FOOTER CUSTOMIZATION */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#0984E3]" />
              <span>Footer Content & Branding Control</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Customize the footer text, copyright, bio paragraph, and social outreach links.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            Footer Controls
          </span>
        </div>

        {/* Footer Logo Option */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">
                Footer Logo Configuration
              </span>
              <span className="text-xs text-[#64748B]">
                Use the same logo as header or configure a distinct footer image.
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useHeaderLogoForFooter}
                onChange={(e) => setUseHeaderLogoForFooter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0984E3]"></div>
              <span className="ml-2 text-xs font-medium text-[#475569]">
                {useHeaderLogoForFooter ? "Synced with Header Logo" : "Custom Footer Logo"}
              </span>
            </label>
          </div>

          {!useHeaderLogoForFooter && (
            <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={footerFileRef}
                  onChange={(e) => handleFileUpload(e, "footer")}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => footerFileRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Footer Logo</span>
                </button>
                <input
                  type="url"
                  value={settings.footerLogoUrl}
                  onChange={(e) => setSettings({ ...settings, footerLogoUrl: e.target.value })}
                  placeholder="Or paste image URL"
                  className="flex-1 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono"
                />
              </div>
              {settings.footerLogoUrl && (
                <div className="p-2 rounded bg-white border border-[#E2E8F0] inline-block">
                  <img src={settings.footerLogoUrl} alt="Footer Logo" className="h-7 object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Description / Bio */}
        <div>
          <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
            Footer Bio / Description Paragraph
          </label>
          <textarea
            rows={3}
            value={settings.footerDescription}
            onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
            placeholder="All-in-one professional link generator, bulk URL opener, protocol cleaner..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-normal text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
          />
          <p className="text-[11px] text-[#636E72] mt-1">
            Displayed under your brand name in the footer across all site pages.
          </p>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Footer Copyright Text
            </label>
            <input
              type="text"
              value={settings.footerCopyright}
              onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
              placeholder={`© ${new Date().getFullYear()} RankLynx. Free Professional SEO Toolkit.`}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Footer Disclaimer / Notice
            </label>
            <input
              type="text"
              value={settings.footerDisclaimer}
              onChange={(e) => setSettings({ ...settings, footerDisclaimer: e.target.value })}
              placeholder="Designed for SEO specialists, outreach teams & digital webmasters."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
            />
          </div>
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-xs font-bold text-[#2D3436] mb-3 uppercase tracking-wide">
            Social Outreach & Contact Links
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-medium text-[#475569]">
                <Twitter className="w-3.5 h-3.5 text-sky-500" />
                <span>Twitter / X Profile URL</span>
              </div>
              <input
                type="url"
                value={settings.socialLinks?.twitter || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, twitter: e.target.value },
                  })
                }
                placeholder="https://twitter.com/yourhandle"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-medium text-[#475569]">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn Profile URL</span>
              </div>
              <input
                type="url"
                value={settings.socialLinks?.linkedin || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, linkedin: e.target.value },
                  })
                }
                placeholder="https://linkedin.com/company/yourbrand"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-medium text-[#475569]">
                <Github className="w-3.5 h-3.5 text-slate-800" />
                <span>GitHub Repository URL</span>
              </div>
              <input
                type="url"
                value={settings.socialLinks?.github || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, github: e.target.value },
                  })
                }
                placeholder="https://github.com/yourrepo"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-medium text-[#475569]">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Support / Contact Email</span>
              </div>
              <input
                type="email"
                value={settings.socialLinks?.email || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, email: e.target.value },
                  })
                }
                placeholder="contact@yourbrand.com"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Footer Preview Box */}
        <div className="pt-4 border-t border-[#F1F5F9]">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            Live Footer Preview
          </span>
          <div className="p-6 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                {useHeaderLogoForFooter ? (
                  settings.headerLogoType === "image" && settings.headerLogoUrl ? (
                    <img src={settings.headerLogoUrl} alt="Logo" className="h-7 object-contain rounded" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-[#0984E3] flex items-center justify-center text-white font-bold text-xs">
                      {settings.headerLogoIconLetter || "R"}
                    </div>
                  )
                ) : settings.footerLogoUrl ? (
                  <img src={settings.footerLogoUrl} alt="Footer Logo" className="h-7 object-contain rounded" />
                ) : (
                  <div className="w-7 h-7 rounded bg-[#0984E3] flex items-center justify-center text-white font-bold text-xs">
                    {settings.headerLogoIconLetter || "R"}
                  </div>
                )}
                <div>
                  <span className="font-bold text-sm text-[#0F172A]">{settings.siteName || "RankLynx"}</span>
                  <span className="text-xs text-[#64748B] ml-2">| {settings.headerTagline || "Pro SEO"}</span>
                </div>
              </div>

              {/* Social icons preview */}
              <div className="flex items-center gap-2 text-[#64748B]">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                  <Twitter className="w-3 h-3" />
                </div>
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                  <Linkedin className="w-3 h-3" />
                </div>
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                  <Mail className="w-3 h-3" />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed max-w-xl">
              {settings.footerDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#94A3B8] pt-2 border-t border-[#F8FAFC]">
              <span>{settings.footerCopyright}</span>
              <span>{settings.footerDisclaimer}</span>
            </div>
          </div>
        </div>

        {/* Big Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-[#0984E3] hover:bg-[#0873C4] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving Live Changes..." : "Save Branding & Footer Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
