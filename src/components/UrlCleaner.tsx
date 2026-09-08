import React, { useState, useMemo } from "react";
import { ProtocolCleanerOptions } from "../types";
import {
  removeDuplicateUrls,
  cleanUrlProtocols,
  downloadFile,
  copyTextToClipboard,
} from "../utils/seoHelpers";
import {
  Scissors,
  Copy,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const UrlCleaner: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"duplicate-remover" | "protocol-remover">("duplicate-remover");

  // State for Duplicate Remover
  const [duplicateInput, setDuplicateInput] = useState<string>(
    `https://example.com/blog/seo-guide/
https://example.com/blog/seo-guide
https://EXAMPLE.COM/blog/seo-guide
https://example.com/blog/seo-guide?utm_source=facebook
https://example.com/tools/rank-tracker#pricing
https://example.com/tools/rank-tracker
http://www.example.com/tools/rank-tracker/
https://site.org/backlink-check
https://site.org/backlink-check
https://portal.net/login`
  );

  const [dupeOptions, setDupeOptions] = useState({
    ignoreTrailingSlash: true,
    caseInsensitive: true,
    stripQueryParams: true,
    stripFragments: true,
    normalizeProtocol: true,
  });

  // State for Protocol Cleaner
  const [protocolInput, setProtocolInput] = useState<string>(
    `https://www.google.com/search?q=seo
http://www.wordpress.org/plugins/
https://ahrefs.com:443/keyword-generator/
http://subdomain.moz.com/domain-analysis/
https://www.semrush.com/analytics/overview/
www.bing.com/webmasters/
wikipedia.org/wiki/Search_engine_optimization`
  );

  const [protocolOptions, setProtocolOptions] = useState<ProtocolCleanerOptions>({
    removeProtocol: true,
    removeWww: true,
    removeTrailingSlash: true,
    extractDomainOnly: false,
    removeQueryParams: true,
    removePort: true,
    addProtocolPrefix: "none",
    lowercase: true,
  });

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  // Duplicate calculation
  const dupeResult = useMemo(() => {
    return removeDuplicateUrls(duplicateInput, dupeOptions);
  }, [duplicateInput, dupeOptions]);

  // Protocol calculation
  const rawProtocolUrls = useMemo(() => {
    return protocolInput.split(/\r?\n/).map((u) => u.trim()).filter(Boolean);
  }, [protocolInput]);

  const cleanedProtocolUrls = useMemo(() => {
    return cleanUrlProtocols(rawProtocolUrls, protocolOptions);
  }, [rawProtocolUrls, protocolOptions]);

  const cleanedDuplicatesText = useMemo(() => dupeResult.uniqueUrls.join("\n"), [dupeResult]);
  const removedDuplicatesText = useMemo(() => dupeResult.duplicateUrls.join("\n"), [dupeResult]);
  const cleanedProtocolsText = useMemo(() => cleanedProtocolUrls.join("\n"), [cleanedProtocolUrls]);

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            id="subtab-dupe"
            onClick={() => setActiveSubTab("duplicate-remover")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "duplicate-remover"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F1F2F6] text-[#636E72] hover:bg-[#E4E7EB] hover:text-[#2D3436] border border-[#DFE4EA]"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Duplicate URL Remover in Bulk</span>
          </button>

          <button
            id="subtab-protocol"
            onClick={() => setActiveSubTab("protocol-remover")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "protocol-remover"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F1F2F6] text-[#636E72] hover:bg-[#E4E7EB] hover:text-[#2D3436] border border-[#DFE4EA]"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Https://, Http://, Www. Bulk Remover</span>
          </button>
        </div>

        {copyFeedback && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
            <Check className="w-4 h-4" />
            {copyFeedback}
          </span>
        )}
      </div>

      {/* VIEW 1: DUPLICATE URL REMOVER */}
      {activeSubTab === "duplicate-remover" && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
              <div className="text-xs text-[#636E72] font-medium">Original URLs</div>
              <div className="text-2xl font-bold text-[#2D3436] mt-1">{dupeResult.originalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
              <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Unique Cleaned URLs
              </div>
              <div className="text-2xl font-bold text-[#2D3436] mt-1">{dupeResult.uniqueCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
              <div className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Duplicates Removed
              </div>
              <div className="text-2xl font-bold text-[#2D3436] mt-1">{dupeResult.duplicateCount}</div>
            </div>
          </div>

          {/* Options Card */}
          <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
            <div className="text-xs font-bold text-[#636E72] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#0984E3]" />
              Deduplication Match Rules
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={dupeOptions.ignoreTrailingSlash}
                  onChange={(e) =>
                    setDupeOptions((prev) => ({ ...prev, ignoreTrailingSlash: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Ignore Trailing Slash (/)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={dupeOptions.caseInsensitive}
                  onChange={(e) =>
                    setDupeOptions((prev) => ({ ...prev, caseInsensitive: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Case-Insensitive Match</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={dupeOptions.stripQueryParams}
                  onChange={(e) =>
                    setDupeOptions((prev) => ({ ...prev, stripQueryParams: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Strip URL Query (?utm=)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={dupeOptions.stripFragments}
                  onChange={(e) =>
                    setDupeOptions((prev) => ({ ...prev, stripFragments: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Strip Hash/Fragments (#)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={dupeOptions.normalizeProtocol}
                  onChange={(e) =>
                    setDupeOptions((prev) => ({ ...prev, normalizeProtocol: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Ignore http/https/www</span>
              </label>
            </div>
          </div>

          {/* Dual Textareas: Input vs Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input Box */}
            <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#636E72] uppercase tracking-wider">
                  Input Bulk URLs (One per line)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDuplicateInput(
                        "https://example.com/page1\nhttps://example.com/page1/\nhttps://example.com/page2\nhttp://www.example.com/page2\nhttps://example.com/page3"
                      )
                    }
                    className="text-xs text-[#0984E3] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Sample
                  </button>
                  <button
                    onClick={() => setDuplicateInput("")}
                    className="text-xs text-[#B2BEC3] hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={duplicateInput}
                onChange={(e) => setDuplicateInput(e.target.value)}
                rows={10}
                placeholder="Paste bulk URLs here..."
                className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:outline-none focus:ring-1 focus:ring-[#0984E3] resize-y flex-1"
              />
            </div>

            {/* Output Box */}
            <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#636E72] uppercase tracking-wider">
                  Unique URLs ({dupeResult.uniqueCount})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(cleanedDuplicatesText, "Unique URLs Copied!")}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#F1F2F6] hover:bg-[#E4E7EB] text-[#2D3436] border border-[#DFE4EA] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() =>
                      downloadFile(
                        cleanedDuplicatesText,
                        `unique-urls-${Date.now()}.txt`,
                        "text/plain"
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#0984E3] hover:bg-[#0773C5] text-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={cleanedDuplicatesText}
                rows={10}
                placeholder="Cleaned unique URLs will appear here..."
                className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-gray-50/50 text-[#2D3436] focus:outline-none resize-y flex-1"
              />
            </div>
          </div>

          {/* Collapsible Removed Duplicates Log */}
          {dupeResult.duplicateCount > 0 && (
            <div className="bg-white p-4 rounded-xl border border-[#E9ECEF] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Removed Duplicate Records ({dupeResult.duplicateCount})
                </span>
                <button
                  onClick={() => handleCopy(removedDuplicatesText, "Duplicates Copied!")}
                  className="text-xs text-[#0984E3] hover:underline font-medium"
                >
                  Copy Duplicates List
                </button>
              </div>
              <pre className="text-xs font-mono p-3 bg-gray-50 text-[#636E72] rounded-lg max-h-36 overflow-y-auto border border-[#E9ECEF]">
                {removedDuplicatesText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HTTPS / HTTP / WWW REMOVER */}
      {activeSubTab === "protocol-remover" && (
        <div className="space-y-5">
          {/* Options Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#636E72] uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-[#0984E3]" />
              Protocol Stripping &amp; Domain Normalization Options
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.removeProtocol}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, removeProtocol: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span className="font-semibold text-[#0984E3]">Remove https:// &amp; http://</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.removeWww}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, removeWww: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span className="font-semibold text-[#0984E3]">Remove www.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.removeTrailingSlash}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, removeTrailingSlash: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Remove Trailing Slash (/)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.extractDomainOnly}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, extractDomainOnly: e.target.checked }))
                  }
                  className="rounded text-purple-600"
                />
                <span className="font-semibold text-purple-700">Extract Root Domain Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.removeQueryParams}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, removeQueryParams: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Remove Query (?id=123)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.removePort}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, removePort: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Remove Port (:8080)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#2D3436]">
                <input
                  type="checkbox"
                  checked={protocolOptions.lowercase}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({ ...prev, lowercase: e.target.checked }))
                  }
                  className="rounded text-[#0984E3]"
                />
                <span>Convert to Lowercase</span>
              </label>

              {/* Add Protocol Prefix */}
              <div>
                <label className="block text-[11px] text-[#636E72] font-medium mb-1">
                  Batch Prepend Prefix:
                </label>
                <select
                  value={protocolOptions.addProtocolPrefix}
                  onChange={(e) =>
                    setProtocolOptions((prev) => ({
                      ...prev,
                      addProtocolPrefix: e.target.value as any,
                    }))
                  }
                  className="w-full p-1.5 border border-[#E9ECEF] rounded text-xs bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
                >
                  <option value="none">None (Keep Stripped)</option>
                  <option value="https">Add https://</option>
                  <option value="http">Add http://</option>
                  <option value="https-www">Add https://www.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dual Textareas for Protocol Stripper */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input */}
            <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#636E72] uppercase tracking-wider">
                  Raw URLs / Links ({rawProtocolUrls.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setProtocolInput(
                        "https://www.apple.com/iphone\nhttp://www.google.com/search?q=test\nhttps://developer.mozilla.org/en-US/\nwww.github.com/trending/"
                      )
                    }
                    className="text-xs text-[#0984E3] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Sample
                  </button>
                  <button
                    onClick={() => setProtocolInput("")}
                    className="text-xs text-[#B2BEC3] hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={protocolInput}
                onChange={(e) => setProtocolInput(e.target.value)}
                rows={10}
                placeholder="https://www.example.com/subpage..."
                className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:outline-none focus:ring-1 focus:ring-[#0984E3] resize-y flex-1"
              />
            </div>

            {/* Output */}
            <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#636E72] uppercase tracking-wider">
                  Cleaned Output ({cleanedProtocolUrls.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(cleanedProtocolsText, "Cleaned URLs Copied!")}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#F1F2F6] hover:bg-[#E4E7EB] text-[#2D3436] border border-[#DFE4EA] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() =>
                      downloadFile(
                        cleanedProtocolsText,
                        `cleaned-protocols-${Date.now()}.txt`,
                        "text/plain"
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#0984E3] hover:bg-[#0773C5] text-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={cleanedProtocolsText}
                rows={10}
                placeholder="Cleaned domains will appear here..."
                className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg bg-gray-50/50 text-[#2D3436] focus:outline-none resize-y flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
