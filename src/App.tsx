/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ActiveTab,
  AdItem,
  User,
  AuthModalMode,
  SiteCustomization,
  DEFAULT_SITE_CUSTOMIZATION,
} from "./types";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HeadScriptInjector } from "./components/HeadScriptInjector";
import { BulkLinkGenerator } from "./components/BulkLinkGenerator";
import { UrlCleaner } from "./components/UrlCleaner";
import { BulkUrlOpener } from "./components/BulkUrlOpener";
import { DomainMetricsChecker } from "./components/DomainMetricsChecker";
import { KeywordDifficultyChecker } from "./components/KeywordDifficultyChecker";
import { RankTracker } from "./components/RankTracker";
import { AdBanner } from "./components/AdBanner";
import { AdminAdsManager } from "./components/AdminAdsManager";
import { BlogSection } from "./components/BlogSection";
import { AuthModal } from "./components/AuthModal";
import { WordHtmlConverter } from "./components/WordHtmlConverter";
import { MarkdownConverter } from "./components/MarkdownConverter";
import { PdfEditor } from "./components/PdfEditor";
import { BulkUrlChecker } from "./components/BulkUrlChecker";
import { fetchCloudActiveAds, fetchCloudSiteSettings } from "./lib/cloudAds";

// Map URL strings/aliases to canonical tabs
function resolveTab(val: string): ActiveTab | null {
  const clean = val.toLowerCase().trim().replace(/^\/+|\/+$/g, "");
  if (!clean || clean === "landing" || clean === "home" || clean === "index.html") return "landing";

  // Secret admin route for ads management (no public links to this)
  if (
    [
      "admin-ads",
      "secret-admin",
      "ad-manager",
      "ads-manager",
      "console-admin",
      "admin-portal",
    ].includes(clean)
  ) {
    return "admin-ads";
  }

  if (["link-generator", "links", "link-builder", "hyperlinks", "hyperlink-suite", "generator"].includes(clean)) {
    return "link-generator";
  }
  if (["bulk-opener", "opener", "url-opener", "open-urls", "url-bulk-opener", "ping-inspector"].includes(clean)) {
    return "bulk-opener";
  }
  if (["url-cleaner", "cleaner", "url-dedupe", "dedupe", "protocol-cleaner", "duplicate-remover"].includes(clean)) {
    return "url-cleaner";
  }
  if (["domain-metrics", "metrics", "authority", "da-checker", "domain-authority", "moz-ahrefs"].includes(clean)) {
    return "domain-metrics";
  }
  if (["keyword-difficulty", "keywords", "kd", "kd-checker", "keyword-research", "search-intent"].includes(clean)) {
    return "keyword-difficulty";
  }
  if (["rank-tracker", "rank", "rankings", "serp-tracker", "tracker", "serp"].includes(clean)) {
    return "rank-tracker";
  }
  if (["blog", "blogs", "articles", "article", "journal", "editorial", "guides", "guide"].includes(clean)) {
    return "blog";
  }
  if (["word-html", "wordhtml", "word-to-html", "html-to-word", "doc-to-html", "word-cleaner", "clean-word"].includes(clean)) {
    return "word-html";
  }
  if (["markdown-converter", "markdown", "rich-text-markdown", "md-converter", "md", "turndown"].includes(clean)) {
    return "markdown-converter";
  }
  if (["pdf-editor", "pdf", "edit-pdf", "pdf-edit", "pdf-tool", "pfd-editor", "pfd"].includes(clean)) {
    return "pdf-editor";
  }
  if (
    [
      "bulk-url-checker",
      "bulkurlchecker",
      "url-checker",
      "status-checker",
      "http-status",
      "redirect-checker",
      "bulk-redirect",
      "url-status",
    ].includes(clean)
  ) {
    return "bulk-url-checker";
  }

  return null;
}

// Read the tab from current browser URL (search params, hash, or pathname)
function getTabFromLocation(): ActiveTab {
  if (typeof window === "undefined") return "landing";

  // 1. Query parameters: ?tool=... or ?tab=... or ?admin=true
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("admin") === "true" || searchParams.get("ads") === "admin") {
    return "admin-ads";
  }

  const param = searchParams.get("tool") || searchParams.get("tab");
  if (param) {
    const matched = resolveTab(param);
    if (matched) return matched;
  }

  // 2. Hash routing: #link-generator, #/link-generator, etc.
  const rawHash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (rawHash) {
    // Landing page anchor sections
    if (["tools", "workflow", "why-us", "faq"].includes(rawHash)) {
      return "landing";
    }
    const matched = resolveTab(rawHash);
    if (matched) return matched;
  }

  // 3. Pathname routing: /link-generator, /admin-ads, etc.
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (path) {
    const matched = resolveTab(path);
    if (matched) return matched;
  }

  return "landing";
}

// Tab titles for document.title sync
const TAB_TITLES: Record<ActiveTab, string> = {
  landing: "All-in-One SEO Tool - Professional Webmaster & Link-Building Toolkit",
  "link-generator": "Bulk Hyperlink Suite - All-in-One SEO Tool",
  "bulk-opener": "Bulk URL Opener & Ping Inspector - All-in-One SEO Tool",
  "url-cleaner": "Protocol Cleaner & Duplicate Remover - All-in-One SEO Tool",
  "domain-metrics": "Moz, Ahrefs & Semrush Authority Inspector - All-in-One SEO Tool",
  "keyword-difficulty": "Keyword Difficulty & Search Intent - All-in-One SEO Tool",
  "rank-tracker": "Worldwide SERP & Rank Tracker - All-in-One SEO Tool",
  "admin-ads": "Ad Manager & Sponsor Control - All-in-One SEO Tool",
  blog: "Classique Editorial Journal & SEO Guides - All-in-One SEO Tool",
  "word-html": "Word to HTML & HTML to Word Converter - Clean Word Bloat",
  "markdown-converter": "Rich Text to Markdown & Markdown to Rich Text Suite",
  "pdf-editor": "Professional PDF Editor - Add Text, Whiteout, Sign & Save Drafts",
  "bulk-url-checker": "Bulk URL Status & Redirect Chain Checker - All-in-One SEO Tool",
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromLocation());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Ads state
  const [ads, setAds] = useState<AdItem[]>([]);

  // Site settings & branding state
  const [siteSettings, setSiteSettings] = useState<SiteCustomization>(DEFAULT_SITE_CUSTOMIZATION);

  // User auth state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("ranklynx_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("signup");

  // Fetch site customization & branding settings
  const fetchSiteSettings = useCallback(async () => {
    try {
      const cloudSettings = await fetchCloudSiteSettings();
      if (cloudSettings) {
        setSiteSettings(cloudSettings);
        return;
      }
    } catch {}

    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) setSiteSettings(data);
      }
    } catch {}
  }, []);

  // Fetch active ads from Firebase Cloud with local server fallback
  const fetchActiveAds = useCallback(async () => {
    try {
      // 1. Primary: Firebase Cloud Firestore
      const cloudRes = await fetchCloudActiveAds();
      if (cloudRes && Array.isArray(cloudRes.ads)) {
        if (cloudRes.globalEnabled) {
          setAds(cloudRes.ads);
        } else {
          setAds([]);
        }
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      // 2. Fallback: Internal server API
      const res = await fetch("/api/ads");
      if (res.ok) {
        const data = await res.json();
        if (data.globalEnabled) {
          setAds(data.ads || []);
        } else {
          setAds([]);
        }
      }
    } catch {
      // Ignore network failure
    }
  }, []);

  useEffect(() => {
    fetchActiveAds();
    fetchSiteSettings();
  }, [fetchActiveAds, fetchSiteSettings]);

  const handleOpenAuth = (mode: AuthModalMode = "signup") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Navigate to a new tab and synchronize URL + title
  const handleSelectTab = useCallback((tab: ActiveTab, pushToHistory = true) => {
    setActiveTabState(tab);

    if (typeof window !== "undefined") {
      document.title = TAB_TITLES[tab] || TAB_TITLES.landing;

      if (pushToHistory) {
        const targetPath = tab === "landing" ? "/" : `/${tab}`;
        const currentPath = window.location.pathname;

        if (currentPath !== targetPath) {
          window.history.pushState({ tab }, "", targetPath);
        }
      }
    }
  }, []);

  // Listen to browser Back / Forward buttons & Hash changes
  useEffect(() => {
    const handleUrlChange = () => {
      const detectedTab = getTabFromLocation();
      setActiveTabState(detectedTab);
      document.title = TAB_TITLES[detectedTab] || TAB_TITLES.landing;

      // If landing page has an anchor hash, smooth scroll to it
      if (detectedTab === "landing" && window.location.hash) {
        const anchorId = window.location.hash.replace(/^#\/?/, "");
        const targetEl = document.getElementById(anchorId);
        if (targetEl) {
          setTimeout(() => {
            targetEl.scrollIntoView({ behavior: "smooth" });
          }, 80);
        }
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    // Initial anchor scroll synchronization
    if (activeTab === "landing" && window.location.hash) {
      const anchorId = window.location.hash.replace(/^#\/?/, "");
      const targetEl = document.getElementById(anchorId);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    }

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, [activeTab]);

  // SECRET ADMIN PORTAL (Only accessed by direct URL /admin-ads)
  if (activeTab === "admin-ads") {
    return (
      <>
        <HeadScriptInjector siteSettings={siteSettings} activeTab={activeTab} />
        <AdminAdsManager
          siteSettings={siteSettings}
          onSiteSettingsUpdated={(newSettings) => {
            setSiteSettings(newSettings);
          }}
          onReturnHome={() => {
            fetchActiveAds();
            fetchSiteSettings();
            handleSelectTab("landing", true);
          }}
        />
      </>
    );
  }

  // If on landing page, display the dedicated full-screen classic landing layout
  if (activeTab === "landing") {
    return (
      <>
        <HeadScriptInjector siteSettings={siteSettings} activeTab={activeTab} />
        <LandingPage
          onSelectTab={(tab) => handleSelectTab(tab, true)}
          onLaunchApp={() => handleSelectTab("link-generator", true)}
          user={user}
          onOpenAuth={handleOpenAuth}
          ads={ads}
          siteSettings={siteSettings}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          user={user}
          onUserChange={setUser}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] text-[#2D3436] font-sans overflow-hidden">
      {/* Dynamic Head and Meta script injector for AdSense, custom verification tags & On-Page SEO */}
      <HeadScriptInjector siteSettings={siteSettings} activeTab={activeTab} />

      {/* Clean Minimalism Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => handleSelectTab(tab, true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ads={ads}
        siteSettings={siteSettings}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => handleSelectTab(tab, true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          user={user}
          onOpenAuth={handleOpenAuth}
          siteSettings={siteSettings}
        />

        {/* Top Sponsor Bar if configured */}
        <AdBanner placement="top_banner" ads={ads} />

        {/* Scrollable View Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === "link-generator" && <BulkLinkGenerator />}
            {activeTab === "url-cleaner" && <UrlCleaner />}
            {activeTab === "bulk-opener" && <BulkUrlOpener />}
            {activeTab === "domain-metrics" && <DomainMetricsChecker />}
            {activeTab === "keyword-difficulty" && <KeywordDifficultyChecker />}
            {activeTab === "rank-tracker" && <RankTracker />}
            {activeTab === "word-html" && <WordHtmlConverter />}
            {activeTab === "markdown-converter" && <MarkdownConverter />}
            {activeTab === "pdf-editor" && <PdfEditor />}
            {activeTab === "bulk-url-checker" && <BulkUrlChecker />}
            {activeTab === "blog" && (
              <BlogSection
                ads={ads}
                onOpenApp={() => handleSelectTab("link-generator", true)}
              />
            )}

            {/* In-tool Sponsor / Ad Banner */}
            <AdBanner placement="tool_banner" ads={ads} className="mt-8" />

            {/* Dynamic Minimalist Footer */}
            <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
              <Footer
                siteSettings={siteSettings}
                onSelectTab={(tab) => handleSelectTab(tab, true)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onUserChange={setUser}
        initialMode={authModalMode}
      />
    </div>
  );
}
