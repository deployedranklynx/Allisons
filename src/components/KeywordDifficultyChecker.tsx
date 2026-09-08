import React, { useState, useMemo } from "react";
import { KeywordDifficultyResult } from "../types";
import { formatCompactNumber, downloadFile } from "../utils/seoHelpers";
import { calculateKeywordDifficultyFallback } from "../utils/seoFallbackEngine";
import {
  Search,
  Sparkles,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";

export const KeywordDifficultyChecker: React.FC = () => {
  const [keywordsInput, setKeywordsInput] = useState<string>(
    `best seo tools
free backlink checker
keyword rank tracker online
buy high da guest posts
how to do keyword research
technical seo audit checklist`
  );

  const [targetCountry, setTargetCountry] = useState<string>("United States");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<KeywordDifficultyResult[]>([]);
  const [, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("difficulty");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const keywordList = useMemo(() => {
    return keywordsInput
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywordsInput]);

  const handleCheckDifficulty = async () => {
    if (keywordList.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/seo/keyword-difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywordList, country: targetCountry }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          return;
        }
      }
      // Graceful fallback for static hosting
      const fallback = keywordList.map((kw) => calculateKeywordDifficultyFallback(kw, targetCountry));
      setResults(fallback);
    } catch {
      // Graceful fallback for offline / static hosting
      const fallback = keywordList.map((kw) => calculateKeywordDifficultyFallback(kw, targetCountry));
      setResults(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (results.length === 0 && keywordList.length > 0) {
      handleCheckDifficulty();
    }
  }, []);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  const processedResults = useMemo(() => {
    let filtered = results;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.keyword.toLowerCase().includes(q) ||
          r.intent.toLowerCase().includes(q) ||
          r.difficultyLabel.toLowerCase().includes(q)
      );
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

  const exportCsv = () => {
    if (results.length === 0) return;
    const headers = [
      "Keyword",
      "Country",
      "Difficulty (0-100)",
      "Difficulty Level",
      "Search Volume",
      "CPC (USD)",
      "Intent",
      "Required Backlinks (Est.)",
      "SERP Features",
      "Strategy Summary",
    ];

    const rows = results.map((r) => [
      `"${r.keyword.replace(/"/g, '""')}"`,
      r.country,
      r.difficulty,
      r.difficultyLabel,
      r.searchVolume,
      r.cpc,
      r.intent,
      r.requiredBacklinks,
      `"${r.serpFeatures.join(", ")}"`,
      `"${r.analysisSummary.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadFile(csvContent, `keyword-difficulty-report-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EBF5FF] text-[#0984E3]">
              <Search className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#2D3436]">
              Bulk Keyword Difficulty &amp; Search Intent Checker
            </h2>
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Calculate <strong>Keyword Difficulty (KD 0-100)</strong>, <strong>Monthly Volume</strong>, <strong>CPC</strong>, <strong>Search Intent</strong>, and estimated backlinks needed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setKeywordsInput(
                "ecommerce seo tips\nhow to increase website traffic\nbest crm software for small business\naffiliate marketing guide 2026\nrank tracker tool"
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] border border-[#DFE4EA] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Sample Keywords
          </button>
          <button
            onClick={() => {
              setKeywordsInput("");
              setResults([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#636E72] uppercase tracking-wider mb-2">
            Keywords to Analyze ({keywordList.length} total)
          </label>
          <textarea
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            rows={4}
            placeholder="best seo services&#10;affordable backlinks"
            className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3] focus:outline-none"
          />
        </div>

        <div className="w-full md:w-64 flex flex-col justify-between space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#636E72] mb-1">
              Target Country / Database
            </label>
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
            </select>
          </div>

          <button
            id="btn-check-kd"
            onClick={handleCheckDifficulty}
            disabled={isLoading || keywordList.length === 0}
            className="w-full py-3 px-4 rounded-lg text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0773C5] disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? "Calculating KD Metrics..." : `Check ${keywordList.length} Keywords`}</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm overflow-hidden">
          {/* Header Actions */}
          <div className="p-4 border-b border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#2D3436] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-[#0984E3]" />
                Keyword Metrics Breakdown ({results.length} Keywords)
              </span>
              <span className="text-[11px] text-[#636E72] bg-[#F1F2F6] px-2 py-0.5 rounded">
                Country: {targetCountry}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
                <input
                  type="text"
                  placeholder="Filter keyword / intent..."
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
                  <th
                    onClick={() => handleSort("keyword")}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#0984E3]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Keyword</span>
                      <ArrowUpDown className="w-3 h-3 text-[#B2BEC3]" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("difficulty")}
                    className="py-2.5 px-3 w-36 text-center cursor-pointer hover:text-[#0984E3]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Keyword Difficulty</span>
                      <ArrowUpDown className="w-3 h-3 text-[#B2BEC3]" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("searchVolume")}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-[#0984E3] w-28"
                  >
                    Volume
                  </th>
                  <th
                    onClick={() => handleSort("cpc")}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-[#0984E3] w-24"
                  >
                    Est. CPC
                  </th>
                  <th className="py-2.5 px-3 text-center w-28">Intent</th>
                  <th className="py-2.5 px-3 text-center w-28">Backlinks Needed</th>
                  <th className="py-2.5 px-3">Ranking Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] font-mono">
                {processedResults.map((item, idx) => (
                  <tr key={item.keyword} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-[#B2BEC3] font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-[#2D3436]">
                      {item.keyword}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.difficulty < 25
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.difficulty < 50
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.difficulty < 75
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {item.difficulty}% • {item.difficultyLabel}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#2D3436]">
                      {formatCompactNumber(item.searchVolume)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">
                      ${item.cpc.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-[#F1F2F6] text-[#2D3436] text-[10px] font-semibold border border-[#DFE4EA]">
                        {item.intent}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#636E72]">
                      <span className="font-bold text-[#2D3436]">{item.requiredBacklinks}</span> RD
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#636E72] text-[11px] max-w-sm">
                      {item.analysisSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
            <div className="flex gap-4 items-center">
              <span className="text-xs text-[#636E72] font-medium">Difficulty Index:</span>
              <div className="flex gap-2">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200">
                  Easy: 0-25
                </span>
                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-bold border border-amber-200">
                  Medium: 26-74
                </span>
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200">
                  Hard: 75-100
                </span>
              </div>
            </div>
            <div className="text-xs text-[#B2BEC3]">
              Analyzed {results.length} Keywords
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
