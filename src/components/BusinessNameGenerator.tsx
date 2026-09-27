import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Heart,
  ExternalLink,
  Trash2,
  Download,
  Share2,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  Building2,
  Globe,
  ArrowRight,
  ShieldCheck,
  Layers,
  Wand2,
} from "lucide-react";
import { AdBanner } from "./AdBanner";
import { AdItem } from "../types";

export type BusinessStyle = "all" | "modern" | "luxury" | "simple" | "creative" | "catchy" | "tech";
export type NameLength = "all" | "one_word" | "two_words" | "short";

interface GeneratedName {
  id: string;
  name: string;
  style: "modern" | "luxury" | "simple" | "creative" | "catchy" | "tech";
  domainHint: string;
  vibe: string;
}

const POPULAR_NICHES = [
  { label: "☕ Coffee & Cafe", value: "coffee cafe roastery" },
  { label: "💻 Tech & SaaS", value: "tech software saas ai cloud" },
  { label: "👗 Fashion & Apparel", value: "clothing boutique fashion apparel" },
  { label: "🌿 Eco & Organic", value: "sustainable organic green eco wellness" },
  { label: "🚀 Digital Marketing", value: "marketing digital growth agency" },
  { label: "🍕 Food & Restaurant", value: "bistro culinary kitchen food grill" },
  { label: "🏡 Real Estate", value: "realty real estate property homes" },
  { label: "✨ Beauty & Skincare", value: "skincare cosmetics beauty spa glow" },
  { label: "🐾 Pet Care & Vet", value: "pet dog cat paws animal care" },
  { label: "🏋️ Fitness & Gym", value: "fitness gym workout athletic training" },
];

const STYLE_DEFINITIONS: Record<string, { label: string; desc: string; icon: string }> = {
  all: { label: "All Styles", desc: "A balanced mix of all naming archetypes", icon: "✨" },
  modern: { label: "Modern", desc: "Sleek, punchy, tech-forward portmanteaus", icon: "⚡" },
  luxury: { label: "Luxury", desc: "Timeless, elegant, prestige, European heritage", icon: "👑" },
  simple: { label: "Simple", desc: "Crisp, minimalist, single-word or short punch", icon: "⚪" },
  creative: { label: "Creative", desc: "Evocative, metaphorical, memorable pairings", icon: "🎨" },
  catchy: { label: "Catchy", desc: "Rhythmic, playful, rhyming & alliterative", icon: "🎵" },
  tech: { label: "Tech & AI", desc: "Next-gen, algorithmic suffixes (-io, -ix, -ly)", icon: "🤖" },
};

// Curated vocabulary banks for smart name synthesis
const MODERN_ROOTS = [
  "Nova", "Nex", "Veloce", "Lumino", "Synthex", "Aether", "Pulse", "Stratis", "Zenthor",
  "Omni", "Vortex", "Apex", "Kore", "Prism", "Hyperion", "Strive", "Nexus", "Moda", "Kinetic"
];
const MODERN_SUFFIXES = ["labs", "hub", "iq", "flow", "wave", "sync", "space", "forge", "ly", "verse", "x", "point"];

const LUXURY_ROOTS = [
  "Aurelia", "Maison", "Valen", "Belvedere", "Elysian", "Lumière", "Prestige", "Vanguard",
  "Sovereign", "Monarque", "Sterling", "Opulent", "Château", "Velvet", "Argent", "Celeste", "Meridian"
];
const LUXURY_SUFFIXES = ["& Co.", "Atelier", "Heritage", "Collection", "Privé", "Crown", "Guild", "Studio", "Reserve"];

const SIMPLE_ROOTS = [
  "Pure", "Peak", "Bold", "True", "Base", "Mint", "Core", "Clear", "Prime", "Root", "Swift",
  "Wise", "Form", "Shift", "Kind", "Beam", "Nest", "Rise", "Well", "Craft"
];
const SIMPLE_SUFFIXES = ["works", "co", "box", "line", "hub", "den", "lane", "path", "spot"];

const CREATIVE_ADJECTIVES = [
  "Blue", "Silver", "Curious", "Velvet", "Golden", "Silent", "Neon", "Urban", "Wild",
  "Copper", "Paper", "Echo", "Timber", "Glass", "Little", "Cosmic", "Solar", "Amber"
];
const CREATIVE_NOUNS = [
  "Fox", "Sparrow", "Lantern", "Compass", "Whistle", "Sprout", "Canopy", "Forge", "River",
  "Harbor", "Quill", "Clover", "Moon", "Beacon", "Valley", "Willow", "Acorn", "Haven"
];

const CATCHY_PREFIXES = [
  "Snap", "Flip", "Pop", "Zap", "Hype", "Buzz", "Click", "Chirp", "Glow", "Loop", "Ping", "Drift"
];
const CATCHY_SUFFIXES = ["bee", "ster", "ify", "ly", "tastic", "drop", "pop", "hop", "snap", "dash"];

const TECH_ROOTS = [
  "Algor", "Byte", "Cyber", "Data", "Tensor", "Vector", "Quant", "Neural", "Krypton", "Logic",
  "Cloud", "Pixel", "Synapse", "Bit", "Graph", "Matrix", "Signal"
];
const TECH_SUFFIXES = ["io", "ix", "ly", "ai", "base", "ops", "stack", "engine", "scale", "node", "sys"];

// Extract meaningful keywords from niche input
function parseNicheKeywords(input: string): string[] {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "all", "our", "your", "pro", "best"].includes(w));
  return cleaned.length > 0 ? cleaned : ["brand", "studio", "craft"];
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Algorithmic Name Generation Function
function generateNamesBatch(
  niche: string,
  style: BusinessStyle,
  lengthFilter: NameLength,
  keywordInclude: string,
  count: number = 36
): GeneratedName[] {
  const keywords = parseNicheKeywords(niche);
  const includeKey = keywordInclude.trim() ? capitalize(keywordInclude.trim()) : "";
  const results: GeneratedName[] = [];
  const seenNames = new Set<string>();

  const targetStyles: Array<"modern" | "luxury" | "simple" | "creative" | "catchy" | "tech"> =
    style === "all"
      ? ["modern", "luxury", "simple", "creative", "catchy", "tech"]
      : [style as any];

  let iterations = 0;
  while (results.length < count && iterations < 300) {
    iterations++;
    const chosenStyle = targetStyles[Math.floor(Math.random() * targetStyles.length)];
    const kw = capitalize(keywords[Math.floor(Math.random() * keywords.length)]);
    let generated = "";
    let vibe = "";

    switch (chosenStyle) {
      case "modern": {
        const root = MODERN_ROOTS[Math.floor(Math.random() * MODERN_ROOTS.length)];
        const suffix = MODERN_SUFFIXES[Math.floor(Math.random() * MODERN_SUFFIXES.length)];
        const type = Math.random();

        if (includeKey) {
          generated = type > 0.5 ? `${includeKey}${capitalize(suffix)}` : `${root} ${includeKey}`;
        } else if (type < 0.35) {
          // Blended portmanteau (e.g. NovaSync, NexaFlow)
          generated = `${root}${capitalize(suffix)}`;
        } else if (type < 0.7) {
          // Two words modern (e.g. Apex Craft, Pulse Studio)
          generated = `${root} ${kw}`;
        } else {
          // Suffix tech blend (e.g. CraftIQ, BrandVerse)
          generated = `${kw}${capitalize(suffix)}`;
        }
        vibe = "Sleek & Forward-Looking";
        break;
      }
      case "luxury": {
        const root = LUXURY_ROOTS[Math.floor(Math.random() * LUXURY_ROOTS.length)];
        const suffix = LUXURY_SUFFIXES[Math.floor(Math.random() * LUXURY_SUFFIXES.length)];
        const type = Math.random();

        if (includeKey) {
          generated = type > 0.5 ? `${root} ${includeKey}` : `${includeKey} & Co.`;
        } else if (type < 0.4) {
          generated = `${root} ${suffix}`;
        } else if (type < 0.7) {
          generated = `Maison ${kw}`;
        } else {
          generated = `${root} of ${kw}`;
        }
        vibe = "Elegance & Prestige";
        break;
      }
      case "simple": {
        const root = SIMPLE_ROOTS[Math.floor(Math.random() * SIMPLE_ROOTS.length)];
        const suffix = SIMPLE_SUFFIXES[Math.floor(Math.random() * SIMPLE_SUFFIXES.length)];
        const type = Math.random();

        if (includeKey) {
          generated = type > 0.5 ? `${root} ${includeKey}` : `${includeKey} ${suffix}`;
        } else if (type < 0.4) {
          generated = `${root} ${kw}`;
        } else if (type < 0.75) {
          generated = `${kw} ${capitalize(suffix)}`;
        } else {
          // Pure single punchy word
          generated = root;
        }
        vibe = "Minimalist & Direct";
        break;
      }
      case "creative": {
        const adj = CREATIVE_ADJECTIVES[Math.floor(Math.random() * CREATIVE_ADJECTIVES.length)];
        const noun = CREATIVE_NOUNS[Math.floor(Math.random() * CREATIVE_NOUNS.length)];
        const type = Math.random();

        if (includeKey) {
          generated = type > 0.5 ? `${adj} ${includeKey}` : `${includeKey} ${noun}`;
        } else if (type < 0.45) {
          generated = `${adj} ${noun}`;
        } else if (type < 0.75) {
          generated = `${adj} ${kw}`;
        } else {
          generated = `${kw} & ${noun}`;
        }
        vibe = "Artistic & Evocative";
        break;
      }
      case "catchy": {
        const pre = CATCHY_PREFIXES[Math.floor(Math.random() * CATCHY_PREFIXES.length)];
        const suf = CATCHY_SUFFIXES[Math.floor(Math.random() * CATCHY_SUFFIXES.length)];
        const type = Math.random();

        if (includeKey) {
          generated = `${pre}${includeKey}`;
        } else if (type < 0.4) {
          generated = `${pre}${kw}`;
        } else if (type < 0.75) {
          generated = `${kw}${suf}`;
        } else {
          generated = `${pre} & ${capitalize(suf)}`;
        }
        vibe = "Playful & High-Recall";
        break;
      }
      case "tech": {
        const root = TECH_ROOTS[Math.floor(Math.random() * TECH_ROOTS.length)];
        const suf = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
        const type = Math.random();

        if (includeKey) {
          generated = `${includeKey}.${suf}`;
        } else if (type < 0.45) {
          generated = `${root}.${suf}`;
        } else if (type < 0.8) {
          generated = `${kw}${capitalize(suf)}`;
        } else {
          generated = `${root} ${capitalize(suf)}`;
        }
        vibe = "Algorithmic & Next-Gen";
        break;
      }
    }

    if (!generated) continue;
    // Clean up double spaces or awkward symbols
    generated = generated.replace(/\s+/g, " ").trim();

    // Check length filter
    const words = generated.split(/\s+/);
    if (lengthFilter === "one_word" && words.length > 1) continue;
    if (lengthFilter === "two_words" && words.length !== 2) continue;
    if (lengthFilter === "short" && generated.length > 8) continue;

    // Check uniqueness
    const keyCheck = generated.toLowerCase();
    if (seenNames.has(keyCheck)) continue;
    seenNames.add(keyCheck);

    const cleanDomain = generated.toLowerCase().replace(/[^a-z0-9]/g, "");

    results.push({
      id: `name-${Date.now()}-${results.length}-${Math.random().toString(36).slice(2, 6)}`,
      name: generated,
      style: chosenStyle,
      domainHint: `${cleanDomain}.com`,
      vibe,
    });
  }

  return results;
}

export const BusinessNameGenerator: React.FC<{ ads?: AdItem[] }> = ({ ads = [] }) => {
  // Input states
  const [nicheInput, setNicheInput] = useState<string>("Tech & SaaS Startup");
  const [selectedStyle, setSelectedStyle] = useState<BusinessStyle>("all");
  const [lengthFilter, setLengthFilter] = useState<NameLength>("all");
  const [keywordInclude, setKeywordInclude] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Results state
  const [names, setNames] = useState<GeneratedName[]>(() =>
    generateNamesBatch("Tech & SaaS Startup", "all", "all", "", 24)
  );

  // Favorites state (Session-persisted in sessionStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("saved_business_names");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState<boolean>(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Sync favorites to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("saved_business_names", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const handleGenerate = (append = false) => {
    setIsGenerating(true);
    setTimeout(() => {
      const newBatch = generateNamesBatch(
        nicheInput || "business",
        selectedStyle,
        lengthFilter,
        keywordInclude,
        append ? 18 : 24
      );
      if (append) {
        setNames((prev) => [...prev, ...newBatch]);
      } else {
        setNames(newBatch);
      }
      setIsGenerating(false);
    }, 280);
  };

  const handleQuickNiche = (val: string) => {
    setNicheInput(val);
    setIsGenerating(true);
    setTimeout(() => {
      const newBatch = generateNamesBatch(val, selectedStyle, lengthFilter, keywordInclude, 24);
      setNames(newBatch);
      setIsGenerating(false);
    }, 200);
  };

  const toggleFavorite = (nameStr: string) => {
    setFavorites((prev) => {
      if (prev.includes(nameStr)) {
        return prev.filter((item) => item !== nameStr);
      } else {
        return [...prev, nameStr];
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedName(text);
    setTimeout(() => setCopiedName(null), 1800);
  };

  const handleCopyAll = (list: string[]) => {
    if (!list.length) return;
    navigator.clipboard.writeText(list.join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleDownloadFavorites = () => {
    if (!favorites.length) return;
    const blob = new Blob([favorites.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `favorite-business-names-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter generated names by in-page search query if typed
  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return names;
    const q = searchQuery.toLowerCase();
    return names.filter(
      (n) => n.name.toLowerCase().includes(q) || n.style.toLowerCase().includes(q) || n.vibe.toLowerCase().includes(q)
    );
  }, [names, searchQuery]);

  const faqs = [
    {
      q: "How does this Business Name Generator work?",
      a: "Our engine blends linguistic morphological algorithms, root words from Greek and Latin, creative portmanteaus, and industry-tailored keywords. It synthesizes brandable, rhythmic, and memorable names categorized by tone (Modern, Luxury, Simple, Creative, Catchy, Tech).",
    },
    {
      q: "Are the generated business names free to use commercially?",
      a: "Yes! All generated names are 100% free to use for your startups, brands, ecommerce stores, products, or side projects without any royalties or licensing fees. We recommend checking trademark registries (like USPTO, WIPO, or EUIPO) before registering your legal entity.",
    },
    {
      q: "How can I check if the .com domain name is available?",
      a: "Each name card includes a direct domain check link. Simply click 'Check .com' to instantly verify availability on premier registrars like Namecheap, Google Domains, or GoDaddy with zero markup.",
    },
    {
      q: "What makes a business name great and high-converting?",
      a: "Great business names pass the 'Radio Test' (easy to spell when heard), are 2 to 3 syllables in length, evoke an emotion or benefit rather than just describing the product, and have clean social handles available across X, LinkedIn, and Instagram.",
    },
    {
      q: "Will my saved favorite names stay if I refresh the page?",
      a: "Yes. Your saved favorites are automatically preserved throughout your browser session. You can copy the entire list to your clipboard or download them as a .txt file at any time with one click.",
    },
    {
      q: "What should I do if my preferred .com domain is already taken?",
      a: "Consider smart domain modifications! Add action words (e.g., 'Get[Name].com', 'Try[Name].com'), scope descriptors ('[Name]HQ.com', '[Name]Labs.com'), or choose modern top-level domains like .co, .io, .ai, or .studio.",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top SEO & Header Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0984E3] border border-blue-100 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant AI & Brand Naming Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Business Name Generator
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Generate memorable, brandable, and high-recall business names in seconds. Pick your niche,
              select your brand archetype, test domain availability, and save your favorites.
            </p>
          </div>

          {/* Quick Action: Saved Favorites Counter Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowFavoritesModal(true)}
              className="relative px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#0984E3] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#0F172A] transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  favorites.length > 0 ? "fill-rose-500 text-rose-500" : "text-[#64748B] group-hover:text-rose-500"
                }`}
              />
              <span>Saved Favorites</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  favorites.length > 0 ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {favorites.length}
              </span>
            </button>
          </div>
        </div>

        {/* Input & Customization Matrix */}
        <div className="space-y-5">
          {/* Main Search / Niche Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
              1. Enter Your Niche, Product or Industry
            </label>
            <div className="relative">
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate(false)}
                placeholder="e.g. Specialty coffee shop, AI productivity tool, eco fashion brand, digital marketing agency..."
                className="w-full px-4 py-3.5 pl-11 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0984E3]/20 focus:border-[#0984E3] transition-all font-medium text-[#0F172A]"
              />
              <Building2 className="w-5 h-5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Quick Niche Pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[11px] text-[#94A3B8] font-medium mr-1">Popular niches:</span>
              {POPULAR_NICHES.map((niche) => (
                <button
                  key={niche.label}
                  type="button"
                  onClick={() => handleQuickNiche(niche.value)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-[#0984E3] text-[#475569] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                >
                  {niche.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
              2. Choose Your Brand Archetype / Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(STYLE_DEFINITIONS).map(([key, def]) => {
                const isSelected = selectedStyle === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedStyle(key as BusinessStyle)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#0984E3] text-white border-[#0984E3] shadow-xs"
                        : "bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{def.icon}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{def.label}</div>
                      <div
                        className={`text-[10px] line-clamp-1 mt-0.5 ${
                          isSelected ? "text-blue-100" : "text-[#94A3B8]"
                        }`}
                      >
                        {def.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Filters: Word Count & Keyword Constraint */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Word Count / Structure
              </label>
              <select
                value={lengthFilter}
                onChange={(e) => setLengthFilter(e.target.value as NameLength)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
              >
                <option value="all">Any Length (Recommended)</option>
                <option value="one_word">1 Word (Brandable Portmanteau)</option>
                <option value="two_words">2 Words (Compound Name)</option>
                <option value="short">Short (&lt; 8 Letters)</option>
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                Optional Keyword to Include
              </label>
              <input
                type="text"
                value={keywordInclude}
                onChange={(e) => setKeywordInclude(e.target.value)}
                placeholder="e.g. Cloud, Labs, Brew, Spark..."
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Wand2 className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "Synthesizing..." : "Generate Names"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AD PLACEHOLDER 1: Top Responsive Banner */}
      <div className="w-full">
        {ads.length > 0 ? (
          <AdBanner placement="tool_banner" ads={ads} />
        ) : (
          <div className="w-full rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#64748B]">
              <span className="px-2 py-0.5 rounded bg-slate-200 text-[#475569] text-[10px] font-bold uppercase tracking-wider">
                Ad
              </span>
              <span>Sponsored Partner Placement — Reserve Your Premium .COM Domain & Web Hosting</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Connect your business name with high-performance cloud hosting & SSL certificate.
            </p>
          </div>
        )}
      </div>

      {/* Results Header with Batch Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <span>Generated Names</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0984E3] text-xs font-semibold">
              {filteredNames.length} ideas
            </span>
          </div>

          {/* Quick Search within results */}
          <div className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter results..."
              className="py-1 px-2.5 pl-7 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] w-40 focus:w-48 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Batch action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopyAll(names.map((n) => n.name))}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy all generated names to clipboard"
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Copy All ({names.length})</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0984E3] border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>Generate More</span>
          </button>
        </div>
      </div>

      {/* Generated Names Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredNames.map((item) => {
          const isSaved = favorites.includes(item.name);
          const isJustCopied = copiedName === item.name;

          return (
            <div
              key={item.id}
              className="group bg-white rounded-xl border border-[#E2E8F0] hover:border-[#0984E3]/40 p-4 transition-all hover:shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#475569]">
                    {item.style}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] font-medium italic">
                    {item.vibe}
                  </span>
                </div>

                <div className="text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#0984E3] transition-colors break-words">
                  {item.name}
                </div>

                {/* Domain Hint */}
                <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-1 font-mono">
                  <Globe className="w-3 h-3 text-[#94A3B8]" />
                  <span>{item.domainHint}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                {/* Check Domain Link */}
                <a
                  href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(
                    item.domainHint
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-[#0984E3] hover:underline flex items-center gap-1"
                  title="Check domain availability on Namecheap"
                >
                  <span>Check .com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Copy and Save Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(item.name)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] transition-colors cursor-pointer"
                    title="Copy name to clipboard"
                  >
                    {isJustCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleFavorite(item.name)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isSaved
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-rose-500"
                    }`}
                    title={isSaved ? "Remove from favorites" : "Save to favorites"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-500" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNames.length === 0 && (
        <div className="p-10 text-center bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-sm font-semibold text-[#475569]">
            No names match "{searchQuery}". Try a different keyword or reset filters.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-bold text-[#0984E3] hover:underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* AD PLACEHOLDER 2: Middle Native In-Feed Placement */}
      <div className="w-full bg-white rounded-xl border border-dashed border-[#CBD5E1] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-sm">
            Ad
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">
              File Your LLC & Trademark Registration in 10 Minutes
            </div>
            <div className="text-[11px] text-[#64748B]">
              Protect your new brand name with professional state filing and registered agent support.
            </div>
          </div>
        </div>
        <button
          onClick={() => window.open("https://www.uspto.gov/trademarks", "_blank")}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shrink-0 cursor-pointer"
        >
          Check Trademarks
        </button>
      </div>

      {/* Section: Tips for Choosing a Good Business Name */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            6 Essential Rules for Choosing an Unforgettable Business Name
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6 max-w-2xl">
          A great name is your highest-leverage marketing asset. Before finalizing your brand name,
          evaluate it against these time-tested webmaster and branding principles:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Pass the "Radio Test"</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              If you speak your company name out loud over a phone call or podcast, can people spell it
              instantly without you having to spell it out letter-by-letter? Avoid awkward hyphens or tricky silent letters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Keep It Short (2–3 Syllables)</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Global brands (Apple, Stripe, Nike, Google, Slack) are punchy and quick to vocalize. Short names
              fit cleanly onto app icons, favicon badges, business cards, and social headers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Secure .COM & Social Handles</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              The .com extension remains the global gold standard for consumer trust. Also check if the @handle
              is free across X (Twitter), Instagram, YouTube, and LinkedIn before investing in branding.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Avoid Trademark Conflicts</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Always search the official USPTO (TESS) or international trademark databases for identical or
              confusingly similar names within your industry class to avoid legal disputes later.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                5
              </span>
              <span>Don't Box Yourself In</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Avoid overly narrow geographic or single-product names. "AustinCupcakes" limits you if you expand
              to cookies or open shops in Dallas. Choose an umbrella name that can grow with your ambition.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                6
              </span>
              <span>Match Emotional Archetype</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Luxury brands demand timeless, European phonetic elegance. SaaS brands thrive on swift, kinetic
              suffixes (-ly, -io, -flow). Align the phonetic tone of your name with customer expectations.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Frequently Asked Questions (FAQ) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6">
          Everything you need to know about generating, vetting, and launching your brand name.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={faq.q}
                className="border border-[#E2E8F0] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left bg-[#F8FAFC] hover:bg-slate-100 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#64748B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs text-[#475569] leading-relaxed border-t border-[#E2E8F0]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Saved Favorites Drawer / Dialog */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Saved Favorite Names ({favorites.length})
                </h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {favorites.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No favorite names saved yet. Click the heart icon on any card to save ideas here during your session!
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {favorites.map((name) => (
                  <div
                    key={name}
                    className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-bold text-[#0F172A]">{name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(name)}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#475569] cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedName === name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleFavorite(name)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {favorites.length > 0 && (
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                <button
                  onClick={() => setFavorites([])}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAll(favorites)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={handleDownloadFavorites}
                    className="px-3 py-1.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export TXT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
