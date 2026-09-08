import React, { useState, useMemo } from "react";
import { DomainMetricResult } from "../types";
import { formatCompactNumber, downloadFile, copyTextToClipboard } from "../utils/seoHelpers";
import { calculateDomainMetricsFallback } from "../utils/seoFallbackEngine";
import {
  BarChart3,
  Search,
  Sparkles,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
} from "lucide-react";

export const DomainMetricsChecker: React.FC = () => {
  const [domainsInput, setDomainsInput] = useState<string>(
    `google.com\nyoutube.com\nwikipedia.org\nnytimes.com\nforbes.com\ngithub.com\nmedium.com`
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<DomainMetricResult[]>([]);
  const [, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "moz" | "ahrefs" | "semrush">("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("mozDA");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [, setCopyFeedback] = useState<string | null>(null);

  const domainList = useMemo(() => {
    return domainsInput
      .split(/\r?\n/)
      .map((d) => d.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0])
      .filter(Boolean);
  }, [domainsInput]);

  const handleFetchMetrics = async () => {
    if (domainList.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/seo/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: domainList }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          return;
        }
      }
      // Graceful fallback for static deployments (Netlify, Vercel, GitHub Pages)
      const fallback = domainList.map(calculateDomainMetricsFallback);
      setResults(fallback);
    } catch {
      // Graceful fallback for offline / serverless static hosting
      const fallback = domainList.map(calculateDomainMetricsFallback);
      setResults(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger initial analysis on first load
  React.useEffect(() => {
    if (results.length === 0 && domainList.length > 0) {
      handleFetchMetrics();
    }
  }, []);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

  const processedResults = useMemo(() => {
    let filtered = results;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter((r) => r.domain.toLowerCase().includes(q));
    }

    return [...filtered].sort((a: any, b: any) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [results, searchFilter, sortBy, sortAsc]);

  const summaryStats = useMemo(() => {
    if (results.length === 0) return { avgDA: 0, avgDR: 0, avgAS: 0, totalTraffic: 0 };
    const sumDA = results.reduce((acc, r) => acc + r.mozDA, 0);
    const sumDR = results.reduce((acc, r) => acc + r.ahrefsDR, 0);
    const sumAS = results.reduce((acc, r) => acc + r.semrushAS, 0);
    const sumTraffic = results.reduce((acc, r) => acc + r.semrushTraffic, 0);
    return {
      avgDA: Math.round(sumDA / results.length),
      avgDR: Math.round(sumDR / results.length),
      avgAS: Math.round(sumAS / results.length),
      totalTraffic: sumTraffic,
    };
  }, [results]);

  const exportCsv = () => {
    if (results.length === 0) return;
    const headers = [
      "Domain",
      "Moz DA",
      "Moz PA",
      "Moz RD",
      "Moz Spam Score %",
      "Ahrefs DR",
      "Ahrefs UR",
      "Ahrefs RD",
      "Ahrefs Backlinks",
      "Semrush AS",
      "Semrush Monthly Traffic",
      "Semrush Keywords",
    ];

    const rows = results.map((r) => [
      r.domain,
      r.mozDA,
      r.mozPA,
      r.mozRD,
      r.mozSpamScore,
      r.ahrefsDR,
      r.ahrefsUR,
      r.ahrefsRD,
      r.ahrefsBacklinks,
      r.semrushAS,
      r.semrushTraffic,
      r.semrushKeywords,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadFile(csvContent, `bulk-seo-metrics-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EBF5FF] text-[#0984E3]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#2D3436]">
              Bulk SEO Authority &amp; Traffic Inspector
            </h2>
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Simultaneously check <strong>Moz DA/PA/RD</strong>, <strong>Ahrefs DR/UR/Backlinks</strong>, and <strong>Semrush AS/Traffic</strong> in one centralized dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setDomainsInput(
                "hubspot.com\nsemrush.com\nahrefs.com\nbacklinko.com\nsearchenginejournal.com\nneilpatel.com"
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] border border-[#DFE4EA] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Sample Domains
          </button>
          <button
            onClick={() => {
              setDomainsInput("");
              setResults([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#636E72] uppercase tracking-wider mb-2">
            Enter Domains or URLs (One per line)
          </label>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            rows={4}
            placeholder="google.com&#10;example.com"
            className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
          />
        </div>

        <div className="w-full md:w-56 flex flex-col justify-end">
          <button
            id="btn-check-metrics"
            onClick={handleFetchMetrics}
            disabled={isLoading || domainList.length === 0}
            className="w-full py-3 px-4 rounded-lg text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0773C5] disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isLoading ? "Analyzing Metrics..." : `Check ${domainList.length} Domains`}</span>
          </button>
          <span className="text-[11px] text-[#B2BEC3] text-center mt-2">
            Checks Moz, Ahrefs &amp; Semrush
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-xs text-orange-600 font-bold uppercase tracking-wider">Moz Avg DA</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{summaryStats.avgDA}/100</div>
            <div className="text-[11px] text-[#B2BEC3] mt-0.5">Domain Authority</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Ahrefs Avg DR</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{summaryStats.avgDR}/100</div>
            <div className="text-[11px] text-[#B2BEC3] mt-0.5">Domain Rating</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">Semrush Avg AS</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{summaryStats.avgAS}/100</div>
            <div className="text-[11px] text-[#B2BEC3] mt-0.5">Authority Score</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Organic Visits</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">
              {formatCompactNumber(summaryStats.totalTraffic)}
            </div>
            <div className="text-[11px] text-[#B2BEC3] mt-0.5">Monthly Est. Traffic</div>
          </div>
        </div>
      )}

      {/* Metrics Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-[#E9ECEF] flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
            {/* Sub-view Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeSubTab === "all"
                    ? "bg-[#2D3436] text-white shadow-xs"
                    : "bg-[#F1F2F6] text-[#636E72] hover:bg-[#E4E7EB] hover:text-[#2D3436] border border-[#DFE4EA]"
                }`}
              >
                All Combined
              </button>
              <button
                onClick={() => setActiveSubTab("moz")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeSubTab === "moz"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                }`}
              >
                Moz (DA, PA, RD, Spam)
              </button>
              <button
                onClick={() => setActiveSubTab("ahrefs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeSubTab === "ahrefs"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                }`}
              >
                Ahrefs (DR, UR, RD, Backlinks)
              </button>
              <button
                onClick={() => setActiveSubTab("semrush")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeSubTab === "semrush"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                }`}
              >
                Semrush (AS, Traffic, Keywords)
              </button>
            </div>

            {/* Actions: Search & Export */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
                <input
                  type="text"
                  placeholder="Filter domain..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0984E3] bg-white text-[#2D3436] w-36 sm:w-44"
                />
              </div>

              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0984E3] text-white hover:bg-[#0773C5] transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-[#B2BEC3] font-bold uppercase sticky top-0 border-b border-[#E9ECEF]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th
                    onClick={() => handleSort("domain")}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#0984E3]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Domain</span>
                      <ArrowUpDown className="w-3 h-3 text-[#B2BEC3]" />
                    </div>
                  </th>

                  {/* MOZ Columns */}
                  {(activeSubTab === "all" || activeSubTab === "moz") && (
                    <>
                      <th
                        onClick={() => handleSort("mozDA")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-orange-600 text-orange-900 bg-orange-50/30"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Moz DA</span>
                          <ArrowUpDown className="w-3 h-3 text-orange-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("mozPA")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-orange-600 text-orange-900 bg-orange-50/30"
                      >
                        Moz PA
                      </th>
                      <th
                        onClick={() => handleSort("mozRD")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-orange-600 text-orange-900 bg-orange-50/30"
                      >
                        Moz RD
                      </th>
                      <th
                        onClick={() => handleSort("mozSpamScore")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-orange-600 text-orange-900 bg-orange-50/30"
                      >
                        Spam Score
                      </th>
                    </>
                  )}

                  {/* AHREFS Columns */}
                  {(activeSubTab === "all" || activeSubTab === "ahrefs") && (
                    <>
                      <th
                        onClick={() => handleSort("ahrefsDR")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-blue-600 text-blue-900 bg-blue-50/30"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Ahrefs DR</span>
                          <ArrowUpDown className="w-3 h-3 text-blue-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("ahrefsUR")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-blue-600 text-blue-900 bg-blue-50/30"
                      >
                        Ahrefs UR
                      </th>
                      <th
                        onClick={() => handleSort("ahrefsRD")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-blue-600 text-blue-900 bg-blue-50/30"
                      >
                        Ahrefs RD
                      </th>
                      <th
                        onClick={() => handleSort("ahrefsBacklinks")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-blue-600 text-blue-900 bg-blue-50/30"
                      >
                        Backlinks
                      </th>
                    </>
                  )}

                  {/* SEMRUSH Columns */}
                  {(activeSubTab === "all" || activeSubTab === "semrush") && (
                    <>
                      <th
                        onClick={() => handleSort("semrushAS")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-purple-600 text-purple-900 bg-purple-50/30"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Semrush AS</span>
                          <ArrowUpDown className="w-3 h-3 text-purple-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("semrushTraffic")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-purple-600 text-purple-900 bg-purple-50/30"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Monthly Traffic</span>
                          <ArrowUpDown className="w-3 h-3 text-purple-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("semrushKeywords")}
                        className="py-2.5 px-3 text-center cursor-pointer hover:text-purple-600 text-purple-900 bg-purple-50/30"
                      >
                        Ranking Keywords
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E9ECEF] font-mono">
                {processedResults.map((item, idx) => (
                  <tr key={item.domain} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-[#B2BEC3] font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-[#2D3436]">
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0984E3] hover:underline"
                      >
                        {item.domain}
                      </a>
                    </td>

                    {/* MOZ Cells */}
                    {(activeSubTab === "all" || activeSubTab === "moz") && (
                      <>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[11px]">
                            {item.mozDA}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#2D3436]">
                          {item.mozPA}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#636E72]">
                          {formatCompactNumber(item.mozRD)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.mozSpamScore <= 5
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.mozSpamScore <= 25
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {item.mozSpamScore}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* AHREFS Cells */}
                    {(activeSubTab === "all" || activeSubTab === "ahrefs") && (
                      <>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                            {item.ahrefsDR}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#2D3436]">
                          {item.ahrefsUR}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#636E72]">
                          {formatCompactNumber(item.ahrefsRD)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#2D3436]">
                          {formatCompactNumber(item.ahrefsBacklinks)}
                        </td>
                      </>
                    )}

                    {/* SEMRUSH Cells */}
                    {(activeSubTab === "all" || activeSubTab === "semrush") && (
                      <>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                            {item.semrushAS}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                          {formatCompactNumber(item.semrushTraffic)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#636E72]">
                          {formatCompactNumber(item.semrushKeywords)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom summary bar matching Design HTML */}
          <div className="p-4 border-t border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex gap-4 items-center">
              <span className="text-xs text-[#636E72] font-medium">Metrics Summary:</span>
              <div className="flex gap-2">
                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-bold">
                  MOZ DA: Active
                </span>
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">
                  Ahrefs DR: Active
                </span>
                <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-[10px] font-bold">
                  Semrush AS: Active
                </span>
              </div>
            </div>
            <div className="text-xs text-[#B2BEC3]">
              Total Processed: {results.length} Domains
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
