import React, { useState, useEffect, useRef } from "react";
import {
  SiteCustomization,
  PageSeoConfig,
  RobotsDirective,
  DEFAULT_PAGE_SEO_CONFIGS,
  DEFAULT_SITE_CUSTOMIZATION,
} from "../types";
import { fetchCloudSiteSettings, saveCloudSiteSettings } from "../lib/cloudAds";
import {
  Search,
  Globe,
  Tag,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  ExternalLink,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Code2,
  Copy,
  Sliders,
  Check,
  Smartphone,
  Monitor,
  Share2,
  HelpCircle,
  Layers,
  Wand2,
} from "lucide-react";

interface AdminSeoManagerProps {
  onSiteSettingsUpdated?: (newSettings: SiteCustomization) => void;
}

const PAGE_LIST: Array<{ id: string; name: string; path: string; icon: string }> = [
  { id: "landing", name: "Platform Overview (Home)", path: "/", icon: "🏠" },
  { id: "link-generator", name: "Hyperlink & Anchor Suite", path: "/#link-generator", icon: "🔗" },
  { id: "bulk-opener", name: "Bulk URL Opener", path: "/#bulk-opener", icon: "🚀" },
  { id: "url-cleaner", name: "Protocol & URL Cleaner", path: "/#url-cleaner", icon: "🧹" },
  { id: "domain-metrics", name: "Domain Metrics Inspector", path: "/#domain-metrics", icon: "📊" },
  { id: "keyword-difficulty", name: "Keyword Difficulty Analyzer", path: "/#keyword-difficulty", icon: "🎯" },
  { id: "rank-tracker", name: "SERP Rank Tracker", path: "/#rank-tracker", icon: "📈" },
  { id: "word-html", name: "Word to HTML & HTML to Word", path: "/#word-html", icon: "📝" },
  { id: "markdown-converter", name: "Rich Text to Markdown Suite", path: "/#markdown-converter", icon: "📑" },
  { id: "pdf-editor", name: "Professional PDF Editor", path: "/#pdf-editor", icon: "📄" },
  { id: "blog", name: "Classique Editorial Blog", path: "/#blog", icon: "✍️" },
];

export const AdminSeoManager: React.FC<AdminSeoManagerProps> = ({
  onSiteSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<SiteCustomization>(DEFAULT_SITE_CUSTOMIZATION);
  const [selectedPageId, setSelectedPageId] = useState<string>("landing");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current site settings on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const cloudData = await fetchCloudSiteSettings();
        if (cloudData) {
          setSettings({
            ...DEFAULT_SITE_CUSTOMIZATION,
            ...cloudData,
            pageSeo: {
              ...DEFAULT_PAGE_SEO_CONFIGS,
              ...(cloudData.pageSeo || {}),
            },
          });
        }
      } catch (err) {
        console.error("Failed to load SEO settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Ensure current selected page config exists
  const currentPageConfig: PageSeoConfig =
    settings.pageSeo?.[selectedPageId] ||
    DEFAULT_PAGE_SEO_CONFIGS[selectedPageId] ||
    DEFAULT_PAGE_SEO_CONFIGS.landing;

  const updateCurrentPageConfig = (updates: Partial<PageSeoConfig>) => {
    setSettings((prev) => {
      const existingMap = prev.pageSeo || DEFAULT_PAGE_SEO_CONFIGS;
      const current = existingMap[selectedPageId] || DEFAULT_PAGE_SEO_CONFIGS[selectedPageId] || DEFAULT_PAGE_SEO_CONFIGS.landing;
      return {
        ...prev,
        pageSeo: {
          ...existingMap,
          [selectedPageId]: {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  // Upload local social image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveErrorMsg("Please choose an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSaveErrorMsg("Image file is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateCurrentPageConfig({ ogImageUrl: result });
        setSaveSuccessMsg("Social image updated! Remember to save changes.");
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes to Firebase Cloud & backend
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const finalSettings: SiteCustomization = {
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      const success = await saveCloudSiteSettings(finalSettings);
      if (success) {
        setSaveSuccessMsg("On-Page SEO settings saved and deployed live!");
        if (onSiteSettingsUpdated) {
          onSiteSettingsUpdated(finalSettings);
        }
      } else {
        setSaveErrorMsg("Saved locally, but cloud sync encountered a minor delay.");
      }
    } catch (err: any) {
      setSaveErrorMsg("Failed to save SEO settings: " + (err.message || "Network error"));
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setSaveErrorMsg(null);
      }, 4000);
    }
  };

  // Reset current page to best-practice preset
  const handleResetToBestPractice = () => {
    const preset = DEFAULT_PAGE_SEO_CONFIGS[selectedPageId];
    if (preset) {
      updateCurrentPageConfig({ ...preset });
      setSaveSuccessMsg(`Reset "${preset.pageName}" to Google SEO best practice.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Calculate real-time On-Page SEO score (0-100)
  const calculateScore = (config: PageSeoConfig) => {
    let score = 0;
    const checks: { label: string; passed: boolean; tip?: string }[] = [];

    // 1. Title length (50 - 65 characters optimal)
    const titleLen = (config.metaTitle || "").trim().length;
    const titleOptimal = titleLen >= 45 && titleLen <= 65;
    if (titleOptimal) score += 25;
    else if (titleLen >= 30 && titleLen <= 75) score += 15;
    checks.push({
      label: `Title Tag Length (${titleLen} chars)`,
      passed: titleOptimal,
      tip: titleLen < 45 ? "Title is short. Aim for 50-60 chars for high CTR." : titleLen > 65 ? "Title may be truncated on Google SERPs (keep under 65 chars)." : "Ideal title length.",
    });

    // 2. Meta description length (125 - 165 characters optimal)
    const descLen = (config.metaDescription || "").trim().length;
    const descOptimal = descLen >= 120 && descLen <= 165;
    if (descOptimal) score += 25;
    else if (descLen >= 80 && descLen <= 180) score += 15;
    checks.push({
      label: `Meta Description (${descLen} chars)`,
      passed: descOptimal,
      tip: descLen < 120 ? "Description is too short. Target 140-160 chars." : descLen > 165 ? "Description exceeds 165 chars and might be cut off." : "Ideal description length.",
    });

    // 3. Focus keywords in title
    const primaryKeyword = (config.focusKeywords || "").split(",")[0]?.trim().toLowerCase();
    const titleContainsKeyword = primaryKeyword && config.metaTitle.toLowerCase().includes(primaryKeyword);
    if (titleContainsKeyword) score += 20;
    checks.push({
      label: "Focus Keyword in Title Tag",
      passed: !!titleContainsKeyword,
      tip: titleContainsKeyword ? `Primary keyword "${primaryKeyword}" present in title.` : `Include "${primaryKeyword || "focus keyword"}" near the front of the Title.`,
    });

    // 4. Focus keywords in description
    const descContainsKeyword = primaryKeyword && config.metaDescription.toLowerCase().includes(primaryKeyword);
    if (descContainsKeyword) score += 15;
    checks.push({
      label: "Focus Keyword in Description",
      passed: !!descContainsKeyword,
      tip: descContainsKeyword ? `Primary keyword present in Meta Description.` : `Mention "${primaryKeyword || "focus keyword"}" naturally in the description.`,
    });

    // 5. Canonical URL valid
    const hasCanonical = !!config.canonicalUrl && config.canonicalUrl.startsWith("http");
    if (hasCanonical) score += 10;
    checks.push({
      label: "Canonical Link Specified",
      passed: hasCanonical,
      tip: hasCanonical ? "Self-referencing canonical URL configured." : "Specify canonical URL to avoid duplicate content flags.",
    });

    // 6. Social Share OG Image
    const hasImage = !!config.ogImageUrl;
    if (hasImage) score += 5;
    checks.push({
      label: "Social Open Graph (OG) Image",
      passed: hasImage,
      tip: hasImage ? "Custom social share card image attached." : "Add a 1200x630 share image for Facebook & Twitter.",
    });

    return { score: Math.min(100, score), checks };
  };

  const audit = calculateScore(currentPageConfig);

  // Generate clean schema JSON string
  const currentSchemaString = () => {
    if (currentPageConfig.customSchemaJson && currentPageConfig.customSchemaJson.trim()) {
      return currentPageConfig.customSchemaJson.trim();
    }
    const schemaType = currentPageConfig.schemaType;
    if (schemaType === "SoftwareApplication" || schemaType === "WebApplication") {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": schemaType,
          name: currentPageConfig.metaTitle,
          description: currentPageConfig.metaDescription,
          applicationCategory: "SEOApplication",
          operatingSystem: "All modern web browsers",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          url: currentPageConfig.canonicalUrl,
          image: currentPageConfig.ogImageUrl,
        },
        null,
        2
      );
    } else if (schemaType === "Article") {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: currentPageConfig.metaTitle,
          description: currentPageConfig.metaDescription,
          author: {
            "@type": "Organization",
            name: currentPageConfig.author || settings.siteName || "RankLynx",
          },
          publisher: {
            "@type": "Organization",
            name: settings.siteName || "RankLynx",
          },
          url: currentPageConfig.canonicalUrl,
          image: currentPageConfig.ogImageUrl,
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settings.siteName || "RankLynx",
        headline: currentPageConfig.metaTitle,
        description: currentPageConfig.metaDescription,
        url: currentPageConfig.canonicalUrl,
      },
      null,
      2
    );
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(currentSchemaString());
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-12 text-center">
        <RefreshCw className="w-8 h-8 text-[#0984E3] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#2D3436]">Loading On-Page SEO Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top SEO Header Banner */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              On-Page SEO & Meta Tags Manager
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Per-Tool Control
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Configure meta titles, descriptions, focus keywords, canonical tags, and structured JSON-LD data for every page and tool individually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View live XML Sitemap generated for Googlebot"
          >
            <Globe className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>View /sitemap.xml</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View live robots.txt directives"
          >
            <FileText className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>View /robots.txt</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Saving..." : "Save SEO Settings"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {saveErrorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-medium text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Tool / Page Selector Navigation Tabs */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-3 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
          Select Page / Tool to Optimize:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {PAGE_LIST.map((page) => {
            const isSelected = selectedPageId === page.id;
            const pageCfg = settings.pageSeo?.[page.id] || DEFAULT_PAGE_SEO_CONFIGS[page.id] || DEFAULT_PAGE_SEO_CONFIGS.landing;
            const pageScore = calculateScore(pageCfg).score;

            return (
              <button
                key={page.id}
                onClick={() => setSelectedPageId(page.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0984E3] border-[#0984E3] text-white shadow-xs font-bold"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                }`}
              >
                <span className="text-lg mb-1">{page.icon}</span>
                <span className="text-[11px] leading-tight line-clamp-1">{page.name.split(" ")[0]}</span>
                <span
                  className={`text-[10px] mt-1 px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : pageScore >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pageScore}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Inputs on Left, Google SERP & Audit on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Core Meta Tags */}
          <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0984E3]" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Search Metadata ({currentPageConfig.pageName})
                </h3>
              </div>
              <button
                onClick={handleResetToBestPractice}
                className="text-[11px] font-semibold text-[#0984E3] hover:text-[#0873C4] flex items-center gap-1 cursor-pointer"
                title="Restore recommended title, description, and keywords"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Optimize Preset</span>
              </button>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Page Meta Title (`&lt;title&gt;` & `og:title`)
                </label>
                <span
                  className={`text-[11px] font-bold ${
                    (currentPageConfig.metaTitle || "").length >= 45 &&
                    (currentPageConfig.metaTitle || "").length <= 65
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {(currentPageConfig.metaTitle || "").length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                value={currentPageConfig.metaTitle || ""}
                onChange={(e) => updateCurrentPageConfig({ metaTitle: e.target.value })}
                placeholder="e.g. Free Bulk URL Opener — Open Multiple Links Fast | RankLynx"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
              />
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (currentPageConfig.metaTitle || "").length <= 60
                      ? "bg-emerald-500"
                      : (currentPageConfig.metaTitle || "").length <= 70
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(100, ((currentPageConfig.metaTitle || "").length / 65) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Google typically displays the first 50–60 characters. Keep primary keyword near the beginning.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  Meta Description (`&lt;meta name="description"&gt;`)
                </label>
                <span
                  className={`text-[11px] font-bold ${
                    (currentPageConfig.metaDescription || "").length >= 120 &&
                    (currentPageConfig.metaDescription || "").length <= 165
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {(currentPageConfig.metaDescription || "").length} / 160 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={currentPageConfig.metaDescription || ""}
                onChange={(e) => updateCurrentPageConfig({ metaDescription: e.target.value })}
                placeholder="Write an engaging, keyword-rich summary explaining the exact value of this tool..."
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3]"
              />
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (currentPageConfig.metaDescription || "").length <= 160
                      ? "bg-emerald-500"
                      : (currentPageConfig.metaDescription || "").length <= 175
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(100, ((currentPageConfig.metaDescription || "").length / 165) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Optimal search snippet length is 130–160 characters. Include clear call-to-action.
              </p>
            </div>

            {/* Focus Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Primary Focus Keywords
                </label>
                <input
                  type="text"
                  value={currentPageConfig.focusKeywords || ""}
                  onChange={(e) => updateCurrentPageConfig({ focusKeywords: e.target.value })}
                  placeholder="e.g. bulk url opener, open multiple links, batch tabs"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Separate with commas. The first term is treated as primary target.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Secondary / LSI Keywords
                </label>
                <input
                  type="text"
                  value={currentPageConfig.secondaryKeywords || ""}
                  onChange={(e) => updateCurrentPageConfig({ secondaryKeywords: e.target.value })}
                  placeholder="e.g. fast web link opener, open list of urls"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Related search intent phrases and long-tail variants.
                </p>
              </div>
            </div>

            {/* Keyword Chips Preview */}
            {currentPageConfig.focusKeywords && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentPageConfig.focusKeywords.split(",").map((k, idx) => {
                  const cleanK = k.trim();
                  if (!cleanK) return null;
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0984E3] border border-blue-200/60 text-[11px] font-semibold"
                    >
                      #{cleanK}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Indexing Directives, Canonical & Author */}
          <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-[#0984E3]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                Robots Directives & Canonical URLs
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Robots Meta Tag (`&lt;meta name="robots"&gt;`)
                </label>
                <select
                  value={currentPageConfig.robotsDirective || "index, follow"}
                  onChange={(e) =>
                    updateCurrentPageConfig({ robotsDirective: e.target.value as RobotsDirective })
                  }
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                >
                  <option value="index, follow">index, follow (Recommended — Allow Indexing & Links)</option>
                  <option value="noindex, follow">noindex, follow (Hide page from Google, but follow links)</option>
                  <option value="index, nofollow">index, nofollow (Index page, do not pass link equity)</option>
                  <option value="noindex, nofollow">noindex, nofollow (Completely block search engines)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Standard tool pages should always be set to `index, follow`.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Canonical URL (`&lt;link rel="canonical"&gt;`)
                </label>
                <input
                  type="text"
                  value={currentPageConfig.canonicalUrl || ""}
                  onChange={(e) => updateCurrentPageConfig({ canonicalUrl: e.target.value })}
                  placeholder="https://ranklynx.com/#bulk-opener"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-[#0984E3]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Tells search engines the authoritative original URL to prevent duplicate content.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Author / Publisher Tag
                </label>
                <input
                  type="text"
                  value={currentPageConfig.author || settings.siteName || ""}
                  onChange={(e) => updateCurrentPageConfig({ author: e.target.value })}
                  placeholder="e.g. RankLynx SEO Team"
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Twitter Card Format
                </label>
                <select
                  value={currentPageConfig.twitterCard || "summary_large_image"}
                  onChange={(e) =>
                    updateCurrentPageConfig({
                      twitterCard: e.target.value as "summary_large_image" | "summary",
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                >
                  <option value="summary_large_image">summary_large_image (High CTR Full Banner)</option>
                  <option value="summary">summary (Compact Square Thumbnail)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Social Share (Open Graph) Image */}
          <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#0984E3]" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Social Media Share Image (og:image / twitter:image)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                1200 x 630 px (1.91:1)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-full sm:w-48 h-28 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                {currentPageConfig.ogImageUrl ? (
                  <img
                    src={currentPageConfig.ogImageUrl}
                    alt="Social preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-[10px]">No image set</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image Web URL or Direct CDN Link
                  </label>
                  <input
                    type="url"
                    value={currentPageConfig.ogImageUrl || ""}
                    onChange={(e) => updateCurrentPageConfig({ ogImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or /og-image.png"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0984E3]" />
                    <span>Upload Image File</span>
                  </button>

                  {currentPageConfig.ogImageUrl && (
                    <button
                      onClick={() => updateCurrentPageConfig({ ogImageUrl: "" })}
                      type="button"
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Structured Data Schema Markup (JSON-LD) */}
          <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#0984E3]" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Structured Data Schema Markup (JSON-LD)
                </h3>
              </div>
              <button
                onClick={handleCopySchema}
                className="text-xs font-semibold text-[#0984E3] hover:text-[#0873C4] flex items-center gap-1 cursor-pointer"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? "Copied!" : "Copy Schema"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Schema Template
                </label>
                <select
                  value={currentPageConfig.schemaType || "SoftwareApplication"}
                  onChange={(e) =>
                    updateCurrentPageConfig({
                      schemaType: e.target.value as PageSeoConfig["schemaType"],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0984E3]"
                >
                  <option value="SoftwareApplication">SoftwareApplication (Best for Tools & Utilities)</option>
                  <option value="WebApplication">WebApplication (Best for Interactive Web Apps)</option>
                  <option value="WebSite">WebSite (Default Site-wide Schema)</option>
                  <option value="Article">Article (Editorial Blogs & Guides)</option>
                  <option value="Custom">Custom JSON-LD (Direct JSON override)</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center">
                Search engines use this structured data for rich snippets, knowledge graph panels, and software cards.
              </div>
            </div>

            {/* JSON-LD Editor / Code Preview */}
            <div className="relative">
              {currentPageConfig.schemaType === "Custom" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paste Custom JSON-LD (`&lt;script type="application/ld+json"&gt;`)
                  </label>
                  <textarea
                    rows={6}
                    value={currentPageConfig.customSchemaJson || ""}
                    onChange={(e) => updateCurrentPageConfig({ customSchemaJson: e.target.value })}
                    placeholder='{"@context": "https://schema.org", "@type": "SoftwareApplication", ...}'
                    className="w-full font-mono text-[11px] px-3.5 py-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Live Auto-Generated Schema Output
                  </label>
                  <pre className="w-full max-h-48 overflow-y-auto font-mono text-[11px] p-3.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl">
                    {currentSchemaString()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Google SERP Preview & Audit Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Live Google Search Result Mockup */}
          <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0984E3]" />
                <h3 className="text-sm font-bold text-[#0F172A]">Google Search SERP Preview</h3>
              </div>

              {/* Desktop / Mobile switcher */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    previewMode === "desktop"
                      ? "bg-white text-[#0984E3] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Desktop Search Result"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    previewMode === "mobile"
                      ? "bg-white text-[#0984E3] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Mobile Search Result"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Google Search Snippet Box */}
            <div
              className={`p-4 rounded-xl border border-slate-200 bg-white transition-all ${
                previewMode === "mobile" ? "max-w-[340px] mx-auto shadow-sm" : "w-full"
              }`}
            >
              {/* Google URL Breadcrumb */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-[#0984E3] shrink-0">
                  {settings.headerLogoIconLetter || "R"}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-semibold text-slate-800">
                    {settings.siteName || "RankLynx"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {currentPageConfig.canonicalUrl || `https://ranklynx.com${currentPageConfig.pageId === "landing" ? "/" : "/#" + currentPageConfig.pageId}`}
                  </div>
                </div>
              </div>

              {/* Google Title */}
              <h4 className="text-[#1a0dab] text-base hover:underline cursor-pointer font-medium leading-snug line-clamp-2">
                {currentPageConfig.metaTitle || `${currentPageConfig.pageName} | ${settings.siteName}`}
              </h4>

              {/* Google Snippet with Focus Keyword Match */}
              <p className="text-xs text-[#4d5156] mt-1.5 leading-relaxed line-clamp-3">
                {currentPageConfig.metaDescription ||
                  "Professional SEO utility designed for digital marketers, webmasters, and outreach link-building specialists."}
              </p>
            </div>

            {/* Social Share Card Preview (Twitter / Facebook card) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Social Media Card (Twitter & Facebook)</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                {currentPageConfig.ogImageUrl ? (
                  <div className="w-full h-32 bg-slate-200 overflow-hidden relative">
                    <img
                      src={currentPageConfig.ogImageUrl}
                      alt="Card preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white p-4 text-center">
                    <span className="font-bold text-sm tracking-wide">
                      {settings.siteName || "RankLynx"} — {currentPageConfig.pageName}
                    </span>
                  </div>
                )}
                <div className="p-3 bg-white">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    ranklynx.com
                  </div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {currentPageConfig.metaTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {currentPageConfig.metaDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* Live On-Page SEO Audit Score */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#0F172A]">
                  On-Page SEO Health Audit
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    audit.score >= 85
                      ? "bg-emerald-100 text-emerald-800"
                      : audit.score >= 60
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Score: {audit.score}/100
                </span>
              </div>

              <div className="space-y-2">
                {audit.checks.map((chk, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      chk.passed
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : "bg-amber-50/60 border-amber-200 text-amber-900"
                    }`}
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{chk.label}</div>
                      {chk.tip && (
                        <div className="text-[11px] opacity-90 mt-0.5">{chk.tip}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button in Sidebar */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Deploy SEO Changes Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
