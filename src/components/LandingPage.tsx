import React, { useState } from "react";
import { ActiveTab, User, AuthModalMode, AdItem, SiteCustomization, DEFAULT_SITE_CUSTOMIZATION } from "../types";
import { AdBanner } from "./AdBanner";
import { Footer } from "./Footer";
import {
  Link2,
  Scissors,
  ExternalLink,
  BarChart3,
  Search,
  Globe2,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Download,
  ChevronDown,
  Layers,
  Sparkles,
  User as UserIcon,
  BookOpen,
  FileCode,
  Code2,
  FileText,
} from "lucide-react";

interface LandingPageProps {
  onSelectTab: (tab: ActiveTab) => void;
  onLaunchApp: () => void;
  user?: User | null;
  onOpenAuth?: (mode?: AuthModalMode) => void;
  ads?: AdItem[];
  siteSettings?: SiteCustomization;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTab,
  onLaunchApp,
  user,
  onOpenAuth,
  ads = [],
  siteSettings,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const tools = [
    {
      id: "link-generator" as ActiveTab,
      name: "Hyperlink Suite",
      tagline: "3-in-1 Mass Link Generator",
      description:
        "Instantly pair bulk URLs and anchor keywords to produce clean HTML, forum BBCode, and Markdown tags simultaneously.",
      icon: Link2,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      features: [
        "1-to-1 or Cartesian combinations",
        "Target _blank, nofollow, sponsored & ugc flags",
        "Title case, lowercase & capitalized anchors",
      ],
      cta: "Generate Links",
    },
    {
      id: "bulk-opener" as ActiveTab,
      name: "URL Bulk Opener",
      tagline: "Batch Browser Launch & HTTP Inspector",
      description:
        "Open hundreds of URLs in controlled batches with custom delays to bypass aggressive browser popup blockers.",
      icon: ExternalLink,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      features: [
        "Adjustable batch sizes & delays (0.2s - 5s)",
        "Pop-up blocker detection test",
        "Real-time HTTP 200/301/404 response pinging",
      ],
      cta: "Launch URLs",
    },
    {
      id: "url-cleaner" as ActiveTab,
      name: "Protocol & Dupe Cleaner",
      tagline: "Sanitize & Standardize Web Lists",
      description:
        "Strip http/https, eliminate trailing slashes, remove tracking parameters, and remove duplicate URLs in one click.",
      icon: Scissors,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      features: [
        "Protocol cleaner (strip http/https, www)",
        "Query parameter & port sanitization",
        "Deduplication with separate unique and duplicate lists",
      ],
      cta: "Clean URLs",
    },
    {
      id: "domain-metrics" as ActiveTab,
      name: "Domain Metrics Inspector",
      tagline: "Moz, Ahrefs & Semrush Authority",
      description:
        "Evaluate batch domain authority including Moz DA/PA, Spam Score, Ahrefs DR/UR, and Semrush Authority Scores.",
      icon: BarChart3,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      features: [
        "Check up to 50 domains simultaneously",
        "Moz DA, PA, and Spam Score assessment",
        "Ahrefs DR & Semrush Authority Score metrics",
      ],
      cta: "Check Authority",
    },
    {
      id: "keyword-difficulty" as ActiveTab,
      name: "Keyword Difficulty Checker",
      tagline: "SERP Competition & Search Intent",
      description:
        "Calculate true ranking difficulty (0-100), estimated monthly search volumes, CPC benchmarks, and backlink requirements.",
      icon: Search,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      features: [
        "0 to 100 difficulty score breakdown",
        "Search intent categorization (Info, Comm, Trans)",
        "Estimated referring domains required to rank top 10",
      ],
      cta: "Analyze Keywords",
    },
    {
      id: "rank-tracker" as ActiveTab,
      name: "SERP Rank Tracker",
      tagline: "Multi-Country Google Rank Monitor",
      description:
        "Track keyword rankings across 20+ countries on Desktop and Mobile with historical delta tracking and SERP feature inspection.",
      icon: Globe2,
      color: "text-teal-600 bg-teal-50 border-teal-100",
      features: [
        "Google US, UK, CA, AU, PK & international markets",
        "Desktop vs Mobile SERP simulation",
        "Featured snippets, local pack & People Also Ask detection",
      ],
      cta: "Track Rankings",
    },
    {
      id: "word-html" as ActiveTab,
      name: "Word to HTML & HTML to Word",
      tagline: "Bi-Directional WordHTML Engine",
      description:
        "Clean MS Word and Google Docs bloat, strip proprietary mso-* styles, smart quotes, and convert visual rich text to clean HTML code or download Word .doc files.",
      icon: FileCode,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      features: [
        "Strip MS Office junk (<o:p>, MsoNormal, inline styles)",
        "Live bi-directional split-view visual and HTML editing",
        "Export clean .html or native Word document (.doc)",
      ],
      cta: "Convert Word & HTML",
    },
    {
      id: "markdown-converter" as ActiveTab,
      name: "Rich Text to Markdown Suite",
      tagline: "Live Bi-Directional Markdown Suite",
      description:
        "Seamlessly convert rich formatted text into GitHub-flavored Markdown and vice-versa with live side-by-side editing, syntax highlighting, and table support.",
      icon: Code2,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      features: [
        "Bi-directional synchronization between Rich Text and GFM",
        "Interactive tables, task checklists, and code blocks",
        "Export to .md files or standalone styled HTML",
      ],
      cta: "Convert Markdown",
    },
    {
      id: "pdf-editor" as ActiveTab,
      name: "Professional PDF Editor",
      tagline: "Annotate, Redact, Sign & Save Drafts",
      description:
        "Edit any PDF document without software installation. Place text overlays, whiteout/redact sensitive text, draw digital signatures, and save drafts locally for later.",
      icon: FileText,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      features: [
        "Upload and edit any PDF file or start blank",
        "Whiteout redaction boxes, text boxes, and handwritten signatures",
        "Save project drafts in browser to resume editing anytime",
      ],
      cta: "Launch PDF Editor",
    },
    {
      id: "bulk-url-checker" as ActiveTab,
      name: "Bulk URL & Redirect Checker",
      tagline: "100% Reliable HTTP Status & Redirect Auditor",
      description:
        "Check hundreds of URLs at once for HTTP status codes (200, 301, 302, 404, 500), trace multi-hop redirect chains, inspect server headers, latency, and export full reports.",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      features: [
        "Real-time 2xx, 3xx, 4xx, 5xx classification and error detection",
        "Full multi-hop redirect chain journey and loop prevention",
        "Simulate Googlebot, Chrome, and Bingbot crawler user-agents",
      ],
      cta: "Check URLs Now",
    },
  ];

  const faqs = [
    {
      q: "Is ASA SEO Tool completely free to use?",
      a: "Yes, 100% free. There are no paywalls, mandatory subscriptions, or credit card requirements. All tools including bulk URL processing, protocol cleaning, and domain metrics are accessible to everyone.",
    },
    {
      q: "How does the Bulk URL Opener prevent browser pop-up blocking?",
      a: "Browsers enforce strict limits on opening multiple tabs simultaneously from a single mouse click. Our tool features intelligent batching and customizable delays (e.g. 1-2 seconds between tabs), allowing you to open large lists safely without being blocked by browser security.",
    },
    {
      q: "Are my URL and keyword lists kept private?",
      a: "Absolutely. URL cleaning, duplicate removal, and hyperlink generation execute directly within your web browser. Your lists are never stored, sold, or shared with third parties.",
    },
    {
      q: "Can I export my generated links and analysis data?",
      a: "Yes. Every tool provides one-click 'Copy to Clipboard' and formatted CSV/TXT file export options so you can immediately import data into Excel, Google Sheets, or your SEO reports.",
    },
    {
      q: "What types of link formats does the Hyperlink Suite support?",
      a: "The tool generates standard HTML anchor tags (`<a href=...>`), forum BBCode (`[url=...]`), and Markdown format (`[anchor](url)`). You can also configure `target=\"_blank\"`, `rel=\"nofollow\"`, `rel=\"sponsored\"`, and `rel=\"ugc\"` attributes with a single toggle.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1E293B] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Sponsor Announcement Bar */}
      <AdBanner placement="top_banner" ads={ads} />

      {/* Top Classic Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {siteSettings?.headerLogoType === "image" && siteSettings.headerLogoUrl ? (
              <img
                src={siteSettings.headerLogoUrl}
                alt={siteSettings.siteName || "Logo"}
                className="h-10 max-w-[150px] object-contain rounded-lg shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#0984E3] flex items-center justify-center text-white font-black text-lg shadow-sm">
                {siteSettings?.headerLogoIconLetter || "R"}
              </div>
            )}
            <div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A] block leading-none">
                {siteSettings?.siteName || "RankLynx"}
              </span>
              <span className="text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">
                {siteSettings?.headerTagline || "All-in-One SEO Suite"}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
            <a
              href="#tools"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", "#tools");
              }}
              className="hover:text-[#0984E3] transition-colors"
            >
              Tools Suite
            </a>
            <a
              href="#workflow"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", "#workflow");
              }}
              className="hover:text-[#0984E3] transition-colors"
            >
              Workflow
            </a>
            <a
              href="#why-us"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("why-us")?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", "#why-us");
              }}
              className="hover:text-[#0984E3] transition-colors"
            >
              Why ASA Tool
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", "#faq");
              }}
              className="hover:text-[#0984E3] transition-colors"
            >
              FAQ
            </a>
            <button
              onClick={() => onSelectTab("blog")}
              className="hover:text-[#0984E3] transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[#0984E3]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Editorial Blog</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {/* User Account / Sign In CTA */}
            {user ? (
              <button
                onClick={() => onOpenAuth && onOpenAuth("profile")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-[#E2E8F0] hover:border-[#0984E3] text-xs text-[#0F172A] transition-all cursor-pointer"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-[#0984E3] text-white flex items-center justify-center font-bold text-[11px]">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-semibold">{user.name.split(" ")[0]}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Free</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth && onOpenAuth("signup")}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#0984E3]" />
                <span>Sign Up Free</span>
              </button>
            )}

            <button
              id="landing-header-launch-btn"
              onClick={onLaunchApp}
              className="px-5 py-2.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#E2E8F0] bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Professional Webmaster & Link-Building Toolkit</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12] mb-6">
            Everything You Need to <br className="hidden sm:inline" />
            <span className="text-[#0984E3]">Build, Clean & Analyze</span> Links
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#475569] leading-relaxed mb-10 font-normal">
            Eliminate tedious manual spreadsheet work. Generate bulk HTML, BBCode &
            Markdown hyperlinks, clean URL protocols, inspect Moz & Ahrefs domain
            authority, and track search rankings in seconds.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              id="landing-hero-launch-primary"
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Open All-in-One Suite</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <a
              href="#tools"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-gray-50 text-[#334155] border border-[#CBD5E1] text-base font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>Explore 6 Pro Tools</span>
              <ChevronDown className="w-4 h-4 text-[#64748B]" />
            </a>
          </div>

          {/* Live Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-left">
            <div className="p-3 border-r border-[#E2E8F0] last:border-0">
              <div className="text-2xl font-bold text-[#0F172A]">6 Tools</div>
              <div className="text-xs text-[#64748B] mt-0.5">Comprehensive Suite</div>
            </div>
            <div className="p-3 md:border-r border-[#E2E8F0]">
              <div className="text-2xl font-bold text-[#0984E3]">3-in-1</div>
              <div className="text-xs text-[#64748B] mt-0.5">HTML, BBCode & Markdown</div>
            </div>
            <div className="p-3 border-r border-[#E2E8F0] last:border-0">
              <div className="text-2xl font-bold text-emerald-600">100% Free</div>
              <div className="text-xs text-[#64748B] mt-0.5">No Sign-Up or Limits</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-[#0F172A]">Instant</div>
              <div className="text-xs text-[#64748B] mt-0.5">Client-Side Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Tools Grid Showcase */}
      <section id="tools" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0984E3] uppercase tracking-wider">
              Toolbox Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mt-2 mb-4">
              Six Purpose-Built Utilities in One Tab
            </h2>
            <p className="text-base text-[#64748B]">
              Engineered specifically for SEO professionals, outreach specialists, and affiliate marketers who value speed, accuracy, and zero bloated clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  id={`landing-card-${tool.id}`}
                  className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 flex flex-col justify-between hover:border-[#94A3B8] hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Header with Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center border ${tool.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                        Instant Tool
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#0F172A] mb-1 group-hover:text-[#0984E3] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#0984E3] mb-3">
                      {tool.tagline}
                    </p>
                    <p className="text-sm text-[#475569] leading-relaxed mb-6">
                      {tool.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 mb-6 border-t border-[#F1F5F9] pt-4">
                      {tool.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#334155]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Direct Launch Button */}
                  <button
                    id={`btn-open-${tool.id}`}
                    onClick={() => onSelectTab(tool.id)}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#F8FAFC] hover:bg-[#0984E3] text-[#334155] hover:text-white border border-[#E2E8F0] hover:border-[#0984E3] text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{tool.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* In-Content Sponsor Banner */}
          <div className="mt-12">
            <AdBanner placement="tool_banner" ads={ads} />
          </div>
        </div>
      </section>

      {/* Clean Step-by-Step Workflow Section */}
      <section id="workflow" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0984E3] uppercase tracking-wider">
              Simple Workflow
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mt-2 mb-4">
              How It Streamlines Your Day
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Spend less time fixing syntax errors and more time executing high-impact SEO campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] relative">
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Paste Your Raw Data
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Paste hundreds of URLs or keywords directly from your outreach sheets, guest-post lists, or backlink exports.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] relative">
              <div className="w-8 h-8 rounded-full bg-[#0984E3] text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Configure Formatting Rules
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Select link attributes (nofollow, ugc, target blank), strip unwanted URL parameters, or specify target countries for ranking checks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Copy or Export Clean Data
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Copy formatted code snippets with 1-click or download clean CSVs ready to paste into your reports or CMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ASA Tool (Value Pillars) */}
      <section id="why-us" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0984E3] uppercase tracking-wider">
              Core Advantages
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mt-2 mb-4">
              Engineered for Speed & Reliability
            </h2>
            <p className="text-base text-[#64748B]">
              Designed to replace sluggish single-purpose websites with a cohesive, ultra-fast toolkit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#0984E3] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                Zero Latency Processing
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Processing occurs client-side whenever possible, transforming thousands of URLs in milliseconds without loading spinners.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                Strict Client Privacy
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Your client backlinks, outreach spreadsheets, and confidential keywords remain strictly within your browser.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                Multi-Format Synthesizer
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Never format links twice. Obtain HTML for web pages, BBCode for web forums, and Markdown for GitHub or Notion in one pass.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E2E8F0] bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                CSV & TXT One-Click Export
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Export clean results directly to CSV or text files formatted perfectly for Excel, Google Sheets, or Ahrefs bulk imports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#0984E3] uppercase tracking-wider">
              Answers & Help
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mt-2 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#64748B]">
              Quick answers about our SEO tools, capabilities, and data security.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-[#E2E8F0] rounded-xl bg-white overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-[#0F172A] hover:bg-gray-50/70 transition-colors text-sm sm:text-base cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#0984E3]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Classique Blog Editorial Section */}
      <section className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] text-xs font-semibold text-[#0984E3] mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Classique Editorial & Guides</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                Tactical SEO Masterclasses & Insights
              </h2>
              <p className="mt-2 text-base text-[#64748B] max-w-2xl">
                Expert deep-dives on enterprise link velocity, protocol hygiene, anchor ratio balance, and search intent intelligence.
              </p>
            </div>
            <button
              onClick={() => onSelectTab("blog")}
              className="px-5 py-2.5 border border-[#E2E8F0] hover:border-[#0984E3] hover:text-[#0984E3] rounded-lg text-xs font-bold text-[#0F172A] flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Explore Editorial Journal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => onSelectTab("blog")}
              className="group bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#0984E3]/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
                  alt="SEO Strategy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-xs text-[11px] font-bold text-[#0984E3] rounded-md shadow-2xs">
                  Link Building
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#64748B] font-medium mb-1.5">
                    March 2025 • 6 min read
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors line-clamp-2">
                    The Modern Link Building Architecture: Anchor Text Distribution in 2025
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 mt-2 leading-relaxed">
                    How high-authority enterprise webmasters structure branded, exact-match, and partial-match anchor profiles safely.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0984E3]">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div
              onClick={() => onSelectTab("blog")}
              className="group bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#0984E3]/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"
                  alt="Data Analytics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-xs text-[11px] font-bold text-emerald-600 rounded-md shadow-2xs">
                  Technical SEO
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#64748B] font-medium mb-1.5">
                    February 2025 • 8 min read
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors line-clamp-2">
                    Why Clean URLs & Canonical Normalization Drive Crawl Budget Efficiency
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 mt-2 leading-relaxed">
                    A deep dive into duplicate URL traps, tracking tag hygiene, and multi-protocol sanitization.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0984E3]">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div
              onClick={() => onSelectTab("blog")}
              className="group bg-[#FAFAFA] border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#0984E3]/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80"
                  alt="Domain Metrics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-xs text-[11px] font-bold text-amber-600 rounded-md shadow-2xs">
                  Authority Analysis
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#64748B] font-medium mb-1.5">
                    January 2025 • 5 min read
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors line-clamp-2">
                    Moz DA vs Ahrefs DR vs Semrush AS: What Really Correlates With Rank?
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 mt-2 leading-relaxed">
                    Analyzing historical SERP movements against the big 3 third-party domain authority metrics.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#0984E3]">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action Banner */}
      <section className="py-16 bg-[#0F172A] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
            Ready to Accelerate Your SEO Workflow?
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto mb-8">
            Access all six pro utilities right now. Free forever, no registration or account required.
          </p>
          <button
            id="landing-bottom-cta-launch"
            onClick={onLaunchApp}
            className="px-8 py-3.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2.5 cursor-pointer"
          >
            <span>Launch Free SEO Suite</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Dynamic Minimalist Footer */}
      <Footer
        onSelectTab={onSelectTab}
        siteSettings={siteSettings || DEFAULT_SITE_CUSTOMIZATION}
      />
    </div>
  );
};
