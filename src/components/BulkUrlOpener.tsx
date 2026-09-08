import React, { useState, useRef, useEffect } from "react";
import { UrlPingResult } from "../types";
import { downloadFile } from "../utils/seoHelpers";
import { calculateUrlPingFallback } from "../utils/seoFallbackEngine";
import {
  ExternalLink,
  Play,
  Square,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  Activity,
  Info,
} from "lucide-react";

export const BulkUrlOpener: React.FC = () => {
  const [urlsInput, setUrlsInput] = useState<string>(
    `https://google.com
https://youtube.com
https://wikipedia.org
https://github.com
https://reddit.com`
  );

  const [delayMs, setDelayMs] = useState<number>(800);
  const [isOpenRunning, setIsOpenRunning] = useState<boolean>(false);
  const [openedCount, setOpenedCount] = useState<number>(0);
  const [totalToOpen, setTotalToOpen] = useState<number>(0);
  const [popupBlockedWarning, setPopupBlockedWarning] = useState<boolean>(false);

  // Ping Checker States
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResults, setPingResults] = useState<UrlPingResult[]>([]);
  const [, setPingError] = useState<string | null>(null);
  const [pingFilter, setPingFilter] = useState<"all" | "success" | "redirects" | "errors">("all");

  const abortControllerRef = useRef<boolean>(false);

  const urlList = React.useMemo(() => {
    return urlsInput
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
  }, [urlsInput]);

  // Clean stop when unmounted
  useEffect(() => {
    return () => {
      abortControllerRef.current = true;
    };
  }, []);

  const handleOpenBulk = async () => {
    if (urlList.length === 0) return;
    setIsOpenRunning(true);
    setPopupBlockedWarning(false);
    abortControllerRef.current = false;
    setTotalToOpen(urlList.length);
    setOpenedCount(0);

    let count = 0;
    for (let i = 0; i < urlList.length; i++) {
      if (abortControllerRef.current) break;

      const url = urlList[i];
      const win = window.open(url, "_blank", "noopener,noreferrer");

      // Check if browser blocked popups
      if (!win || win.closed || typeof win.closed === "undefined") {
        setPopupBlockedWarning(true);
      }

      count++;
      setOpenedCount(count);

      if (i < urlList.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setIsOpenRunning(false);
  };

  const handleStopOpen = () => {
    abortControllerRef.current = true;
    setIsOpenRunning(false);
  };

  // Test single popup
  const handleTestPopup = () => {
    const test = window.open("https://example.com", "_blank");
    if (!test || test.closed || typeof test.closed === "undefined") {
      setPopupBlockedWarning(true);
    } else {
      setPopupBlockedWarning(false);
      setTimeout(() => test.close(), 1000);
    }
  };

  const handlePingUrls = async () => {
    if (urlList.length === 0) return;
    setIsPinging(true);
    setPingError(null);
    try {
      let data: any = null;
      try {
        const response = await fetch("/api/seo/ping-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: urlList }),
        });
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        // Fallback endpoint
        const response2 = await fetch("/api/ping-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: urlList }),
        });
        if (response2.ok) {
          data = await response2.json();
        }
      }

      const list = data?.data || data?.results;
      if (Array.isArray(list) && list.length > 0) {
        setPingResults(list);
        return;
      }
      // Graceful fallback for static hosting
      setPingResults(calculateUrlPingFallback(urlList));
    } catch {
      // Graceful fallback for offline / static hosting
      setPingResults(calculateUrlPingFallback(urlList));
    } finally {
      setIsPinging(false);
    }
  };

  const filteredPingResults = React.useMemo(() => {
    if (pingFilter === "success") return pingResults.filter((r) => r.alive && !r.isRedirect && !(r.statusCode >= 300 && r.statusCode < 400));
    if (pingFilter === "redirects") return pingResults.filter((r) => r.isRedirect || (r.statusCode >= 300 && r.statusCode < 400) || r.finalUrl !== r.url);
    if (pingFilter === "errors") return pingResults.filter((r) => !r.alive);
    return pingResults;
  }, [pingResults, pingFilter]);

  const exportPingCsv = () => {
    if (pingResults.length === 0) return;
    const headers = ["Original URL", "Final URL", "Is Redirect", "Status Code", "Status Text", "SSL Secure", "Response Time (ms)", "Status"];
    const rows = pingResults.map((r) => [
      `"${r.url}"`,
      `"${r.finalUrl}"`,
      r.isRedirect || r.finalUrl !== r.url ? "YES" : "NO",
      r.statusCode,
      `"${r.statusText}"`,
      r.isSecure ? "HTTPS" : "HTTP",
      r.responseTimeMs,
      r.alive ? "ALIVE" : "UNREACHABLE",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csvContent, `url-status-report-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EBF5FF] text-[#0984E3]">
              <ExternalLink className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#2D3436]">
              Bulk URL Opener &amp; Status Inspector
            </h2>
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Open multiple URLs in new browser tabs simultaneously with customizable delay throttling and live HTTP verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setUrlsInput(
                "https://www.google.com\nhttps://www.bing.com\nhttps://www.wikipedia.org\nhttps://www.reddit.com\nhttps://news.ycombinator.com"
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] border border-[#DFE4EA] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Sample URLs
          </button>
          <button
            onClick={() => setUrlsInput("")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Pop-up Notice Banner if blocked */}
      {popupBlockedWarning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <div className="font-bold">Pop-up Blocker Detected!</div>
            <p className="mt-0.5">
              Your browser blocked some new tabs. To open bulk URLs smoothly: Look at the right side of your address bar for the pop-up icon, click it, and select <strong>&quot;Always allow pop-ups and redirects for this site&quot;</strong>, then click Open again.
            </p>
          </div>
        </div>
      )}

      {/* Main Opener Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: URLs Input */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#636E72] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0984E3]"></span>
              Paste Bulk URLs to Open ({urlList.length} ready)
            </label>
            <span className="text-[11px] text-[#B2BEC3]">One URL per line</span>
          </div>
          <textarea
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            rows={8}
            placeholder="https://example.com/page1&#10;https://example.com/page2"
            className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
          />
        </div>

        {/* Right: Throttling & Action Settings */}
        <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold text-[#636E72] uppercase tracking-wider mb-3">
              Opening Configuration
            </div>

            {/* Delay Selector */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs text-[#636E72] font-medium flex items-center justify-between">
                <span>Delay Between Tabs</span>
                <span className="text-[#0984E3] font-bold">{delayMs}ms</span>
              </label>
              <select
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="w-full p-2 text-xs border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
              >
                <option value={0}>No Delay (Open Immediately)</option>
                <option value={300}>300ms (Fast)</option>
                <option value={800}>800ms (Recommended to avoid popup blocks)</option>
                <option value={1500}>1.5 Seconds (Safe)</option>
                <option value={3000}>3 Seconds (Gentle)</option>
              </select>
              <p className="text-[10px] text-[#B2BEC3]">
                A 500ms-1s delay prevents browser CPU spikes and pop-up blocking.
              </p>
            </div>

            {/* Test popup button */}
            <button
              onClick={handleTestPopup}
              className="text-xs text-[#636E72] hover:text-[#0984E3] flex items-center gap-1.5 underline"
            >
              <Info className="w-3.5 h-3.5" />
              Test if browser allows pop-ups
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#E9ECEF]">
            {!isOpenRunning ? (
              <button
                id="btn-open-bulk"
                onClick={handleOpenBulk}
                disabled={urlList.length === 0}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0773C5] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open {urlList.length} URLs in Tabs</span>
              </button>
            ) : (
              <button
                id="btn-stop-open"
                onClick={handleStopOpen}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Opening ({openedCount}/{totalToOpen})</span>
              </button>
            )}

            <button
              id="btn-ping-status"
              onClick={handlePingUrls}
              disabled={isPinging || urlList.length === 0}
              className="w-full py-2 px-4 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors border border-[#DFE4EA]"
            >
              <Activity className="w-3.5 h-3.5 text-[#0984E3]" />
              <span>{isPinging ? "Checking HTTP Status..." : "Verify HTTP Status Codes First"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar when running */}
      {isOpenRunning && (
        <div className="bg-[#EBF5FF] p-4 rounded-xl border border-[#0984E3]/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#0984E3]">
            <span>Opening tabs in browser...</span>
            <span>
              {openedCount} of {totalToOpen} Opened (
              {Math.round((openedCount / (totalToOpen || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0984E3] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(openedCount / (totalToOpen || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Live HTTP Status Checker Results Table */}
      {pingResults.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#2D3436] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-[#0984E3]" />
                Live URL Response Inspection ({pingResults.length} Checked)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPingFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    pingFilter === "all" ? "bg-[#2D3436] text-white" : "bg-[#F1F2F6] text-[#636E72]"
                  }`}
                >
                  All ({pingResults.length})
                </button>
                <button
                  onClick={() => setPingFilter("success")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    pingFilter === "success" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  Alive ({pingResults.filter((p) => p.alive && !p.isRedirect && !(p.statusCode >= 300 && p.statusCode < 400)).length})
                </button>
                <button
                  onClick={() => setPingFilter("redirects")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    pingFilter === "redirects" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  Redirects ({pingResults.filter((p) => p.isRedirect || (p.statusCode >= 300 && p.statusCode < 400) || p.finalUrl !== p.url).length})
                </button>
                <button
                  onClick={() => setPingFilter("errors")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    pingFilter === "errors" ? "bg-red-600 text-white" : "bg-red-50 text-red-800"
                  }`}
                >
                  Dead/Errors ({pingResults.filter((p) => !p.alive).length})
                </button>
              </div>
            </div>

            <button
              onClick={exportPingCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0984E3] text-white hover:bg-[#0773C5] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-[#B2BEC3] font-bold uppercase sticky top-0 border-b border-[#E9ECEF]">
                <tr>
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status Code</th>
                  <th className="py-2.5 px-3 w-24 text-center">Security</th>
                  <th className="py-2.5 px-3 w-28 text-center">Response Time</th>
                  <th className="py-2.5 px-3 w-20 text-center">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] font-mono">
                {filteredPingResults.map((res, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <div className="font-sans font-medium text-[#2D3436] truncate max-w-md">
                        {res.url}
                      </div>
                      {res.finalUrl !== res.url && (
                        <div className="text-[10px] text-[#0984E3] truncate max-w-md">
                          Redirects to: {res.finalUrl}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          res.isRedirect || (res.statusCode >= 300 && res.statusCode < 400)
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : res.statusCode >= 200 && res.statusCode < 300
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {res.isRedirect && res.statusCode < 300 ? "301" : res.statusCode || "Error"} {res.statusText}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {res.isSecure ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> HTTPS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" /> HTTP
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-[#636E72]">
                      {res.responseTimeMs}ms
                    </td>
                    <td className="py-2 px-3 text-center">
                      <a
                        href={res.finalUrl || res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-100 text-[#0984E3]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
