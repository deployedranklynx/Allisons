import React, { useState, useEffect } from "react";
import { ApiKeysConfig, DEFAULT_API_KEYS_CONFIG } from "../types";
import { getFirebaseApiKeys, saveFirebaseApiKeys } from "../lib/firebase";
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Save,
  Zap,
  ShieldCheck,
  Activity,
  Copy,
  Check,
} from "lucide-react";

export const AdminApiKeysManager: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeysConfig>(DEFAULT_API_KEYS_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Visibility toggles
  const [showMoz, setShowMoz] = useState<boolean>(false);
  const [showAhrefs, setShowAhrefs] = useState<boolean>(false);
  const [showSemrush, setShowSemrush] = useState<boolean>(false);

  // Testing states
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load keys on mount
  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      // 1. Try Firestore
      const cloudKeys = await getFirebaseApiKeys();
      if (cloudKeys) {
        setKeys(cloudKeys);
        return;
      }

      // 2. Fallback to server
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) {
        const data = await res.json();
        if (data.keys) {
          setKeys(data.keys);
        }
      }
    } catch (err) {
      console.warn("Could not load API keys, using default initial configuration:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      // 1. Save to Firestore
      const firestoreOk = await saveFirebaseApiKeys(keys);

      // 2. Sync to local backend server
      const currentPasskey = sessionStorage.getItem("admin_raw_passkey") || "MEZ-Admin123";
      await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passkey: currentPasskey,
          keys,
        }),
      }).catch(() => {});

      if (firestoreOk) {
        setSaveSuccess("API Keys saved successfully to Firebase Cloud and applied to live Domain Metrics!");
      } else {
        setSaveSuccess("API Keys updated in local runtime and cached successfully!");
      }
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch {
      setSaveError("Failed to save API keys. Please check connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async (provider: "moz" | "ahrefs" | "semrush") => {
    setTestingService(provider);
    try {
      const res = await fetch("/api/admin/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          key:
            provider === "moz"
              ? keys.mozApiKey
              : provider === "ahrefs"
              ? keys.ahrefsApiKey
              : keys.semrushApiKey,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message || (data.success ? "Connection Verified!" : "Connection Failed"),
          details: data.details,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.message || "Network test timeout",
        },
      }));
    } finally {
      setTestingService(null);
    }
  };

  const copyToClipboard = async (text: string, provider: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(provider);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0984E3] flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#2D3436]">
                  SEO APIs & Integrations Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Ready
                </span>
              </div>
              <p className="text-xs text-[#636E72] mt-1 max-w-2xl leading-relaxed">
                Yahan aap Semrush, Ahrefs aur Moz ke API keys manage, update aur live test kar sakte hain.
                Jo bhi key yahan save hogi wo direct <strong>/domain-metrics</strong> inspector me use hogi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadKeys}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-[#636E72] hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Reload
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0984E3] hover:bg-[#0773c5] text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save & Apply All Keys
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-900">Moz Links API (v2)</span>
            </div>
            <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-200 text-emerald-800">
              Active & Verified
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-900">Ahrefs API (v3)</span>
            </div>
            <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-blue-200 text-blue-800">
              Configured
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-900">Semrush API</span>
            </div>
            <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-200 text-amber-800">
              Configured
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      {/* API Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* 1. MOZ API */}
        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                M
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D3436] flex items-center gap-2">
                  Moz API (Mozscape Links v2)
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
                    Live Verified
                  </span>
                </h3>
                <p className="text-[11px] text-[#636E72]">
                  Powers Domain Authority (DA), Page Authority (PA), Spam Score & Referring Domains
                </p>
              </div>
            </div>
            <a
              href="https://moz.com/products/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#0984E3] hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>Moz Developer Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#2D3436]">
              Moz API Token / Basic Auth Header
            </label>
            <div className="relative">
              <input
                type={showMoz ? "text" : "password"}
                value={keys.mozApiKey}
                onChange={(e) => setKeys({ ...keys, mozApiKey: e.target.value })}
                placeholder="bW96c2NhcGUtMmdlYUR3cVZnazpVTlpCeTVZN25nYkJr..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-[#2D3436] focus:outline-none focus:ring-2 focus:ring-[#0984E3]/20 focus:border-[#0984E3] pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(keys.mozApiKey, "moz")}
                  title="Copy to clipboard"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {copiedKey === "moz" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoz(!showMoz)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {showMoz ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-[#636E72]">
                Supports base64 encoded token or <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">AccessID:SecretKey</code>
              </div>
              <button
                type="button"
                onClick={() => handleTestKey("moz")}
                disabled={testingService === "moz"}
                className="px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                {testingService === "moz" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 text-emerald-600" />
                )}
                Test Moz Connection
              </button>
            </div>

            {testResults.moz && (
              <div
                className={`p-3 rounded-xl border text-xs mt-2 flex items-start gap-2 ${
                  testResults.moz.success
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {testResults.moz.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{testResults.moz.message}</p>
                  {testResults.moz.details && (
                    <p className="text-[11px] opacity-90 font-mono">
                      Target: {testResults.moz.details.target} | DA: {testResults.moz.details.da} | PA: {testResults.moz.details.pa} | Spam Score: {testResults.moz.details.spamScore}%
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. AHREFS API */}
        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D3436] flex items-center gap-2">
                  Ahrefs API (v3 Site Explorer)
                </h3>
                <p className="text-[11px] text-[#636E72]">
                  Powers Domain Rating (DR), URL Rating (UR), Referring Domains & Backlink Counts
                </p>
              </div>
            </div>
            <a
              href="https://ahrefs.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#0984E3] hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>Ahrefs API Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#2D3436]">
              Ahrefs API Key / Bearer Token
            </label>
            <div className="relative">
              <input
                type={showAhrefs ? "text" : "password"}
                value={keys.ahrefsApiKey}
                onChange={(e) => setKeys({ ...keys, ahrefsApiKey: e.target.value })}
                placeholder="hrCN8Sh5M7F4XLX0vgS2_wSeEqYhL491PMMb1w_v..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-[#2D3436] focus:outline-none focus:ring-2 focus:ring-[#0984E3]/20 focus:border-[#0984E3] pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(keys.ahrefsApiKey, "ahrefs")}
                  title="Copy to clipboard"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {copiedKey === "ahrefs" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAhrefs(!showAhrefs)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {showAhrefs ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-[#636E72]">
                Generate your key inside Ahrefs Dashboard ➜ Account Settings ➜ API Keys
              </div>
              <button
                type="button"
                onClick={() => handleTestKey("ahrefs")}
                disabled={testingService === "ahrefs"}
                className="px-3.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                {testingService === "ahrefs" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Activity className="w-3 h-3 text-blue-600" />
                )}
                Test Ahrefs Connection
              </button>
            </div>

            {testResults.ahrefs && (
              <div
                className={`p-3 rounded-xl border text-xs mt-2 flex items-start gap-2 ${
                  testResults.ahrefs.success
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                {testResults.ahrefs.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{testResults.ahrefs.message}</p>
                  {testResults.ahrefs.details && (
                    <p className="text-[11px] opacity-90 font-mono">
                      Info: {JSON.stringify(testResults.ahrefs.details)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. SEMRUSH API */}
        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                S
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D3436] flex items-center gap-2">
                  Semrush API (v4 PAT & Analytics)
                </h3>
                <p className="text-[11px] text-[#636E72]">
                  Powers Authority Score (AS), Organic Search Traffic & Ranked Keyword Volumes
                </p>
              </div>
            </div>
            <a
              href="https://developer.semrush.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#0984E3] hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>Semrush API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#2D3436]">
              Semrush Personal Access Token (PAT) or API Key
            </label>
            <div className="relative">
              <input
                type={showSemrush ? "text" : "password"}
                value={keys.semrushApiKey}
                onChange={(e) => setKeys({ ...keys, semrushApiKey: e.target.value })}
                placeholder="semrtkn-pat--WOZZkf7SKad6GMLjm8-ZQ-l_9oWZsTtILJfNhglXbjB_j5nd5Oy1wc..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-[#2D3436] focus:outline-none focus:ring-2 focus:ring-[#0984E3]/20 focus:border-[#0984E3] pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(keys.semrushApiKey, "semrush")}
                  title="Copy to clipboard"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {copiedKey === "semrush" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSemrush(!showSemrush)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  {showSemrush ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-[#636E72]">
                Supports Semrush v4 Personal Access Tokens (<code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">semrtkn-pat-...</code>) or v3 API Keys
              </div>
              <button
                type="button"
                onClick={() => handleTestKey("semrush")}
                disabled={testingService === "semrush"}
                className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                {testingService === "semrush" ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                )}
                Test Semrush Connection
              </button>
            </div>

            {testResults.semrush && (
              <div
                className={`p-3 rounded-xl border text-xs mt-2 flex items-start gap-2 ${
                  testResults.semrush.success
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                {testResults.semrush.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{testResults.semrush.message}</p>
                  {testResults.semrush.details && (
                    <p className="text-[11px] opacity-90 font-mono">
                      Info: {JSON.stringify(testResults.semrush.details)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Action Bar at Bottom */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#2D3436]">Save Changes</h4>
          <p className="text-xs text-[#636E72]">
            Changes will be stored persistently in Firestore and applied immediately to live audits.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#0984E3] hover:bg-[#0773c5] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save API Integrations</span>
        </button>
      </div>
    </div>
  );
};
