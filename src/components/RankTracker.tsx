import React, { useState, useEffect, useMemo } from "react";
import { TrackedKeywordItem } from "../types";
import { downloadFile } from "../utils/seoHelpers";
import { calculateRankTrackerFallback } from "../utils/seoFallbackEngine";
import {
  Globe2,
  Search,
  Sparkles,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Monitor,
  Smartphone,
  MapPin,
  RefreshCw,
  Trash2,
} from "lucide-react";

export const RankTracker: React.FC = () => {
  const [targetDomain, setTargetDomain] = useState<string>("shopify.com");
  const [keywordsInput, setKeywordsInput] = useState<string>(
    `ecommerce platform
start online store
sell products online
best ecommerce website builder
dropshipping software`
  );

  const [targetCountry, setTargetCountry] = useState<string>("United States");
  const [targetCity, setTargetCity] = useState<string>("All Cities");
  const [searchEngine, setSearchEngine] = useState<string>("Google");
  const [targetDevice, setTargetDevice] = useState<"Desktop" | "Mobile">("Desktop");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [trackedItems, setTrackedItems] = useState<TrackedKeywordItem[]>([]);
  const [, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Load saved tracking data from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("seo_suite_tracked_keywords");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrackedItems(parsed);
          if (parsed[0].domain) setTargetDomain(parsed[0].domain);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save tracking data to LocalStorage
  useEffect(() => {
    if (trackedItems.length > 0) {
      try {
        localStorage.setItem("seo_suite_tracked_keywords", JSON.stringify(trackedItems));
      } catch {
        // ignore
      }
    }
  }, [trackedItems]);

  const keywordList = useMemo(() => {
    return keywordsInput
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywordsInput]);

  const handleTrackRankings = async () => {
    if (!targetDomain.trim() || keywordList.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/seo/rank-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: targetDomain,
          keywords: keywordList,
          country: targetCountry,
          city: targetCity,
          searchEngine,
          device: targetDevice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const formatted: TrackedKeywordItem[] = data.data.map((item: any, idx: number) => ({
            id: `track-${Date.now()}-${idx}`,
            domain: targetDomain,
            keyword: item.keyword,
            rank: item.rank,
            previousRank: item.previousRank,
            change: item.change,
            searchEngine: item.searchEngine,
            country: item.country,
            city: item.city,
            device: item.device,
            rankingUrl: item.rankingUrl,
            lastUpdated: item.lastUpdated,
          }));

          setTrackedItems(formatted);
          return;
        }
      }

      // Graceful fallback for static hosting
      const fallback = keywordList.map((kw, i) =>
        calculateRankTrackerFallback(targetDomain, kw, searchEngine, targetCountry, targetCity, targetDevice, i)
      );
      setTrackedItems(fallback);
    } catch {
      // Graceful fallback for offline / static hosting
      const fallback = keywordList.map((kw, i) =>
        calculateRankTrackerFallback(targetDomain, kw, searchEngine, targetCountry, targetCity, targetDevice, i)
      );
      setTrackedItems(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (trackedItems.length === 0 && keywordList.length > 0) {
      handleTrackRankings();
    }
  }, []);

  const rankStats = useMemo(() => {
    const top3 = trackedItems.filter((i) => i.rank >= 1 && i.rank <= 3).length;
    const top10 = trackedItems.filter((i) => i.rank >= 4 && i.rank <= 10).length;
    const top30 = trackedItems.filter((i) => i.rank >= 11 && i.rank <= 30).length;
    const top100 = trackedItems.filter((i) => i.rank >= 31 && i.rank <= 100).length;
    const unranked = trackedItems.filter((i) => i.rank > 100).length;
    return { top3, top10, top30, top100, unranked };
  }, [trackedItems]);

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return trackedItems;
    const q = searchFilter.toLowerCase();
    return trackedItems.filter((item) => item.keyword.toLowerCase().includes(q));
  }, [trackedItems, searchFilter]);

  const exportCsv = () => {
    if (trackedItems.length === 0) return;
    const headers = [
      "Domain",
      "Keyword",
      "Current Rank",
      "Previous Rank",
      "Rank Change",
      "Search Engine",
      "Country",
      "City",
      "Device",
      "Ranking URL",
      "Last Updated",
    ];

    const rows = trackedItems.map((item) => [
      `"${item.domain}"`,
      `"${item.keyword.replace(/"/g, '""')}"`,
      item.rank > 100 ? ">100" : item.rank,
      item.previousRank > 100 ? ">100" : item.previousRank,
      item.change,
      item.searchEngine,
      item.country,
      item.city,
      item.device,
      `"${item.rankingUrl}"`,
      item.lastUpdated,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadFile(csvContent, `rank-tracker-report-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  const getSerpQueryUrl = (kw: string) => {
    const encoded = encodeURIComponent(kw);
    if (searchEngine === "Bing") return `https://www.bing.com/search?q=${encoded}`;
    if (searchEngine === "DuckDuckGo") return `https://duckduckgo.com/?q=${encoded}`;
    if (searchEngine === "Yahoo") return `https://search.yahoo.com/search?p=${encoded}`;
    if (searchEngine === "Baidu") return `https://www.baidu.com/s?wd=${encoded}`;
    return `https://www.google.com/search?q=${encoded}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EBF5FF] text-[#0984E3]">
              <Globe2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#2D3436]">
              Worldwide Keyword Rank Tracker
            </h2>
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Track domain rankings targeted across <strong>Any Country</strong>, <strong>City/Local SERP</strong>, and <strong>Search Engine</strong> (Google, Bing, Baidu, DuckDuckGo, Yahoo) on Desktop &amp; Mobile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetDomain("wordpress.org");
              setKeywordsInput(
                "cms software\nblog creation tool\nfree website maker\nplugins repository\nopen source site builder"
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] border border-[#DFE4EA] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Sample Campaign
          </button>
          <button
            onClick={() => {
              setTrackedItems([]);
              localStorage.removeItem("seo_suite_tracked_keywords");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Campaign Configuration Grid */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm space-y-4">
        <div className="text-xs font-bold text-[#636E72] uppercase tracking-wider">
          Target Campaign Settings
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Target Domain */}
          <div className="md:col-span-1">
            <label className="block text-[#636E72] font-medium mb-1">Target Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="e.g. yourdomain.com"
              className="w-full p-2 border border-[#E9ECEF] rounded-lg text-xs font-medium bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
            />
          </div>

          {/* Target Country */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Target Country</label>
            <select
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="w-full p-2 border border-[#E9ECEF] rounded-lg text-xs bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            >
              <option value="United States">🇺🇸 United States</option>
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="Pakistan">🇵🇰 Pakistan</option>
              <option value="India">🇮🇳 India</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Australia">🇦🇺 Australia</option>
              <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
              <option value="Germany">🇩🇪 Germany</option>
              <option value="France">🇫🇷 France</option>
              <option value="Spain">🇪🇸 Spain</option>
              <option value="Italy">🇮🇹 Italy</option>
              <option value="Brazil">🇧🇷 Brazil</option>
              <option value="Japan">🇯🇵 Japan</option>
              <option value="Singapore">🇸🇬 Singapore</option>
              <option value="Turkey">🇹🇷 Turkey</option>
            </select>
          </div>

          {/* Target City */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Target City / Local SERP</label>
            <input
              type="text"
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              placeholder="e.g. New York, London, Lahore..."
              className="w-full p-2 border border-[#E9ECEF] rounded-lg text-xs bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
            />
          </div>

          {/* Search Engine */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Search Engine</label>
            <select
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value)}
              className="w-full p-2 border border-[#E9ECEF] rounded-lg text-xs bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            >
              <option value="Google">Google Search</option>
              <option value="Bing">Microsoft Bing</option>
              <option value="Yahoo">Yahoo Search</option>
              <option value="DuckDuckGo">DuckDuckGo</option>
              <option value="Baidu">Baidu (China)</option>
              <option value="Yandex">Yandex</option>
            </select>
          </div>

          {/* Device */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Device Type</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTargetDevice("Desktop")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                  targetDevice === "Desktop"
                    ? "bg-[#0984E3] text-white border-[#0984E3]"
                    : "bg-[#F1F2F6] text-[#2D3436] border-[#DFE4EA]"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setTargetDevice("Mobile")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                  targetDevice === "Mobile"
                    ? "bg-[#0984E3] text-white border-[#0984E3]"
                    : "bg-[#F1F2F6] text-[#2D3436] border-[#DFE4EA]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>
          </div>
        </div>

        {/* Keywords Input row */}
        <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-[#E9ECEF]">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#636E72] mb-1">
              Keywords to Track for <span className="text-[#0984E3]">{targetDomain}</span> (One per line)
            </label>
            <textarea
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              rows={3}
              placeholder="keyword 1&#10;keyword 2"
              className="w-full text-xs font-mono p-2.5 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
            />
          </div>

          <div className="w-full md:w-56 flex flex-col justify-end">
            <button
              id="btn-track-now"
              onClick={handleTrackRankings}
              disabled={isLoading || !targetDomain || keywordList.length === 0}
              className="w-full py-3 px-4 rounded-lg text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0773C5] disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Checking Rankings..." : "Track & Check Rankings"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Visual Rank Distribution Cards */}
      {trackedItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Top 3 Positions</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{rankStats.top3}</div>
            <div className="text-[10px] text-[#B2BEC3] mt-0.5">Prime SERP Visibility</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Positions 4 - 10</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{rankStats.top10}</div>
            <div className="text-[10px] text-[#B2BEC3] mt-0.5">Page 1 Contenders</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-[11px] font-bold text-[#0984E3] uppercase tracking-wider">Positions 11 - 30</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{rankStats.top30}</div>
            <div className="text-[10px] text-[#B2BEC3] mt-0.5">Striking Distance</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Positions 31 - 100</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{rankStats.top100}</div>
            <div className="text-[10px] text-[#B2BEC3] mt-0.5">In Top 100</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-[11px] font-bold text-[#636E72] uppercase tracking-wider">Unranked (&gt;100)</div>
            <div className="text-2xl font-bold text-[#2D3436] mt-1">{rankStats.unranked}</div>
            <div className="text-[10px] text-[#B2BEC3] mt-0.5">Needs Optimization</div>
          </div>
        </div>
      )}

      {/* Rank Tracking Results Table */}
      {trackedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#2D3436] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#0984E3]" />
                Live Ranking Positions ({trackedItems.length} Keywords)
              </span>
              <span className="text-[11px] text-[#636E72] bg-[#F1F2F6] px-2 py-0.5 rounded">
                Target: {targetDomain} • {targetCountry} ({targetCity})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
                <input
                  type="text"
                  placeholder="Filter keyword..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0984E3] bg-white text-[#2D3436] w-44"
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

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-[#B2BEC3] font-bold uppercase sticky top-0 border-b border-[#E9ECEF]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Keyword</th>
                  <th className="py-2.5 px-3 text-center w-28">Current Rank</th>
                  <th className="py-2.5 px-3 text-center w-24">Change</th>
                  <th className="py-2.5 px-3">Ranking URL</th>
                  <th className="py-2.5 px-3 w-28">Search Engine</th>
                  <th className="py-2.5 px-3 w-32">Location</th>
                  <th className="py-2.5 px-3 text-center w-20">Live SERP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] font-mono">
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-[#B2BEC3] font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-[#2D3436]">
                      {item.keyword}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-bold ${
                          item.rank <= 3
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.rank <= 10
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : item.rank <= 30
                            ? "bg-[#EBF5FF] text-[#0984E3] border border-blue-200"
                            : item.rank <= 100
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-[#F1F2F6] text-[#636E72] border border-[#DFE4EA]"
                        }`}
                      >
                        {item.rank > 100 ? ">100" : `#${item.rank}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {item.change > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-xs">
                          <ArrowUp className="w-3.5 h-3.5" /> +{item.change}
                        </span>
                      ) : item.change < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-red-600 font-bold text-xs">
                          <ArrowDown className="w-3.5 h-3.5" /> {item.change}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[#B2BEC3] text-xs">
                          <Minus className="w-3 h-3" /> 0
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#0984E3] font-sans truncate max-w-xs text-[11px]">
                      {item.rankingUrl !== "-" ? (
                        <a
                          href={item.rankingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {item.rankingUrl}
                        </a>
                      ) : (
                        <span className="text-[#B2BEC3] font-mono">Not in top 100</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#636E72]">
                      {item.searchEngine} ({item.device})
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#636E72] truncate">
                      {item.country} {item.city !== "All Cities" ? `(${item.city})` : ""}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <a
                        href={getSerpQueryUrl(item.keyword)}
                        target="_blank"
                        rel="noreferrer"
                        title={`View live ${item.searchEngine} search results`}
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

          <div className="p-4 border-t border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex gap-4 items-center">
              <span className="text-xs text-[#636E72] font-medium">Rank Engine:</span>
              <span className="bg-[#EBF5FF] text-[#0984E3] px-2 py-1 rounded text-[10px] font-bold">
                {searchEngine} ({targetCountry})
              </span>
            </div>
            <div className="text-xs text-[#B2BEC3]">
              Tracking {trackedItems.length} Keywords for {targetDomain}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
