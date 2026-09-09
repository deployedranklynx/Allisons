import React, { useState, useEffect } from "react";
import { SiteCustomization, DEFAULT_SITE_CUSTOMIZATION } from "../types";
import { fetchCloudSiteSettings, saveCloudSiteSettings } from "../lib/cloudAds";
import {
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
  Save,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Terminal,
  Globe,
  Radio,
  BookOpen,
} from "lucide-react";

interface AdminAdSenseManagerProps {
  onSiteSettingsUpdated?: (newSettings: SiteCustomization) => void;
}

export const AdminAdSenseManager: React.FC<AdminAdSenseManagerProps> = ({
  onSiteSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<SiteCustomization>(DEFAULT_SITE_CUSTOMIZATION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Live ads.txt test state
  const [isTestingAdsTxt, setIsTestingAdsTxt] = useState<boolean>(false);
  const [adsTxtTestResult, setAdsTxtTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const [copiedAdsTxt, setCopiedAdsTxt] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const cloudData = await fetchCloudSiteSettings();
        if (cloudData) {
          setSettings(cloudData);
        }
      } catch (err) {
        console.error("Failed to load AdSense settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Save AdSense and ads.txt settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const updated: SiteCustomization = {
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      const success = await saveCloudSiteSettings(updated);
      if (success) {
        setSaveSuccessMsg("AdSense, ads.txt & verification codes saved and live on site!");
        if (onSiteSettingsUpdated) {
          onSiteSettingsUpdated(updated);
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveErrorMsg("Failed to save to cloud database. Please retry.");
      }
    } catch {
      setSaveErrorMsg("Unexpected error while saving AdSense settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Test live /ads.txt endpoint
  const testLiveAdsTxt = async () => {
    setIsTestingAdsTxt(true);
    setAdsTxtTestResult({ status: "idle", message: "Fetching /ads.txt..." });

    try {
      const res = await fetch("/ads.txt");
      if (res.ok) {
        const text = await res.text();
        setAdsTxtTestResult({
          status: "success",
          message: `HTTP 200 OK! Live file served with ${text.split("\n").length} lines. Crawler accessible!`,
        });
      } else {
        setAdsTxtTestResult({
          status: "error",
          message: `Server returned status ${res.status}.`,
        });
      }
    } catch (err) {
      setAdsTxtTestResult({
        status: "error",
        message: "Could not connect to /ads.txt endpoint.",
      });
    } finally {
      setIsTestingAdsTxt(false);
    }
  };

  // Copy ads.txt to clipboard
  const copyAdsTxtToClipboard = () => {
    navigator.clipboard.writeText(settings.adsTxtContent);
    setCopiedAdsTxt(true);
    setTimeout(() => setCopiedAdsTxt(false), 2500);
  };

  // Preset inserters for ads.txt
  const addPreset = (line: string) => {
    const existing = settings.adsTxtContent.trim();
    const next = existing ? `${existing}\n${line}` : line;
    setSettings({ ...settings, adsTxtContent: next });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E9ECEF] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-[#0984E3] animate-spin" />
        <span className="text-sm font-medium text-[#636E72]">Loading AdSense & Verification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with Guide */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCode className="w-5 h-5 text-white" />
            <h2 className="text-lg sm:text-xl font-bold">Google AdSense, ads.txt & Site Verification Hub</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
            Google AdSense, Ezoic, Mediavine ya kisi bhi ad network ki verification, ads.txt file aur custom header codes ko yahan se live control karein.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving Live..." : "Save AdSense & ads.txt"}</span>
        </button>
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
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{saveErrorMsg}</span>
        </div>
      )}

      {/* STEP-BY-STEP AD NETWORK GUIDE */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
          <BookOpen className="w-4 h-4 text-[#0984E3]" />
          <span>Google AdSense & Ad Network Verification Guide (Kese Apply Karein?)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0984E3] font-bold inline-flex items-center justify-center text-xs mb-1">
              1
            </span>
            <h4 className="font-bold text-[#0F172A]">1. Publisher ID & Auto-Ads</h4>
            <p className="text-[#64748B] leading-relaxed">
              Google AdSense account create krne ke baad aapko <span className="font-mono text-[#0984E3]">ca-pub-XXXXXXXXXXXXXXXX</span> milta hai. Usko neechay Publisher ID box me daal kar Auto-Ads toggle on karein.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold inline-flex items-center justify-center text-xs mb-1">
              2
            </span>
            <h4 className="font-bold text-[#0F172A]">2. ads.txt File Verification</h4>
            <p className="text-[#64748B] leading-relaxed">
              AdSense requirement hoti hai ke aapki site par <span className="font-mono text-emerald-600">/ads.txt</span> live ho. Neechay ads.txt editor me apni publisher line likhein aur &apos;Test Live /ads.txt&apos; se check karein.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold inline-flex items-center justify-center text-xs mb-1">
              3
            </span>
            <h4 className="font-bold text-[#0F172A]">3. Meta Tag / Custom Head Script</h4>
            <p className="text-[#64748B] leading-relaxed">
              Google AdSense ya Search Console ka verification meta tag ya code neechay &apos;Custom Head Code&apos; box me paste karein. Browser reload kiye baghair live inject ho jayega.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE ADS.TXT EDITOR */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-[#2D3436]">
                Authorized Digital Sellers (ads.txt) Live Editor
              </h3>
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">
              Served dynamically at <span className="font-mono text-emerald-600 font-bold">/ads.txt</span> with Content-Type: text/plain for search bots and ad network crawlers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyAdsTxtToClipboard}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-gray-500" />
              <span>{copiedAdsTxt ? "Copied!" : "Copy ads.txt"}</span>
            </button>

            <button
              type="button"
              onClick={testLiveAdsTxt}
              disabled={isTestingAdsTxt}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Radio className={`w-3.5 h-3.5 ${isTestingAdsTxt ? "animate-spin" : "text-emerald-600"}`} />
              <span>Test Live /ads.txt</span>
            </button>

            <a
              href="/ads.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open /ads.txt in New Tab</span>
            </a>
          </div>
        </div>

        {/* Live Test Status Feedback */}
        {adsTxtTestResult.status !== "idle" && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
              adsTxtTestResult.status === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {adsTxtTestResult.status === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{adsTxtTestResult.message}</span>
          </div>
        )}

        {/* Preset Quick-Add Buttons */}
        <div>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            Quick-Insert Ad Network Presets:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                addPreset(
                  `google.com, ${settings.adsensePublisherId ? settings.adsensePublisherId.replace("ca-", "") : "pub-0000000000000000"}, DIRECT, f08c47fec0942fa0`
                )
              }
              className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0984E3] border border-blue-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>+ Google AdSense Line</span>
            </button>
            <button
              type="button"
              onClick={() => addPreset("ezoic.com, 10001, DIRECT")}
              className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>+ Ezoic Line</span>
            </button>
            <button
              type="button"
              onClick={() => addPreset("mediavine.com, 10002, DIRECT")}
              className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>+ Mediavine Line</span>
            </button>
            <button
              type="button"
              onClick={() => addPreset("propellerads.com, 10003, DIRECT")}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>+ PropellerAds Line</span>
            </button>
          </div>
        </div>

        {/* Textarea for ads.txt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#2D3436] uppercase tracking-wide">
              ads.txt Content (Plain Text)
            </label>
            <span className="text-[11px] font-mono text-[#64748B]">
              Lines: {settings.adsTxtContent ? settings.adsTxtContent.split("\n").length : 0}
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={settings.adsTxtContent}
              onChange={(e) => setSettings({ ...settings, adsTxtContent: e.target.value })}
              placeholder="# Example Google AdSense ads.txt line&#10;google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
              className="w-full p-4 bg-[#0F172A] text-emerald-400 font-mono text-xs rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>
          <p className="text-[11px] text-[#636E72] mt-1.5">
            Tip: Comments starting with <span className="font-mono text-[#0984E3]">#</span> are ignored by ad crawlers. Ensure each record is on a new line with format: <span className="font-mono">domain, publisher-id, relationship, cert-authority-id</span>.
          </p>
        </div>
      </div>

      {/* SECTION 2: GOOGLE ADSENSE AUTO-ADS & PUBLISHER ID */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0984E3]" />
              <span>Google AdSense Account Integration</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Automatically injects the official Google AdSense script tag and account meta tag into the HTML document.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0984E3] border border-blue-100">
            AdSense Core
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Publisher ID Input */}
          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Google AdSense Publisher ID
            </label>
            <input
              type="text"
              value={settings.adsensePublisherId}
              onChange={(e) => setSettings({ ...settings, adsensePublisherId: e.target.value.trim() })}
              placeholder="e.g. ca-pub-1234567890123456"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-sm font-mono font-medium text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
            />
            <p className="text-[11px] text-[#636E72] mt-1">
              Find this in your AdSense console under Account &gt; Settings &gt; Account Information.
            </p>
          </div>

          {/* Auto-Ads Script Injection Toggle */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0F172A] block">
                  Enable Google AdSense Script Tag
                </span>
                <span className="text-xs text-[#64748B]">
                  Injects <span className="font-mono text-xs">pagead2.googlesyndication.com</span>
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adsenseAutoAdsEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, adsenseAutoAdsEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0984E3]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">
              Status: {settings.adsensePublisherId ? (
                <span className="text-emerald-600 font-semibold">Ready to inject tag</span>
              ) : (
                <span className="text-amber-600 font-semibold">Enter Publisher ID above</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: SEARCH CONSOLE & VERIFICATION TAGS */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#2D3436] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0984E3]" />
              <span>Search Console & Site Verification Meta Tags</span>
            </h3>
            <p className="text-xs text-[#636E72] mt-0.5">
              Verify your site on Google Search Console, Bing Webmaster, or any ad network.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Google Site Verification Code / Meta Tag
            </label>
            <input
              type="text"
              value={settings.googleSiteVerification}
              onChange={(e) => setSettings({ ...settings, googleSiteVerification: e.target.value })}
              placeholder="e.g. google-site-verification=XXXXXXXXXXXXXXXXX or paste full <meta>"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-mono text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
            />
            <p className="text-[11px] text-[#636E72] mt-1">
              You can paste the token or the full <span className="font-mono text-xs">&lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot;&gt;</span> tag.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
              Bing Webmaster Verification Code
            </label>
            <input
              type="text"
              value={settings.bingSiteVerification}
              onChange={(e) => setSettings({ ...settings, bingSiteVerification: e.target.value })}
              placeholder="e.g. 1234567890ABCDEF"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-xl text-xs font-mono text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
            />
            <p className="text-[11px] text-[#636E72] mt-1">
              Used for Bing Webmaster Tools & Yahoo verification.
            </p>
          </div>
        </div>

        {/* Custom Head Code */}
        <div>
          <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
            Custom &lt;head&gt; Code / Ad Network Verification Scripts
          </label>
          <textarea
            rows={5}
            value={settings.customHeadCode}
            onChange={(e) => setSettings({ ...settings, customHeadCode: e.target.value })}
            placeholder="<!-- Paste any ad network verification code, Google Tag Manager, or tracking script here -->&#10;<script>...</script>"
            className="w-full p-3.5 bg-[#0F172A] text-blue-300 font-mono text-xs rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
          />
          <p className="text-[11px] text-[#636E72] mt-1.5">
            Any scripts or meta tags pasted here are dynamically placed into <span className="font-mono text-xs">&lt;head&gt;</span> without requiring a rebuild or redeploy.
          </p>
        </div>

        {/* Custom Body Code */}
        <div>
          <label className="block text-xs font-bold text-[#2D3436] mb-1.5 uppercase tracking-wide">
            Custom &lt;body&gt; Code / Bottom Scripts
          </label>
          <textarea
            rows={4}
            value={settings.customBodyCode}
            onChange={(e) => setSettings({ ...settings, customBodyCode: e.target.value })}
            placeholder="<!-- Paste bottom-of-page scripts, pixel trackers, or chat widgets here -->"
            className="w-full p-3.5 bg-[#0F172A] text-indigo-300 font-mono text-xs rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving Live Changes..." : "Save AdSense & Verification Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
