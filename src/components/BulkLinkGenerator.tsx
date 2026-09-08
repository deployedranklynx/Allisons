import React, { useState, useMemo } from "react";
import { LinkGeneratorOptions, GeneratedLink } from "../types";
import { generateLinks, downloadFile, copyTextToClipboard } from "../utils/seoHelpers";
import {
  Copy,
  Download,
  Check,
  Sparkles,
  RotateCcw,
  Settings2,
  FileCode,
  Layers,
  FileSpreadsheet,
  Search,
} from "lucide-react";

export const BulkLinkGenerator: React.FC = () => {
  const [urlsInput, setUrlsInput] = useState<string>(
    "https://example.com/seo-guide\nhttps://example.com/backlink-building\nhttps://example.com/keyword-research\nhttps://example.com/rank-tracker"
  );
  const [keywordsInput, setKeywordsInput] = useState<string>(
    "best seo guide\nquality backlink building\nadvanced keyword research\nlive serp rank tracker"
  );

  const [options, setOptions] = useState<LinkGeneratorOptions>({
    pairingMode: "one-to-one",
    targetBlank: true,
    relAttributes: {
      dofollow: true,
      nofollow: false,
      sponsored: false,
      ugc: false,
      noreferrer: true,
    },
    caseFormat: "title",
    autoHttps: true,
    prefix: "",
    suffix: "",
  });

  const [activeOutputView, setActiveOutputView] = useState<"all" | "html" | "bbcode" | "markdown">("all");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>("");

  const urlList = useMemo(() => {
    return urlsInput.split(/\r?\n/).map((u) => u.trim()).filter(Boolean);
  }, [urlsInput]);

  const keywordList = useMemo(() => {
    return keywordsInput.split(/\r?\n/).map((k) => k.trim()).filter(Boolean);
  }, [keywordsInput]);

  const generatedLinks = useMemo<GeneratedLink[]>(() => {
    return generateLinks(urlList, keywordList, options);
  }, [urlList, keywordList, options]);

  const filteredLinks = useMemo(() => {
    if (!tableSearch.trim()) return generatedLinks;
    const query = tableSearch.toLowerCase();
    return generatedLinks.filter(
      (l) =>
        l.url.toLowerCase().includes(query) ||
        l.keyword.toLowerCase().includes(query) ||
        l.html.toLowerCase().includes(query)
    );
  }, [generatedLinks, tableSearch]);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2200);
    }
  };

  const loadSampleData = () => {
    setUrlsInput(
      "https://digitalmarketing.org/seo-tools\nhttps://searchengineland.com/seo-basics\nhttps://ahrefs.com/blog/link-building\nhttps://moz.com/learn/seo/domain-authority\nhttps://semrush.com/blog/keyword-difficulty"
    );
    setKeywordsInput(
      "free seo tools list\nseo basics for beginners\nlink building strategies 2026\ncheck domain authority score\nkeyword difficulty guide"
    );
  };

  const clearAll = () => {
    setUrlsInput("");
    setKeywordsInput("");
  };

  // Bulk texts for each format
  const allHtmlText = useMemo(() => generatedLinks.map((l) => l.html).join("\n"), [generatedLinks]);
  const allBBCodeText = useMemo(() => generatedLinks.map((l) => l.bbcode).join("\n"), [generatedLinks]);
  const allMarkdownText = useMemo(() => generatedLinks.map((l) => l.markdown).join("\n"), [generatedLinks]);

  // Combined CSV text
  const exportCsv = () => {
    if (generatedLinks.length === 0) return;
    const headers = ["Index", "URL", "Anchor Text", "HTML Link", "BBCode Link", "Markdown Link"];
    const rows = generatedLinks.map((l, i) => [
      i + 1,
      `"${l.url.replace(/"/g, '""')}"`,
      `"${l.keyword.replace(/"/g, '""')}"`,
      `"${l.html.replace(/"/g, '""')}"`,
      `"${l.bbcode.replace(/"/g, '""')}"`,
      `"${l.markdown.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csvContent, `bulk-hyperlinks-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Actions */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#EBF5FF] text-[#0984E3]">
              <FileCode className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#2D3436]">
              Bulk 3-in-1 Hyperlink Generator
            </h2>
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Generate <strong>HTML</strong>, <strong>BBCode</strong>, and <strong>Markdown</strong> anchor links simultaneously with automated casing & attributes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-sample-links"
            onClick={loadSampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#2D3436] bg-[#F1F2F6] hover:bg-[#E4E7EB] border border-[#DFE4EA] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
            Load Sample Data
          </button>
          <button
            id="btn-clear-links"
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Input Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* URLs Input */}
        <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="input-urls" className="text-xs font-bold text-[#636E72] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0984E3]"></span>
              Target URLs (One per line)
            </label>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#EBF5FF] text-[#0984E3] font-semibold">
              {urlList.length} URLs
            </span>
          </div>
          <textarea
            id="input-urls"
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            placeholder="https://example.com/page-1&#10;https://example.com/page-2"
            rows={7}
            className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0984E3] focus:border-[#0984E3] bg-white text-[#2D3436] resize-y"
          />
          <div className="flex justify-between items-center mt-2 text-[11px] text-[#636E72]">
            <span>Auto-detects domains & formats</span>
            <button
              onClick={() => handleCopy(urlsInput, "URLs Copied")}
              className="text-[#0984E3] hover:underline font-medium"
            >
              Copy Raw URLs
            </button>
          </div>
        </div>

        {/* Keywords Input */}
        <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="input-keywords" className="text-xs font-bold text-[#636E72] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Keywords (Anchor Text)
            </label>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              {keywordList.length} Keywords
            </span>
          </div>
          <textarea
            id="input-keywords"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            placeholder="best seo services&#10;affordable backlinks&#10;rank tracking software"
            rows={7}
            className="w-full text-xs font-mono p-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0984E3] focus:border-[#0984E3] bg-white text-[#2D3436] resize-y"
          />
          <div className="flex justify-between items-center mt-2 text-[11px] text-[#636E72]">
            <span>Pairs with URLs automatically</span>
            <button
              onClick={() => handleCopy(keywordsInput, "Keywords Copied")}
              className="text-[#0984E3] hover:underline font-medium"
            >
              Copy Raw Keywords
            </button>
          </div>
        </div>
      </div>

      {/* Formatting & Configuration Bar */}
      <div className="bg-white rounded-xl p-5 border border-[#E9ECEF] shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9ECEF] text-xs font-bold text-[#636E72] uppercase tracking-wider">
          <Settings2 className="w-4 h-4 text-[#0984E3]" />
          <span>Anchor Text & Link Formatting Options</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Pairing Mode */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Pairing Mode</label>
            <select
              value={options.pairingMode}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, pairingMode: e.target.value as any }))
              }
              className="w-full p-2 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            >
              <option value="one-to-one">1-to-1 Row Match (URL 1 to KW 1)</option>
              <option value="all-combinations">All Combinations (Every URL to every KW)</option>
              <option value="tab-separated">Dual Column (URL, KW on same line)</option>
            </select>
          </div>

          {/* Anchor Text Capitalization */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Anchor Text Case</label>
            <select
              value={options.caseFormat}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, caseFormat: e.target.value as any }))
              }
              className="w-full p-2 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            >
              <option value="title">Title Case (e.g. Best Seo Guide)</option>
              <option value="lowercase">lowercase (e.g. best seo guide)</option>
              <option value="uppercase">UPPERCASE (e.g. BEST SEO GUIDE)</option>
              <option value="capitalize-first">Capitalize first letter only</option>
              <option value="original">Keep Original Input Case</option>
            </select>
          </div>

          {/* Target Attribute */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Link Target</label>
            <label className="flex items-center gap-2 p-2 border border-[#E9ECEF] rounded-lg bg-white cursor-pointer hover:bg-gray-50 text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.targetBlank}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, targetBlank: e.target.checked }))
                }
                className="rounded text-[#0984E3]"
              />
              <span>Open in new tab (target=&quot;_blank&quot;)</span>
            </label>
          </div>

          {/* Auto HTTPS Prefix */}
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Protocol Handling</label>
            <label className="flex items-center gap-2 p-2 border border-[#E9ECEF] rounded-lg bg-white cursor-pointer hover:bg-gray-50 text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.autoHttps}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, autoHttps: e.target.checked }))
                }
                className="rounded text-[#0984E3]"
              />
              <span>Auto-prepend https://</span>
            </label>
          </div>
        </div>

        {/* Rel Attributes */}
        <div className="pt-2 border-t border-[#E9ECEF]">
          <div className="text-xs text-[#636E72] font-medium mb-2">Rel Attributes (SEO Link Type):</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.relAttributes.dofollow}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    relAttributes: { ...prev.relAttributes, dofollow: e.target.checked },
                  }))
                }
                className="rounded text-[#0984E3]"
              />
              <span className="font-semibold text-emerald-600">dofollow</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.relAttributes.nofollow}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    relAttributes: { ...prev.relAttributes, nofollow: e.target.checked },
                  }))
                }
                className="rounded text-[#0984E3]"
              />
              <span>nofollow</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.relAttributes.sponsored}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    relAttributes: { ...prev.relAttributes, sponsored: e.target.checked },
                  }))
                }
                className="rounded text-[#0984E3]"
              />
              <span>sponsored</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#2D3436]">
              <input
                type="checkbox"
                checked={options.relAttributes.ugc}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    relAttributes: { ...prev.relAttributes, ugc: e.target.checked },
                  }))
                }
                className="rounded text-[#0984E3]"
              />
              <span>ugc</span>
            </label>
          </div>
        </div>

        {/* Prefix / Suffix row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E9ECEF] text-xs">
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Link Prefix (Optional, e.g. &lt;li&gt; or - )</label>
            <input
              type="text"
              value={options.prefix}
              onChange={(e) => setOptions((prev) => ({ ...prev, prefix: e.target.value }))}
              placeholder="e.g. <li> or - "
              className="w-full p-2 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            />
          </div>
          <div>
            <label className="block text-[#636E72] font-medium mb-1">Link Suffix (Optional, e.g. &lt;/li&gt;)</label>
            <input
              type="text"
              value={options.suffix}
              onChange={(e) => setOptions((prev) => ({ ...prev, suffix: e.target.value }))}
              placeholder="e.g. </li>"
              className="w-full p-2 border border-[#E9ECEF] rounded-lg bg-white text-[#2D3436] focus:ring-1 focus:ring-[#0984E3]"
            />
          </div>
        </div>
      </div>

      {/* Output Results Section matching Clean Minimalism */}
      <div className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm flex flex-col overflow-hidden">
        {/* Header Tabs & Export buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E9ECEF]">
          <div className="flex overflow-x-auto no-scrollbar">
            <button
              id="view-tab-all"
              onClick={() => setActiveOutputView("all")}
              className={`px-6 py-3.5 text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeOutputView === "all"
                  ? "border-b-2 border-[#0984E3] text-[#0984E3]"
                  : "text-[#636E72] hover:text-[#2D3436]"
              }`}
            >
              <span>3-in-1 Combined View</span>
              <span className="px-1.5 py-0.2 bg-[#EBF5FF] text-[#0984E3] text-[10px] rounded-full font-bold">
                {generatedLinks.length}
              </span>
            </button>

            <button
              id="view-tab-html"
              onClick={() => setActiveOutputView("html")}
              className={`px-6 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeOutputView === "html"
                  ? "border-b-2 border-[#0984E3] text-[#0984E3] font-semibold"
                  : "text-[#636E72] hover:text-[#2D3436]"
              }`}
            >
              HTML Code
            </button>

            <button
              id="view-tab-bbcode"
              onClick={() => setActiveOutputView("bbcode")}
              className={`px-6 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeOutputView === "bbcode"
                  ? "border-b-2 border-[#0984E3] text-[#0984E3] font-semibold"
                  : "text-[#636E72] hover:text-[#2D3436]"
              }`}
            >
              BBCode
            </button>

            <button
              id="view-tab-markdown"
              onClick={() => setActiveOutputView("markdown")}
              className={`px-6 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeOutputView === "markdown"
                  ? "border-b-2 border-[#0984E3] text-[#0984E3] font-semibold"
                  : "text-[#636E72] hover:text-[#2D3436]"
              }`}
            >
              Markdown
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-3">
            {copyFeedback && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                {copyFeedback}
              </span>
            )}

            <button
              id="btn-copy-html"
              onClick={() => handleCopy(allHtmlText, "All HTML Copied!")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F1F2F6] hover:bg-[#E4E7EB] text-[#2D3436] border border-[#DFE4EA] transition-colors"
            >
              Copy HTML
            </button>

            <button
              id="btn-copy-bbcode"
              onClick={() => handleCopy(allBBCodeText, "All BBCode Copied!")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F1F2F6] hover:bg-[#E4E7EB] text-[#2D3436] border border-[#DFE4EA] transition-colors"
            >
              Copy BBCode
            </button>

            <button
              id="btn-copy-markdown"
              onClick={() => handleCopy(allMarkdownText, "All Markdown Copied!")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F1F2F6] hover:bg-[#E4E7EB] text-[#2D3436] border border-[#DFE4EA] transition-colors"
            >
              Copy Markdown
            </button>

            <button
              id="btn-download-csv"
              onClick={exportCsv}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#0984E3] hover:bg-[#0773C5] text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeOutputView === "all" ? (
          <div>
            {/* Filter Search inside generated table */}
            <div className="p-3 bg-white border-b border-[#E9ECEF] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#B2BEC3]" />
                <input
                  type="text"
                  placeholder="Filter links or keywords..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0984E3] bg-white text-[#2D3436]"
                />
              </div>
              <span className="text-xs text-[#636E72]">
                Showing <strong>{filteredLinks.length}</strong> of {generatedLinks.length} generated links
              </span>
            </div>

            {/* Combined Table View */}
            <div className="overflow-x-auto max-h-[460px] bg-gray-50/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-xs text-[#B2BEC3] uppercase font-bold sticky top-0 z-10 border-b border-[#E9ECEF]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 w-44">Anchor Text</th>
                    <th className="py-3 px-3">Target URL</th>
                    <th className="py-3 px-3 w-64">HTML Link</th>
                    <th className="py-3 px-3 w-56">BBCode Link</th>
                    <th className="py-3 px-3 w-56">Markdown Link</th>
                    <th className="py-3 px-3 text-right w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {filteredLinks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#636E72] font-sans">
                        No links to display. Paste URLs &amp; Keywords above to generate links.
                      </td>
                    </tr>
                  ) : (
                    filteredLinks.map((link, idx) => (
                      <tr key={link.id} className="hover:bg-white transition-colors">
                        <td className="py-3 px-3 text-center text-[#B2BEC3] font-sans text-xs">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-[#2D3436]">
                          {link.keyword}
                        </td>
                        <td className="py-3 px-3 text-[#0984E3] truncate max-w-xs">
                          <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                            {link.url}
                          </a>
                        </td>
                        <td className="py-3 px-3 text-[#0984E3] font-mono text-xs truncate max-w-xs">
                          {link.html}
                        </td>
                        <td className="py-3 px-3 text-purple-700 font-mono text-xs truncate max-w-xs">
                          {link.bbcode}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 font-mono text-xs truncate max-w-xs">
                          {link.markdown}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              title="Copy HTML"
                              onClick={() => handleCopy(link.html, "HTML Copied")}
                              className="text-[#0984E3] hover:underline text-xs font-medium"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Metrics Summary bar matching Design HTML */}
            <div className="p-4 border-t border-[#E9ECEF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <div className="flex gap-4 items-center">
                <span className="text-xs text-[#636E72] font-medium">Metrics Status:</span>
                <div className="flex gap-2">
                  <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-bold">
                    MOZ DA: Ready
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">
                    Ahrefs DR: Ready
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold">
                    KD: Active
                  </span>
                </div>
              </div>
              <div className="text-xs text-[#B2BEC3] font-medium">
                Total Processed: {generatedLinks.length} URLs
              </div>
            </div>
          </div>
        ) : (
          /* Single Format Code Box View */
          <div className="p-5 space-y-3 bg-[#F8F9FA]">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#2D3436]">
                Bulk{" "}
                {activeOutputView === "html"
                  ? "HTML Code"
                  : activeOutputView === "bbcode"
                  ? "BBCode"
                  : "Markdown"}{" "}
                Output ({generatedLinks.length} links)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(
                      activeOutputView === "html"
                        ? allHtmlText
                        : activeOutputView === "bbcode"
                        ? allBBCodeText
                        : allMarkdownText,
                      "Copied to clipboard!"
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0984E3] text-white hover:bg-[#0773C5]"
                >
                  Copy All
                </button>
                <button
                  onClick={() =>
                    downloadFile(
                      activeOutputView === "html"
                        ? allHtmlText
                        : activeOutputView === "bbcode"
                        ? allBBCodeText
                        : allMarkdownText,
                      `links-${activeOutputView}-${Date.now()}.${
                        activeOutputView === "html"
                          ? "html"
                          : activeOutputView === "bbcode"
                          ? "txt"
                          : "md"
                      }`,
                      "text/plain"
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#2D3436] hover:bg-gray-50 border border-[#E9ECEF]"
                >
                  Download
                </button>
              </div>
            </div>

            <textarea
              readOnly
              rows={12}
              value={
                activeOutputView === "html"
                  ? allHtmlText
                  : activeOutputView === "bbcode"
                  ? allBBCodeText
                  : allMarkdownText
              }
              className="w-full p-4 bg-white text-[#2D3436] font-mono text-xs rounded-xl border border-[#E9ECEF] focus:outline-none focus:ring-1 focus:ring-[#0984E3]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
