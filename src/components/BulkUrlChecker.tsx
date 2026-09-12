import React, { useState, useMemo, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Download,
  Copy,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Layers,
  Settings,
  Sparkles,
  Info,
  Check,
  FileText,
  Upload,
  Globe,
  HelpCircle,
  Eye,
  Server,
  Code,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BulkUrlCheckItem, BulkUrlCheckSummary } from "../types";

const SAMPLE_URLS = [
  "https://www.google.com",
  "http://github.com",
  "https://en.wikipedia.org/wiki/Main_Page",
  "https://httpbin.org/status/302",
  "https://httpbin.org/status/404",
  "https://httpbin.org/status/403",
  "https://httpbin.org/status/410",
  "https://httpbin.org/status/500",
  "https://httpbin.org/redirect/2",
  "https://en.wikipedia.org/wiki/Special:Random",
  "https://non-existent-domain-test-xyz-987654.org",
];

const USER_AGENT_OPTIONS = [
  {
    id: "chrome",
    label: "Google Chrome 130 (Desktop)",
    value:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
  {
    id: "googlebot-desktop",
    label: "Googlebot (Desktop Crawler)",
    value: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    id: "googlebot-mobile",
    label: "Googlebot Smartphone (Mobile Crawler)",
    value:
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    id: "bingbot",
    label: "Bingbot (Microsoft Bing)",
    value: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  },
  {
    id: "curl",
    label: "cURL / Command Line Client",
    value: "curl/8.4.0",
  },
];

export function BulkUrlChecker() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<BulkUrlCheckItem[]>([]);
  const [summary, setSummary] = useState<BulkUrlCheckSummary | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [selectedUserAgent, setSelectedUserAgent] = useState(USER_AGENT_OPTIONS[0].value);
  const [method, setMethod] = useState<"GET" | "HEAD">("GET");
  const [followRedirects, setFollowRedirects] = useState(true);
  const [timeoutSeconds, setTimeoutSeconds] = useState(8);
  const [deduplicate, setDeduplicate] = useState(false);

  // Table filtering & search
  const [activeFilter, setActiveFilter] = useState<"all" | "2xx" | "3xx" | "4xx" | "5xx" | "error">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inspection modal
  const [inspectItem, setInspectItem] = useState<BulkUrlCheckItem | null>(null);

  // Abort controller ref for cancel
  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse URLs count from text with flexible formatting (newlines, commas, spaces, quotes)
  const parsedUrls = useMemo(() => {
    if (!inputText.trim()) return [];

    // Split by newlines, commas, or semicolons
    const tokens = inputText
      .split(/[\r\n,;]+/)
      .map((line) =>
        line
          .trim()
          .replace(/^["'«“‘]+|["'»”’]+$/g, "")
          .replace(/^[<(\[]+|[>)\]]+$/g, "")
          .trim()
      )
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    const expanded: string[] = [];
    tokens.forEach((t) => {
      // If a single line contains space-separated URLs
      if (t.includes(" ") && (t.includes("http://") || t.includes("https://") || t.includes(".com") || t.includes(".org") || t.includes(".net"))) {
        const sub = t.split(/\s+/).filter(Boolean);
        expanded.push(...sub);
      } else {
        expanded.push(t);
      }
    });

    let list = expanded;
    if (deduplicate) {
      list = Array.from(new Set(list));
    }
    return list;
  }, [inputText, deduplicate]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Bulk Check with streaming batches and robust fallback
  const handleCheckUrls = async () => {
    if (parsedUrls.length === 0) return;

    setIsLoading(true);
    setCheckError(null);
    setResults([]);
    setSummary(null);
    setProgress({ current: 0, total: parsedUrls.length });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Process in smaller batches of 8 for live streaming responsiveness
    const batchSize = 8;
    const allCollected: BulkUrlCheckItem[] = [];

    try {
      for (let i = 0; i < parsedUrls.length; i += batchSize) {
        if (controller.signal.aborted) break;

        const currentBatch = parsedUrls.slice(i, i + batchSize);
        let batchResults: BulkUrlCheckItem[] = [];

        try {
          // Attempt primary endpoint
          const res = await fetch("/api/seo/bulk-url-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              urls: currentBatch,
              options: {
                userAgent: selectedUserAgent,
                method,
                followRedirects,
                timeoutMs: timeoutSeconds * 1000,
                concurrency: 4,
              },
            }),
          });

          if (!res.ok) {
            // Attempt fallback alias endpoint
            const fallbackRes = await fetch("/api/bulk-url-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                urls: currentBatch,
                options: {
                  userAgent: selectedUserAgent,
                  method,
                  followRedirects,
                  timeoutMs: timeoutSeconds * 1000,
                  concurrency: 4,
                },
              }),
            });

            if (!fallbackRes.ok) {
              throw new Error(`Server returned HTTP ${res.status}`);
            }
            const fbData = await fallbackRes.json();
            batchResults = fbData.results || fbData.data || [];
          } else {
            const data = await res.json();
            batchResults = data.results || data.data || [];
          }
        } catch (batchErr: any) {
          if (controller.signal.aborted) break;
          console.warn("Batch API error, synthesizing fallback items:", batchErr);

          // If server fails or is unreachable, generate informative fallback items so user sees what failed
          batchResults = currentBatch.map((u) => {
            let normalized = u.trim();
            if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
              normalized = "https://" + normalized;
            }
            return {
              index: 0,
              originalUrl: u,
              normalizedUrl: normalized,
              finalUrl: normalized,
              statusCode: 0,
              statusText: batchErr.message || "Network / Server unreachable",
              statusGroup: "error" as const,
              redirectCount: 0,
              isRedirect: false,
              redirectChain: [],
              responseTimeMs: 0,
              contentType: "-",
              contentLength: "-",
              server: "-",
              isError: true,
              errorMessage: batchErr.message || "Check request failed",
              checkedAt: new Date().toISOString(),
            };
          });
        }

        // Adjust index to overall sequence
        const adjusted = batchResults.map((item, idx) => ({
          ...item,
          index: allCollected.length + idx + 1,
        }));

        allCollected.push(...adjusted);
        setResults([...allCollected]);
        setProgress({ current: allCollected.length, total: parsedUrls.length });
      }

      // Compute final aggregated summary
      let success2xx = 0;
      let redirect3xx = 0;
      let clientError4xx = 0;
      let serverError5xx = 0;
      let errors = 0;
      let totalTime = 0;

      allCollected.forEach((r) => {
        totalTime += r.responseTimeMs || 0;
        if (r.statusGroup === "2xx") success2xx++;
        else if (r.statusGroup === "3xx") redirect3xx++;
        else if (r.statusGroup === "4xx") clientError4xx++;
        else if (r.statusGroup === "5xx") serverError5xx++;
        else errors++;
      });

      setSummary({
        total: allCollected.length,
        success2xx,
        redirect3xx,
        clientError4xx,
        serverError5xx,
        errors,
        avgResponseTimeMs: allCollected.length > 0 ? Math.round(totalTime / allCollected.length) : 0,
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Bulk check error:", err);
        setCheckError(err.message || "An unexpected error occurred while checking URLs. Please check server status and try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_URLS.join("\n"));
  };

  const handleClear = () => {
    setInputText("");
    setResults([]);
    setSummary(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Find URLs in file (either one per line or extracted via regex)
        const lines = content
          .split(/[\r\n]+/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        setInputText((prev) => (prev ? prev + "\n" + lines.join("\n") : lines.join("\n")));
      }
    };
    reader.readAsText(file);
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Group filter
      if (activeFilter !== "all" && item.statusGroup !== activeFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUrl = item.originalUrl.toLowerCase().includes(q) || item.finalUrl.toLowerCase().includes(q);
        const matchesStatus = String(item.statusCode).includes(q) || item.statusText.toLowerCase().includes(q);
        const matchesServer = (item.server || "").toLowerCase().includes(q);
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        return matchesUrl || matchesStatus || matchesServer || matchesTitle;
      }
      return true;
    });
  }, [results, activeFilter, searchQuery]);

  // Export CSV
  const exportToCsv = () => {
    if (results.length === 0) return;

    const headers = [
      "Index",
      "Original URL",
      "Status Code",
      "Status Message",
      "Status Group",
      "Redirect Count",
      "Final Destination URL",
      "Redirect Chain",
      "Response Time (ms)",
      "Server",
      "Content-Type",
      "Page Title",
      "Meta Robots",
      "Canonical URL",
      "Error Message",
    ];

    const rows = results.map((r) => {
      const chainStr = r.redirectChain
        ? r.redirectChain.map((h) => `${h.statusCode} (${h.url})`).join(" -> ")
        : "";

      return [
        r.index,
        `"${(r.originalUrl || "").replace(/"/g, '""')}"`,
        r.statusCode,
        `"${(r.statusText || "").replace(/"/g, '""')}"`,
        r.statusGroup,
        r.redirectCount,
        `"${(r.finalUrl || "").replace(/"/g, '""')}"`,
        `"${chainStr.replace(/"/g, '""')}"`,
        r.responseTimeMs,
        `"${(r.server || "").replace(/"/g, '""')}"`,
        `"${(r.contentType || "").replace(/"/g, '""')}"`,
        `"${(r.title || "").replace(/"/g, '""')}"`,
        `"${(r.metaRobots || "").replace(/"/g, '""')}"`,
        `"${(r.canonical || "").replace(/"/g, '""')}"`,
        `"${(r.errorMessage || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bulk_url_check_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const exportToJson = () => {
    if (results.length === 0) return;
    const blob = new Blob([JSON.stringify({ summary, results }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bulk_url_check_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy broken URLs (4xx / 5xx / errors)
  const copyBrokenUrls = () => {
    const broken = results
      .filter((r) => r.statusGroup === "4xx" || r.statusGroup === "5xx" || r.statusGroup === "error")
      .map((r) => `${r.statusCode || "ERR"} - ${r.originalUrl}`)
      .join("\n");

    if (broken) {
      copyToClipboard(broken, "broken");
    }
  };

  // Copy redirected URLs (3xx)
  const copyRedirectedUrls = () => {
    const redirected = results
      .filter((r) => r.isRedirect || r.statusGroup === "3xx")
      .map((r) => `${r.statusCode} : ${r.originalUrl} -> ${r.finalUrl}`)
      .join("\n");

    if (redirected) {
      copyToClipboard(redirected, "redirected");
    }
  };

  // Helper for Status Badge styling
  const getStatusBadge = (statusCode: number, statusGroup: string, statusText: string) => {
    if (statusGroup === "2xx") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {statusCode} {statusText || "OK"}
        </span>
      );
    }
    if (statusGroup === "3xx") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
          {statusCode} {statusText || "Redirect"}
        </span>
      );
    }
    if (statusGroup === "4xx") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          {statusCode} {statusText || "Not Found"}
        </span>
      );
    }
    if (statusGroup === "5xx") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
          {statusCode} {statusText || "Server Error"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
        {statusText || "Unreachable"}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Free Multi-Hop HTTP Status & Redirect Auditor</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bulk URL Status & Redirect Checker
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Audit up to hundreds of URLs in seconds. Inspect HTTP status codes (200, 301, 302, 404,
              500), trace full redirect chains, detect redirect loops, analyze server response headers,
              measure latency, and export comprehensive SEO reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                showSettings
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Options & User-Agent</span>
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer */}
        {showSettings && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/70 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Crawler / User-Agent
              </label>
              <select
                value={selectedUserAgent}
                onChange={(e) => setSelectedUserAgent(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {USER_AGENT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Simulate Googlebot to test crawler behavior</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Request Method & Follow
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    checked={method === "GET"}
                    onChange={() => setMethod("GET")}
                    className="text-blue-600"
                  />
                  <span>GET (Title & Meta)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    checked={method === "HEAD"}
                    onChange={() => setMethod("HEAD")}
                    className="text-blue-600"
                  />
                  <span>HEAD (Fast)</span>
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={followRedirects}
                  onChange={(e) => setFollowRedirects(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Follow Redirects to Final URL</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Timeout per Request: {timeoutSeconds}s
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>3s (Fast)</span>
                <span>8s (Balanced)</span>
                <span>20s (Slow sites)</span>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-2.5">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Remove Duplicate URLs Automatically</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              Enter URLs to Check
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {parsedUrls.length} {parsedUrls.length === 1 ? "URL" : "URLs"} loaded
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample URLs (Mixed Statuses)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import .txt / .csv</span>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                navigator.clipboard.readText().then((text) => {
                  setInputText((prev) => (prev ? prev + "\n" + text : text));
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>

            {inputText && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`https://example.com/about\nhttp://yourdomain.com\nhttps://example.com/missing-page\nhttps://example.com/redirect-test`}
            rows={7}
            className="w-full font-mono text-sm p-3.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 leading-relaxed"
          />
        </div>

        {/* Error Alert Banner */}
        {checkError && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Check issue encountered</p>
                <p className="text-xs text-rose-700 mt-0.5">{checkError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCheckUrls}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setCheckError(null)}
                className="text-xs text-rose-600 hover:text-rose-900 font-medium px-1.5 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            {!isLoading ? (
              <button
                onClick={handleCheckUrls}
                disabled={parsedUrls.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check {parsedUrls.length > 0 ? `${parsedUrls.length} URLs` : "URLs"}</span>
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Stop Check</span>
              </button>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>
                  Checking {progress.current} of {progress.total} URLs... (
                  {Math.round((progress.current / (progress.total || 1)) * 100)}%)
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>High-concurrency server engine • Real status codes • No CORS blocks</span>
          </div>
        </div>

        {/* Progress bar */}
        {isLoading && (
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.round((progress.current / (progress.total || 1)) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => setActiveFilter("all")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Total Checked</div>
            <div className="text-2xl font-bold mt-1">{results.length}</div>
            <div className="text-xs mt-1 opacity-70">
              {summary ? `${summary.avgResponseTimeMs}ms avg latency` : "All URLs"}
            </div>
          </div>

          <div
            onClick={() => setActiveFilter("2xx")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "2xx"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2xx Success</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {results.filter((r) => r.statusGroup === "2xx").length}
            </div>
            <div className="text-xs mt-1 opacity-70">200 OK & Live Pages</div>
          </div>

          <div
            onClick={() => setActiveFilter("3xx")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "3xx"
                ? "bg-amber-500 text-white border-amber-500 shadow-md"
                : "bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-50"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75 flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>3xx Redirects</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {results.filter((r) => r.statusGroup === "3xx").length}
            </div>
            <div className="text-xs mt-1 opacity-70">301/302 Redirections</div>
          </div>

          <div
            onClick={() => setActiveFilter("4xx")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "4xx"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-rose-50/60 text-rose-900 border-rose-200 hover:bg-rose-50"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>4xx Broken</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {results.filter((r) => r.statusGroup === "4xx").length}
            </div>
            <div className="text-xs mt-1 opacity-70">404 Not Found / 403</div>
          </div>

          <div
            onClick={() => setActiveFilter("5xx")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "5xx"
                ? "bg-purple-600 text-white border-purple-600 shadow-md"
                : "bg-purple-50/60 text-purple-900 border-purple-200 hover:bg-purple-50"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>5xx Server Errors</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {results.filter((r) => r.statusGroup === "5xx").length}
            </div>
            <div className="text-xs mt-1 opacity-70">500, 502, 503 Outages</div>
          </div>

          <div
            onClick={() => setActiveFilter("error")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeFilter === "error"
                ? "bg-slate-700 text-white border-slate-700 shadow-md"
                : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Failed / DNS</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {results.filter((r) => r.statusGroup === "error").length}
            </div>
            <div className="text-xs mt-1 opacity-70">Timeouts & Dead DNS</div>
          </div>
        </div>
      )}

      {/* Results Table Section */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Table Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search URL, status, server, title..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Quick Export & Copy Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={exportToCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={exportToJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={copyBrokenUrls}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="Copy only 4xx and 5xx broken URLs"
              >
                {copiedKey === "broken" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Broken (4xx/5xx)</span>
              </button>

              <button
                onClick={copyRedirectedUrls}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                title="Copy 301/302 redirect pairs"
              >
                {copiedKey === "redirected" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Redirects (3xx)</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Original URL</th>
                  <th className="py-3 px-3.5 min-w-[130px]">Status Code</th>
                  <th className="py-3 px-3.5 min-w-[100px] text-center">Hops</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Final Destination</th>
                  <th className="py-3 px-3.5 min-w-[90px]">Latency</th>
                  <th className="py-3 px-3.5 min-w-[110px]">Server</th>
                  <th className="py-3 px-3.5 min-w-[140px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-normal">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No URLs match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item) => (
                    <tr
                      key={item.index}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-3 px-3.5 text-center text-xs text-slate-400 font-mono">
                        {item.index}
                      </td>

                      {/* Original URL */}
                      <td className="py-3 px-3.5 font-mono text-xs">
                        <div className="flex items-center gap-1.5 max-w-sm">
                          <span
                            className="truncate text-slate-900 font-medium"
                            title={item.originalUrl}
                          >
                            {item.originalUrl}
                          </span>
                        </div>
                      </td>

                      {/* Status Code Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getStatusBadge(item.statusCode, item.statusGroup, item.statusText)}
                      </td>

                      {/* Hops */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {item.redirectCount > 0 ? (
                          <button
                            onClick={() => setInspectItem(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                            title="Click to view full redirect chain hops"
                          >
                            <span>{item.redirectCount} {item.redirectCount === 1 ? "Hop" : "Hops"}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">0 hops</span>
                        )}
                      </td>

                      {/* Final Destination */}
                      <td className="py-3 px-3.5 font-mono text-xs">
                        <div className="flex items-center gap-1.5 max-w-xs">
                          {item.isRedirect && (
                            <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.isRedirect ? "text-amber-900 font-medium" : "text-slate-600"
                            }`}
                            title={item.finalUrl}
                          >
                            {item.finalUrl}
                          </span>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`font-mono font-medium ${
                            item.responseTimeMs < 250
                              ? "text-emerald-700"
                              : item.responseTimeMs < 800
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {item.responseTimeMs} ms
                        </span>
                      </td>

                      {/* Server */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-xs text-slate-600">
                        <span className="truncate block max-w-[110px]" title={item.server}>
                          {item.server !== "-" ? item.server : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setInspectItem(item)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                            title="Inspect full headers & redirect timeline"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>

                          <a
                            href={item.finalUrl || item.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => copyToClipboard(item.finalUrl || item.originalUrl, `row-${item.index}`)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy final URL"
                          >
                            {copiedKey === `row-${item.index}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect URL Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    URL Audit Inspector #{inspectItem.index}
                  </span>
                  {getStatusBadge(
                    inspectItem.statusCode,
                    inspectItem.statusGroup,
                    inspectItem.statusText
                  )}
                </div>
                <h3 className="font-mono text-sm font-semibold text-slate-900 break-all">
                  {inspectItem.originalUrl}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Redirect Timeline */}
              {inspectItem.redirectChain && inspectItem.redirectChain.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Redirect Chain Journey ({inspectItem.redirectChain.length} Hops)</span>
                  </h4>

                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {inspectItem.redirectChain.map((hop, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 pl-8">
                        <div
                          className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                            hop.statusCode >= 200 && hop.statusCode < 300
                              ? "border-emerald-500"
                              : hop.statusCode >= 300 && hop.statusCode < 400
                              ? "border-amber-500"
                              : "border-rose-500"
                          }`}
                        />
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 w-full space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                              Hop {hop.hop}: {hop.statusCode} {hop.statusText}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {hop.responseTimeMs} ms
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-800 break-all">
                            {hop.url}
                          </div>
                          {hop.location && (
                            <div className="text-xs text-amber-700 flex items-center gap-1 mt-1 pt-1 border-t border-slate-200">
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-mono break-all">Next: {hop.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEO & Meta Signals */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>On-Page SEO Signals</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold block">Page Title</span>
                    <span className="text-slate-900 font-medium">
                      {inspectItem.title || "No <title> tag found"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold block">Canonical Tag</span>
                    <span className="text-slate-900 font-mono break-all">
                      {inspectItem.canonical || "Not specified"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold block">Robots Directive</span>
                    <span
                      className={`font-semibold ${
                        (inspectItem.metaRobots || "").includes("noindex")
                          ? "text-rose-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {inspectItem.metaRobots || "None (Default: Index, Follow)"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold block">Web Server</span>
                    <span className="text-slate-900 font-mono">
                      {inspectItem.server !== "-" ? inspectItem.server : "Hidden / Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full HTTP Response Headers */}
              {inspectItem.headers && Object.keys(inspectItem.headers).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-600" />
                      <span>Full HTTP Response Headers ({Object.keys(inspectItem.headers).length})</span>
                    </h4>

                    <button
                      onClick={() => {
                        const rawText = Object.entries(inspectItem.headers)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("\n");
                        copyToClipboard(rawText, "modal-headers");
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      {copiedKey === "modal-headers" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy All Headers</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-xs font-mono">
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(inspectItem.headers).map(([k, v], idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-500 font-semibold w-1/3 bg-slate-50/50">
                              {k}
                            </td>
                            <td className="py-2 px-3 text-slate-800 break-all">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <a
                href={inspectItem.finalUrl || inspectItem.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit URL in Browser</span>
              </a>

              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational SEO Knowledge Base Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>HTTP Status Codes & Redirect SEO Master Guide</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2xx Success</span>
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>200 OK:</strong> The request succeeded and the content is live. Search engines
              can crawl, render, and index this document without obstacles.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-amber-600" />
              <span>3xx Redirects</span>
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>301 (Permanent):</strong> Passes 95-99% link equity. <strong>302 (Temporary):</strong>{" "}
              Does not pass canonical credit. Avoid long redirect chains (&gt;2 hops) to prevent crawl budget waste.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <span className="font-bold text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>4xx Client Errors</span>
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>404 Not Found / 410 Gone:</strong> Broken URLs that waste crawl budget and frustrate visitors.
              Redirect high-backlink 404 pages to relevant live destinations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
            <span className="font-bold text-purple-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <span>5xx Server Errors</span>
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>500 / 502 / 503:</strong> The server failed to deliver the page. If persistent, Google will
              temporarily or permanently drop the URL from SERP indices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
