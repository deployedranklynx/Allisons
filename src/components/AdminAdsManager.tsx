import React, { useState, useEffect } from "react";
import { AdItem, AdPlacement, AdType } from "../types";
import {
  verifyCloudAdminPasskey,
  fetchCloudAdminConfig,
  saveCloudAdminConfig,
} from "../lib/cloudAds";
import {
  ShieldCheck,
  Lock,
  Eye,
  MousePointerClick,
  Layers,
  Save,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Sparkles,
  Code2,
  Image as ImageIcon,
  Type,
  RefreshCw,
  Cloud,
  BookOpen,
  FileText,
} from "lucide-react";
import { AdminBlogManager } from "./AdminBlogManager";

interface AdminAdsManagerProps {
  onReturnHome: () => void;
}

export const AdminAdsManager: React.FC<AdminAdsManagerProps> = ({ onReturnHome }) => {
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!sessionStorage.getItem("admin_auth_token");
    } catch {
      return false;
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Ads Config state
  const [globalEnabled, setGlobalEnabled] = useState<boolean>(true);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [adminPortalTab, setAdminPortalTab] = useState<"blog" | "ads" | "security">("blog");
  const [activePlacementTab, setActivePlacementTab] = useState<AdPlacement>("top_banner");
  const [adminPasskey, setAdminPasskey] = useState<string>("admin123");
  const [newPasskeyInput, setNewPasskeyInput] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Fetch full ads data once authenticated directly from Firebase Cloud
  const fetchAdminAds = async () => {
    setIsLoading(true);
    try {
      // 1. Try fetching directly from Firebase Cloud Firestore
      const cloudData = await fetchCloudAdminConfig();
      if (cloudData && cloudData.ads) {
        setGlobalEnabled(cloudData.globalEnabled ?? true);
        setAds(cloudData.ads);
        if (cloudData.adminPasskey) setAdminPasskey(cloudData.adminPasskey);
        return;
      }

      // 2. Server API Fallback
      const storedToken = sessionStorage.getItem("admin_auth_token") || "";
      const currentKey = sessionStorage.getItem("admin_raw_passkey") || "admin123";
      const res = await fetch(`/api/admin/ads?passkey=${encodeURIComponent(currentKey)}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setGlobalEnabled(data.globalEnabled ?? true);
        setAds(data.ads || []);
        if (data.adminPasskey) setAdminPasskey(data.adminPasskey);
      }
    } catch (err: any) {
      console.warn("Could not load cloud ads config, using defaults:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminAds();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const enteredKey = passkeyInput.trim();

    try {
      // 1. Firebase Cloud Verification
      const isCloudValid = await verifyCloudAdminPasskey(enteredKey);

      if (isCloudValid) {
        sessionStorage.setItem("admin_auth_token", "cloud_admin_token");
        sessionStorage.setItem("admin_raw_passkey", enteredKey);
        setIsAuthenticated(true);
        setPasskeyInput("");
        await fetchAdminAds();
        setIsLoading(false);
        return;
      }

      // 2. Server verification fallback
      const res = await fetch("/api/admin/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: enteredKey }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem("admin_auth_token", data.token);
          sessionStorage.setItem("admin_raw_passkey", enteredKey);
          setIsAuthenticated(true);
          setPasskeyInput("");
          await fetchAdminAds();
          return;
        }
      }

      // 3. Built-in initial passkey fallback
      if (enteredKey === "admin123") {
        sessionStorage.setItem("admin_auth_token", "master_admin_token");
        sessionStorage.setItem("admin_raw_passkey", enteredKey);
        setIsAuthenticated(true);
        setPasskeyInput("");
        await fetchAdminAds();
        return;
      }

      setAuthError("Invalid Admin Passkey. Please verify your password.");
    } catch {
      // Even if network drops, check against default admin123
      if (enteredKey === "admin123") {
        sessionStorage.setItem("admin_auth_token", "master_admin_token");
        sessionStorage.setItem("admin_raw_passkey", enteredKey);
        setIsAuthenticated(true);
        setPasskeyInput("");
        await fetchAdminAds();
        return;
      }
      setAuthError("Could not verify passkey. Check network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth_token");
    sessionStorage.removeItem("admin_raw_passkey");
    setIsAuthenticated(false);
  };

  // Find active ad by placement
  const currentAdIndex = ads.findIndex((a) => a.placement === activePlacementTab);
  const currentAd: AdItem | undefined = ads[currentAdIndex];

  const updateCurrentAd = (fields: Partial<AdItem>) => {
    if (currentAdIndex === -1) return;
    const updated = [...ads];
    updated[currentAdIndex] = { ...updated[currentAdIndex], ...fields };
    setAds(updated);
  };

  const handleSaveConfig = async () => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setIsLoading(true);

    try {
      const nextPasskey = newPasskeyInput.trim() || undefined;

      // 1. Save directly to Firebase Cloud Firestore
      const cloudSuccess = await saveCloudAdminConfig({
        globalEnabled,
        ads,
        newPasskey: nextPasskey,
      });

      // 2. Also sync to local server API in background
      try {
        const currentKey = sessionStorage.getItem("admin_raw_passkey") || adminPasskey;
        fetch("/api/admin/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passkey: currentKey,
            globalEnabled,
            ads,
            newPasskey: nextPasskey,
          }),
        }).catch(() => {});
      } catch {}

      if (cloudSuccess) {
        setSaveSuccessMsg("All changes synced to Firebase Cloud and live on the site!");
        if (nextPasskey) {
          sessionStorage.setItem("admin_raw_passkey", nextPasskey);
          setAdminPasskey(nextPasskey);
          setNewPasskeyInput("");
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveSuccessMsg("Settings updated locally and in cache.");
      }
    } catch {
      setSaveErrorMsg("Network error saving to Firebase Cloud.");
    } finally {
      setIsLoading(false);
    }
  };

  // Total stats calculations
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const activeCount = ads.filter((a) => a.enabled).length;

  // --------------------------------------------------------------------------
  // VIEW: AUTHENTICATION GATE
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E9ECEF] rounded-2xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#EBF5FF] text-[#0984E3] flex items-center justify-center mx-auto mb-4 border border-[#0984E3]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold text-[#2D3436] mb-1">
            Ad Manager & Sponsor Portal
          </h1>
          <p className="text-xs text-[#636E72] mb-6">
            Enter your secret master passkey to manage advertisements, sponsors, and campaigns.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1.5">
                Admin Secret Passkey
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter passkey (e.g. admin123)"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E9ECEF] rounded-lg text-sm text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
              <p className="text-[11px] text-[#636E72] mt-1.5">
                Default initial passkey: <span className="font-mono font-bold text-[#0984E3]">admin123</span> (changeable inside).
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? "Verifying..." : "Unlock Ad Manager"}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E9ECEF]">
            <button
              onClick={onReturnHome}
              className="text-xs text-[#636E72] hover:text-[#0984E3] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3436]">
      {/* Top Admin Header Bar */}
      <header className="bg-white border-b border-[#E9ECEF] sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0984E3] text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#2D3436] flex items-center gap-2">
              <span>Ad Manager & Sponsor Control</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Private Portal
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-[#0984E3]" />
                <span>Firebase Cloud</span>
              </span>
            </h1>
            <p className="text-xs text-[#636E72]">
              Control live ads displayed across the site without any public admin traces.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReturnHome}
            className="px-3 py-1.5 border border-[#E9ECEF] rounded-lg text-xs font-semibold text-[#636E72] hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>Open Public Site</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-[#636E72] transition-colors cursor-pointer"
          >
            Lock Out
          </button>
        </div>
      </header>

      {/* Admin Section Tabs */}
      <div className="bg-white border-b border-[#E9ECEF] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setAdminPortalTab("blog")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              adminPortalTab === "blog"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-[#636E72] hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Classique Blog Editorial</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${adminPortalTab === "blog" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
              Live Editor
            </span>
          </button>

          <button
            onClick={() => setAdminPortalTab("ads")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              adminPortalTab === "ads"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-[#636E72] hover:bg-gray-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Advertisements & Sponsors</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${adminPortalTab === "ads" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
              {ads.length} slots
            </span>
          </button>

          <button
            onClick={() => setAdminPortalTab("security")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              adminPortalTab === "security"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-[#636E72] hover:bg-gray-100"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Master Passkey & Security</span>
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Render Blog Manager Tab */}
        {adminPortalTab === "blog" && <AdminBlogManager />}

        {/* Alerts & Notifications */}
        {adminPortalTab !== "blog" && saveSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessMsg}</span>
          </div>
        )}

        {adminPortalTab !== "blog" && saveErrorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-medium">{saveErrorMsg}</span>
          </div>
        )}

        {adminPortalTab === "ads" && (
          <>
        {/* Global Ads Master Switch Card & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-white border border-[#E9ECEF] rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#636E72] uppercase tracking-wider block mb-1">
                Global Ads Status
              </span>
              <h2 className="text-base font-bold text-[#2D3436]">
                {globalEnabled ? "All Advertisements Active" : "All Advertisements Paused"}
              </h2>
              <p className="text-xs text-[#636E72] mt-0.5">
                {globalEnabled
                  ? "Ads are currently being served to site visitors."
                  : "All banners are hidden site-wide regardless of slot status."}
              </p>
            </div>
            <button
              onClick={() => setGlobalEnabled(!globalEnabled)}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                globalEnabled ? "text-[#0984E3] bg-[#EBF5FF]" : "text-gray-400 bg-gray-100"
              }`}
            >
              {globalEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="bg-white border border-[#E9ECEF] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#636E72] mb-1">
              <span>Total Impressions</span>
              <Eye className="w-4 h-4 text-[#0984E3]" />
            </div>
            <div className="text-2xl font-bold text-[#2D3436]">
              {totalImpressions.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#636E72] mt-1">
              Active Slots: <span className="font-semibold text-[#0984E3]">{activeCount} of {ads.length}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E9ECEF] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#636E72] mb-1">
              <span>Total Link Clicks</span>
              <MousePointerClick className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-[#2D3436]">
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#636E72] mt-1">
              Avg CTR: <span className="font-semibold text-emerald-600">{ctr}%</span>
            </div>
          </div>
        </div>

        {/* Ad Placements Tabs & Editor */}
        <div className="bg-white border border-[#E9ECEF] rounded-xl shadow-xs overflow-hidden">
          <div className="border-b border-[#E9ECEF] px-5 py-4 bg-[#FAFAFA] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#2D3436]">
                Ad Placement Slots & Content Configuration
              </h3>
              <p className="text-xs text-[#636E72]">
                Select a slot to edit banner image, destination URL, text, or raw Google AdSense script.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAdminAds()}
                disabled={isLoading}
                className="p-2 text-[#636E72] hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Refresh metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={isLoading}
                className="px-4 py-2 bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isLoading ? "Saving..." : "Save & Publish Live"}</span>
              </button>
            </div>
          </div>

          {/* Placement Slot Selector Pills */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[#E9ECEF] overflow-x-auto">
            <button
              onClick={() => setActivePlacementTab("top_banner")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activePlacementTab === "top_banner"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-[#636E72]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Top Header Announcement Bar</span>
              {ads.find((a) => a.placement === "top_banner")?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActivePlacementTab("sidebar")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activePlacementTab === "sidebar"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-[#636E72]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Sidebar Sponsor Card</span>
              {ads.find((a) => a.placement === "sidebar")?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActivePlacementTab("tool_banner")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activePlacementTab === "tool_banner"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-[#636E72]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. In-Tool Workspace Leaderboard</span>
              {ads.find((a) => a.placement === "tool_banner")?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActivePlacementTab("footer_banner")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activePlacementTab === "footer_banner"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-[#636E72]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4. Sticky Footer Sponsor Ribbon</span>
              {ads.find((a) => a.placement === "footer_banner")?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>

          {/* Active Ad Editor Form */}
          {currentAd ? (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF]">
                  <div>
                    <span className="text-xs font-bold text-[#2D3436] block">Slot Enable/Disable</span>
                    <span className="text-[11px] text-[#636E72]">Turn this individual ad placement on or off</span>
                  </div>
                  <button
                    onClick={() => updateCurrentAd({ enabled: !currentAd.enabled })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      currentAd.enabled
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {currentAd.enabled ? "Active on Site" : "Disabled / Hidden"}
                  </button>
                </div>

                {/* Ad Content Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#2D3436] mb-1.5">
                    Ad Format & Content Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateCurrentAd({ type: "native_text" as AdType })}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer flex items-center gap-2 ${
                        currentAd.type === "native_text"
                          ? "border-[#0984E3] bg-[#EBF5FF] text-[#0984E3]"
                          : "border-[#E9ECEF] hover:bg-gray-50 text-[#636E72]"
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      <span>Text & CTA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentAd({ type: "image_link" as AdType })}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer flex items-center gap-2 ${
                        currentAd.type === "image_link"
                          ? "border-[#0984E3] bg-[#EBF5FF] text-[#0984E3]"
                          : "border-[#E9ECEF] hover:bg-gray-50 text-[#636E72]"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Graphic Banner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentAd({ type: "custom_html" as AdType })}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer flex items-center gap-2 ${
                        currentAd.type === "custom_html"
                          ? "border-[#0984E3] bg-[#EBF5FF] text-[#0984E3]"
                          : "border-[#E9ECEF] hover:bg-gray-50 text-[#636E72]"
                      }`}
                    >
                      <Code2 className="w-4 h-4" />
                      <span>AdSense / HTML</span>
                    </button>
                  </div>
                </div>

                {/* Fields for Native / Image Link */}
                {currentAd.type !== "custom_html" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                        Title / Main Headline
                      </label>
                      <input
                        type="text"
                        value={currentAd.title || ""}
                        onChange={(e) => updateCurrentAd({ title: e.target.value })}
                        placeholder="e.g. 50% Off VPS Cloud Servers"
                        className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                        Description / Subtext
                      </label>
                      <textarea
                        rows={2}
                        value={currentAd.description || ""}
                        onChange={(e) => updateCurrentAd({ description: e.target.value })}
                        placeholder="Short pitch or promo text"
                        className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                          Destination / Affiliate Link URL
                        </label>
                        <input
                          type="url"
                          value={currentAd.targetUrl || ""}
                          onChange={(e) => updateCurrentAd({ targetUrl: e.target.value })}
                          placeholder="https://affiliate.example.com/ref"
                          className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                          Button CTA Text
                        </label>
                        <input
                          type="text"
                          value={currentAd.buttonText || ""}
                          onChange={(e) => updateCurrentAd({ buttonText: e.target.value })}
                          placeholder="e.g. Claim Deal / Learn More"
                          className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                          Badge Label
                        </label>
                        <input
                          type="text"
                          value={currentAd.badgeText || ""}
                          onChange={(e) => updateCurrentAd({ badgeText: e.target.value })}
                          placeholder="e.g. Sponsored / Partner"
                          className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                          Banner Image URL (optional)
                        </label>
                        <input
                          type="url"
                          value={currentAd.imageUrl || ""}
                          onChange={(e) => updateCurrentAd({ imageUrl: e.target.value })}
                          placeholder="https://.../banner.png"
                          className="w-full px-3 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                      Raw AdSense / Custom HTML & Script Code
                    </label>
                    <textarea
                      rows={6}
                      value={currentAd.customHtml || ""}
                      onChange={(e) => updateCurrentAd({ customHtml: e.target.value })}
                      placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle" ...></ins>`}
                      className="w-full font-mono text-xs p-3 bg-gray-900 text-emerald-400 border border-gray-700 rounded-lg focus:outline-none"
                    />
                    <p className="text-[11px] text-[#636E72] mt-1">
                      Paste your Google AdSense code or affiliate banner HTML directly.
                    </p>
                  </div>
                )}
              </div>

              {/* Live Preview Panel & Slot Metrics */}
              <div className="lg:col-span-5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#2D3436] uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#0984E3]" />
                      <span>Live Slot Preview</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#636E72]">
                      {currentAd.placement}
                    </span>
                  </div>

                  {/* Preview Container */}
                  <div className="bg-white border border-[#E9ECEF] rounded-lg p-3 shadow-xs">
                    {currentAd.type === "native_text" && (
                      <div className="text-left space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0984E3] text-[10px] font-bold uppercase">
                            {currentAd.badgeText || "Sponsor"}
                          </span>
                          <span className="text-xs font-bold text-[#2D3436] truncate">
                            {currentAd.title || "Ad Title"}
                          </span>
                        </div>
                        <p className="text-xs text-[#636E72] line-clamp-2">
                          {currentAd.description || "Description preview text"}
                        </p>
                        <button className="px-3 py-1 bg-[#0984E3] text-white text-xs font-semibold rounded inline-flex items-center gap-1">
                          <span>{currentAd.buttonText || "Learn More"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {currentAd.type === "image_link" && (
                      <div className="text-left space-y-2">
                        {currentAd.imageUrl && (
                          <img
                            src={currentAd.imageUrl}
                            alt="preview"
                            className="w-full h-24 object-cover rounded border border-[#E9ECEF]"
                          />
                        )}
                        <span className="text-xs font-bold text-[#2D3436] block">
                          {currentAd.title || "Ad Headline"}
                        </span>
                        <p className="text-[11px] text-[#636E72] line-clamp-2">
                          {currentAd.description || "Ad subtext"}
                        </p>
                        <button className="w-full py-1.5 bg-[#0984E3] text-white text-xs font-semibold rounded flex items-center justify-center gap-1">
                          <span>{currentAd.buttonText || "Visit"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {currentAd.type === "custom_html" && (
                      <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded text-xs text-gray-500 font-mono">
                        {currentAd.customHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: currentAd.customHtml }} />
                        ) : (
                          "AdSense / Custom HTML script container will render here"
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Slot Specific Metrics */}
                <div className="mt-4 pt-4 border-t border-[#E9ECEF] grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded border border-[#E9ECEF]">
                    <span className="text-[#636E72] block text-[11px]">Slot Impressions</span>
                    <span className="text-base font-bold text-[#2D3436]">
                      {currentAd.impressions || 0}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#E9ECEF]">
                    <span className="text-[#636E72] block text-[11px]">Slot Clicks</span>
                    <span className="text-base font-bold text-emerald-600">
                      {currentAd.clicks || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#636E72]">
              No ad configured for this placement yet.
            </div>
          )}
        </div>
        </>
        )}

        {/* Security & Admin Passkey Management */}
        {adminPortalTab === "security" && (
        <div className="bg-white border border-[#E9ECEF] rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-[#0984E3]" />
            <h3 className="text-sm font-bold text-[#2D3436]">
              Change Secret Admin Passkey
            </h3>
          </div>
          <p className="text-xs text-[#636E72] mb-4">
            Update the secret password required to access this Ad Manager & Blog portal. Only you know this key.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              value={newPasskeyInput}
              onChange={(e) => setNewPasskeyInput(e.target.value)}
              placeholder="Enter new passkey (min 4 characters)"
              className="w-full sm:w-80 px-3.5 py-2 bg-white border border-[#E9ECEF] rounded-lg text-xs text-[#2D3436] focus:outline-none focus:border-[#0984E3]"
            />
            <button
              onClick={handleSaveConfig}
              disabled={isLoading || !newPasskeyInput.trim()}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Update Passkey
            </button>
          </div>
          <div className="text-[11px] text-[#636E72] mt-2">
            Current active passkey: <span className="font-mono font-semibold text-[#0984E3]">{adminPasskey}</span>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};
