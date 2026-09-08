/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { ActiveTab, AdItem, User, AuthModalMode } from "./types";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BulkLinkGenerator } from "./components/BulkLinkGenerator";
import { UrlCleaner } from "./components/UrlCleaner";
import { BulkUrlOpener } from "./components/BulkUrlOpener";
import { DomainMetricsChecker } from "./components/DomainMetricsChecker";
import { KeywordDifficultyChecker } from "./components/KeywordDifficultyChecker";
import { RankTracker } from "./components/RankTracker";
import { AdBanner } from "./components/AdBanner";
import { AdminAdsManager } from "./components/AdminAdsManager";
import { AuthModal } from "./components/AuthModal";

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
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromLocation());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Ads state
  const [ads, setAds] = useState<AdItem[]>([]);

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

  // Fetch active ads from public API
  const fetchActiveAds = useCallback(async () => {
    try {
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
  }, [fetchActiveAds]);

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

    // Initial title & anchor scroll synchronization
    document.title = TAB_TITLES[activeTab] || TAB_TITLES.landing;
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
      <AdminAdsManager
        onReturnHome={() => {
          fetchActiveAds();
          handleSelectTab("landing", true);
        }}
      />
    );
  }

  // If on landing page, display the dedicated full-screen classic landing layout
  if (activeTab === "landing") {
    return (
      <>
        <LandingPage
          onSelectTab={(tab) => handleSelectTab(tab, true)}
          onLaunchApp={() => handleSelectTab("link-generator", true)}
          user={user}
          onOpenAuth={handleOpenAuth}
          ads={ads}
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
      {/* Clean Minimalism Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => handleSelectTab(tab, true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ads={ads}
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

            {/* In-tool Sponsor / Ad Banner */}
            <AdBanner placement="tool_banner" ads={ads} className="mt-8" />
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
