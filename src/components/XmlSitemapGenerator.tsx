import React, { useState, useMemo } from "react";
import { AdItem, SitemapUrlEntry } from "../types";
import { AdBanner } from "./AdBanner";
import {
  FileCode,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Globe,
  Sliders,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  UploadCloud,
  ExternalLink,
} from "lucide-react";

interface XmlSitemapGeneratorProps {
  ads?: AdItem[];
}

const PRESET_TEMPLATES = [
  {
    name: "SaaS & Web App",
    description: "Marketing landing, pricing, features, integrations, blog, legal",
    paths: [
      { path: "/", priority: "1.0", changefreq: "daily" as const },
      { path: "/features", priority: "0.9", changefreq: "weekly" as const },
      { path: "/pricing", priority: "0.9", changefreq: "weekly" as const },
      { path: "/integrations", priority: "0.8", changefreq: "weekly" as const },
      { path: "/blog", priority: "0.8", changefreq: "daily" as const },
      { path: "/about", priority: "0.6", changefreq: "monthly" as const },
      { path: "/contact", priority: "0.6", changefreq: "monthly" as const },
      { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" as const },
      { path: "/terms-of-use", priority: "0.3", changefreq: "yearly" as const },
    ],
  },
  {
    name: "E-Commerce Store",
    description: "Storefront, product collections, bestsellers, deals, support",
    paths: [
      { path: "/", priority: "1.0", changefreq: "daily" as const },
      { path: "/shop", priority: "0.9", changefreq: "daily" as const },
      { path: "/collections/best-sellers", priority: "0.9", changefreq: "daily" as const },
      { path: "/collections/new-arrivals", priority: "0.8", changefreq: "daily" as const },
      { path: "/deals", priority: "0.8", changefreq: "daily" as const },
      { path: "/about-us", priority: "0.5", changefreq: "monthly" as const },
      { path: "/shipping-returns", priority: "0.4", changefreq: "monthly" as const },
      { path: "/faq", priority: "0.5", changefreq: "monthly" as const },
      { path: "/contact", priority: "0.5", changefreq: "monthly" as const },
    ],
  },
  {
    name: "Editorial & Blog",
    description: "Publication homepage, topical categories, trending articles, archive",
    paths: [
      { path: "/", priority: "1.0", changefreq: "always" as const },
      { path: "/news", priority: "0.9", changefreq: "hourly" as const },
      { path: "/articles", priority: "0.8", changefreq: "daily" as const },
      { path: "/guides", priority: "0.8", changefreq: "weekly" as const },
      { path: "/categories/seo", priority: "0.7", changefreq: "weekly" as const },
      { path: "/authors", priority: "0.5", changefreq: "monthly" as const },
      { path: "/newsletter", priority: "0.6", changefreq: "monthly" as const },
      { path: "/about", priority: "0.5", changefreq: "monthly" as const },
    ],
  },
  {
    name: "Local Business / Agency",
    description: "Agency services, case studies, client reviews, booking quote",
    paths: [
      { path: "/", priority: "1.0", changefreq: "weekly" as const },
      { path: "/services", priority: "0.9", changefreq: "weekly" as const },
      { path: "/portfolio", priority: "0.8", changefreq: "weekly" as const },
      { path: "/case-studies", priority: "0.8", changefreq: "monthly" as const },
      { path: "/testimonials", priority: "0.7", changefreq: "monthly" as const },
      { path: "/get-a-quote", priority: "0.9", changefreq: "weekly" as const },
      { path: "/about", priority: "0.6", changefreq: "monthly" as const },
      { path: "/contact", priority: "0.7", changefreq: "monthly" as const },
    ],
  },
];

const TODAY = new Date().toISOString().split("T")[0];

export const XmlSitemapGenerator: React.FC<XmlSitemapGeneratorProps> = ({ ads = [] }) => {
  const [baseUrl, setBaseUrl] = useState<string>("https://ranklynx.com");
  const [entries, setEntries] = useState<SitemapUrlEntry[]>([
    {
      id: "entry-1",
      loc: "/",
      lastmod: TODAY,
      changefreq: "daily",
      priority: "1.0",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-2",
      loc: "/link-generator",
      lastmod: TODAY,
      changefreq: "weekly",
      priority: "0.9",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-3",
      loc: "/meta-tag-analyzer",
      lastmod: TODAY,
      changefreq: "weekly",
      priority: "0.9",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-4",
      loc: "/qr-code-generator",
      lastmod: TODAY,
      changefreq: "weekly",
      priority: "0.8",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-5",
      loc: "/invoice-generator",
      lastmod: TODAY,
      changefreq: "weekly",
      priority: "0.8",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-6",
      loc: "/blog",
      lastmod: TODAY,
      changefreq: "daily",
      priority: "0.8",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
    {
      id: "entry-7",
      loc: "/about",
      lastmod: TODAY,
      changefreq: "monthly",
      priority: "0.6",
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    },
  ]);

  // Bulk path textarea input mode
  const [bulkInputMode, setBulkInputMode] = useState<boolean>(false);
  const [bulkPathsText, setBulkPathsText] = useState<string>("");

  // Single path quick add form
  const [newPath, setNewPath] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("0.8");
  const [newChangefreq, setNewChangefreq] = useState<"always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never">("weekly");
  const [newLastmod, setNewLastmod] = useState<string>(TODAY);

  // Global settings
  const [globalIncludeLastmod, setGlobalIncludeLastmod] = useState<boolean>(true);
  const [globalIncludeChangefreq, setGlobalIncludeChangefreq] = useState<boolean>(true);
  const [globalIncludePriority, setGlobalIncludePriority] = useState<boolean>(true);

  // Feedback
  const [copiedXml, setCopiedXml] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Format base URL
  const cleanBaseUrl = useMemo(() => {
    let clean = baseUrl.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    return clean.replace(/\/+$/, "");
  }, [baseUrl]);

  // Generate XML Document String
  const generatedXml = useMemo(() => {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    entries.forEach((entry) => {
      let pathPart = entry.loc.trim();
      if (!pathPart.startsWith("/")) {
        pathPart = "/" + pathPart;
      }
      if (pathPart === "/" && cleanBaseUrl) {
        pathPart = "";
      }

      const fullUrl = cleanBaseUrl + pathPart;

      lines.push("  <url>");
      lines.push(`    <loc>${fullUrl}</loc>`);

      if (globalIncludeLastmod && entry.includeLastmod && entry.lastmod) {
        lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      if (globalIncludeChangefreq && entry.includeChangefreq && entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (globalIncludePriority && entry.includePriority && entry.priority) {
        lines.push(`    <priority>${entry.priority}</priority>`);
      }

      lines.push("  </url>");
    });

    lines.push("</urlset>");
    return lines.join("\n");
  }, [cleanBaseUrl, entries, globalIncludeLastmod, globalIncludeChangefreq, globalIncludePriority]);

  // Add a single entry
  const handleAddEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPath.trim()) return;

    let pathFormatted = newPath.trim();
    if (!pathFormatted.startsWith("/")) {
      pathFormatted = "/" + pathFormatted;
    }

    const newEntry: SitemapUrlEntry = {
      id: "entry-" + Date.now(),
      loc: pathFormatted,
      lastmod: newLastmod || TODAY,
      changefreq: newChangefreq,
      priority: newPriority,
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    };

    setEntries((prev) => [...prev, newEntry]);
    setNewPath("");
  };

  // Remove an entry
  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Bulk parse and append paths
  const handleBulkAdd = () => {
    if (!bulkPathsText.trim()) return;
    const lines = bulkPathsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const newEntries: SitemapUrlEntry[] = lines.map((line, idx) => {
      let pathClean = line;
      // Strip base URL if user pasted full URLs
      try {
        if (line.startsWith("http")) {
          const parsed = new URL(line);
          pathClean = parsed.pathname + parsed.search;
        }
      } catch {}

      if (!pathClean.startsWith("/")) {
        pathClean = "/" + pathClean;
      }

      const isHome = pathClean === "/";
      return {
        id: `bulk-${Date.now()}-${idx}`,
        loc: pathClean,
        lastmod: TODAY,
        changefreq: isHome ? "daily" : "weekly",
        priority: isHome ? "1.0" : "0.8",
        includeLastmod: true,
        includeChangefreq: true,
        includePriority: true,
      };
    });

    setEntries((prev) => [...prev, ...newEntries]);
    setBulkPathsText("");
    setBulkInputMode(false);
  };

  // Apply a preset template
  const handleApplyPreset = (template: typeof PRESET_TEMPLATES[0]) => {
    const templatedEntries: SitemapUrlEntry[] = template.paths.map((p, idx) => ({
      id: `preset-${Date.now()}-${idx}`,
      loc: p.path,
      lastmod: TODAY,
      changefreq: p.changefreq,
      priority: p.priority,
      includeLastmod: true,
      includeChangefreq: true,
      includePriority: true,
    }));

    setEntries(templatedEntries);
  };

  // Download sitemap.xml file
  const handleDownload = () => {
    const blob = new Blob([generatedXml], { type: "application/xml;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // Calculate file size in KB
  const xmlFileSizeKb = (new Blob([generatedXml]).size / 1024).toFixed(2);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Tool Header */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E9ECEF] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0984E3] uppercase tracking-wider">
                XML Protocol 0.9
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                Google & Bing Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D3436] mt-2">
              Free XML Sitemap Generator
            </h1>
            <p className="text-sm text-[#636E72] mt-1 max-w-2xl">
              Create clean, standard-compliant XML sitemaps for Google Search Console and Bing Webmaster Tools. Customize priority, changefreq, lastmod, preview code live, and download your free <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-mono">sitemap.xml</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-sm font-semibold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download sitemap.xml</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#2D3436] text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedXml ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedXml ? "Copied!" : "Copy XML"}</span>
            </button>
          </div>
        </div>

        {/* Website Base URL & Quick Presets */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-[#2D3436] uppercase tracking-wider mb-2">
              Your Primary Website Base URL (Protocol + Domain)
            </label>
            <div className="relative">
              <Globe className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#2D3436] placeholder-gray-400 focus:outline-none focus:border-[#0984E3] focus:bg-white transition-all font-mono font-medium"
              />
            </div>
            <p className="text-[11px] text-[#636E72] mt-1.5">
              Target canonical prefix: <span className="font-mono text-blue-600 font-semibold">{cleanBaseUrl}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D3436] uppercase tracking-wider mb-2">
              Quick Industry Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => handleApplyPreset(tmpl)}
                  className="p-2 text-left rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-xs text-[#2D3436] hover:text-[#0984E3] transition-all cursor-pointer font-medium"
                  title={tmpl.description}
                >
                  <div className="font-semibold truncate">{tmpl.name}</div>
                  <div className="text-[10px] text-[#636E72] truncate">{tmpl.paths.length} pages</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Builder & Live Preview Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: URL List & Page Configuration (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#E9ECEF] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#2D3436]">Sitemap Pages & Paths</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {entries.length} URLs
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkInputMode(!bulkInputMode)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#475569] transition-colors cursor-pointer"
                >
                  {bulkInputMode ? "Single URL Mode" : "Bulk Paste URLs"}
                </button>
                <button
                  onClick={() => setEntries([])}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Bulk Mode Form */}
            {bulkInputMode ? (
              <div className="pt-4 space-y-3">
                <label className="block text-xs font-semibold text-[#475569]">
                  Paste multiple page paths or URLs (one per line):
                </label>
                <textarea
                  value={bulkPathsText}
                  onChange={(e) => setBulkPathsText(e.target.value)}
                  placeholder={`/about\n/services\n/pricing\n/blog/latest-seo-guide\n/contact`}
                  rows={6}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setBulkInputMode(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    className="px-4 py-2 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold"
                  >
                    Add All URLs
                  </button>
                </div>
              </div>
            ) : (
              /* Single URL Add Bar */
              <form onSubmit={handleAddEntry} className="pt-4 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/my-new-page"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-[#2D3436] focus:outline-none focus:border-[#0984E3] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#2D3436] font-medium"
                    title="Priority"
                  >
                    <option value="1.0">1.0 (Highest)</option>
                    <option value="0.9">0.9</option>
                    <option value="0.8">0.8 (Normal)</option>
                    <option value="0.7">0.7</option>
                    <option value="0.6">0.6</option>
                    <option value="0.5">0.5</option>
                    <option value="0.3">0.3 (Low)</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={newChangefreq}
                    onChange={(e) => setNewChangefreq(e.target.value as any)}
                    className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#2D3436] font-medium"
                    title="Change Frequency"
                  >
                    <option value="always">always</option>
                    <option value="hourly">hourly</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>
            )}

            {/* Entries List Table */}
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-sans font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Path / Location</th>
                    <th className="p-2.5">Priority</th>
                    <th className="p-2.5">Frequency</th>
                    <th className="p-2.5">Lastmod</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 font-sans">
                        No pages added yet. Add a URL or choose a preset template above.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-2.5 font-bold text-[#0F172A] truncate max-w-[200px]">
                          {entry.loc}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={entry.priority}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEntries((prev) =>
                                prev.map((item) => (item.id === entry.id ? { ...item, priority: val } : item))
                              );
                            }}
                            className="bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-xs text-blue-700 font-bold"
                          >
                            <option value="1.0">1.0</option>
                            <option value="0.9">0.9</option>
                            <option value="0.8">0.8</option>
                            <option value="0.7">0.7</option>
                            <option value="0.6">0.6</option>
                            <option value="0.5">0.5</option>
                            <option value="0.3">0.3</option>
                            <option value="0.1">0.1</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={entry.changefreq}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setEntries((prev) =>
                                prev.map((item) => (item.id === entry.id ? { ...item, changefreq: val } : item))
                              );
                            }}
                            className="bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700"
                          >
                            <option value="always">always</option>
                            <option value="hourly">hourly</option>
                            <option value="daily">daily</option>
                            <option value="weekly">weekly</option>
                            <option value="monthly">monthly</option>
                            <option value="yearly">yearly</option>
                            <option value="never">never</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-gray-500 text-[11px]">
                          <input
                            type="date"
                            value={entry.lastmod}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEntries((prev) =>
                                prev.map((item) => (item.id === entry.id ? { ...item, lastmod: val } : item))
                              );
                            }}
                            className="bg-transparent text-[11px] text-gray-600 border border-gray-200 rounded px-1 py-0.5"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove URL"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Global XML Tag Inclusions Toggles */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#475569]">
              <span className="text-[#64748B]">Optional Tags:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalIncludeLastmod}
                  onChange={(e) => setGlobalIncludeLastmod(e.target.checked)}
                  className="rounded text-[#0984E3]"
                />
                <span>Include &lt;lastmod&gt;</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalIncludeChangefreq}
                  onChange={(e) => setGlobalIncludeChangefreq(e.target.checked)}
                  className="rounded text-[#0984E3]"
                />
                <span>Include &lt;changefreq&gt;</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalIncludePriority}
                  onChange={(e) => setGlobalIncludePriority(e.target.checked)}
                  className="rounded text-[#0984E3]"
                />
                <span>Include &lt;priority&gt;</span>
              </label>
            </div>
          </div>

          {/* Sitemap Stats Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E9ECEF] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-[#0984E3]">{entries.length}</div>
              <div className="text-[11px] font-semibold text-[#636E72] uppercase mt-0.5">Total URLs</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-emerald-600">{xmlFileSizeKb} KB</div>
              <div className="text-[11px] font-semibold text-[#636E72] uppercase mt-0.5">File Size</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">
                {entries.filter((e) => Number(e.priority) >= 0.8).length}
              </div>
              <div className="text-[11px] font-semibold text-[#636E72] uppercase mt-0.5">High Priority</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">100%</div>
              <div className="text-[11px] font-semibold text-[#636E72] uppercase mt-0.5">Valid Syntax</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live XML Syntax Viewer (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#0F172A] rounded-xl border border-gray-800 shadow-md overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Syntax Viewer Top Toolbar */}
            <div className="px-4 py-3 bg-[#1E293B] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs font-mono text-gray-300 ml-2 font-bold">sitemap.xml</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* XML Code Content */}
            <div className="p-4 flex-1 overflow-auto max-h-[580px] font-mono text-xs leading-relaxed text-emerald-400 selection:bg-blue-800 selection:text-white">
              <pre className="whitespace-pre">{generatedXml}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* In-tool Sponsor / Ad Banner */}
      <AdBanner placement="tool_banner" ads={ads} />

      {/* Educational Guide Section */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E9ECEF] shadow-xs">
        <h3 className="text-lg font-bold text-[#2D3436] mb-3">
          How to Submit Your XML Sitemap to Google Search Console & Bing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#636E72] leading-relaxed">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-sm text-[#2D3436] mb-2 flex items-center gap-1.5">
              <span>1️⃣</span> Upload to Server Root
            </h4>
            <p>
              Download your generated <code className="bg-white px-1 rounded font-mono">sitemap.xml</code> and place it inside your public web server root folder so it is accessible at <code className="bg-white px-1 rounded font-mono">https://yourdomain.com/sitemap.xml</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-sm text-[#2D3436] mb-2 flex items-center gap-1.5">
              <span>2️⃣</span> Declare in robots.txt
            </h4>
            <p>
              Add the following directive to the very bottom of your <code className="bg-white px-1 rounded font-mono">robots.txt</code> file:
              <br />
              <code className="text-blue-600 block mt-1 font-mono font-bold bg-white p-1 rounded">Sitemap: https://yourdomain.com/sitemap.xml</code>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-sm text-[#2D3436] mb-2 flex items-center gap-1.5">
              <span>3️⃣</span> Submit to Search Console
            </h4>
            <p>
              Open <strong>Google Search Console</strong>, navigate to <em>Indexing &gt; Sitemaps</em>, enter <code>sitemap.xml</code> into the submission input, and click <strong>Submit</strong>. Googlebot will schedule crawling.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h4 className="text-sm font-bold text-[#2D3436] mb-4">Frequently Asked Questions</h4>
          <div className="space-y-3">
            {[
              {
                q: "What is an XML Sitemap and why is it important?",
                a: "An XML sitemap is a structured roadmap file that lists all critical canonical URLs on your website. It allows search engines like Google and Bing to discover, crawl, and index your pages much faster, particularly new articles and deep nested pages.",
              },
              {
                q: "What is the maximum URL limit for a standard sitemap.xml file?",
                a: "According to the official sitemaps.org protocol, a single sitemap file can contain up to 50,000 URLs and must not exceed 50 MB in uncompressed size. Larger sites use a Sitemap Index file to link multiple child sitemaps.",
              },
              {
                q: "Do search engines strictly follow the <priority> tag?",
                a: "Google treats the priority tag as a relative hint rather than an absolute rule. Priority tells crawlers which pages on your own website you consider most important relative to other pages on your domain.",
              },
              {
                q: "Is this XML Sitemap Generator free?",
                a: "Yes! RankLynx XML Sitemap Generator is 100% free with unlimited URLs, multiple industry presets, live XML preview, and instant sitemap.xml downloads.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-[#2D3436] hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openFaq === idx && (
                  <div className="p-3.5 bg-gray-50/50 border-t border-gray-100 text-xs text-[#636E72] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
