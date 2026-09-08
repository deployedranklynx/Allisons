import React from "react";
import { ActiveTab } from "../types";
import { Menu } from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
}) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case "link-generator":
        return "Bulk Hyperlink & URL Suite";
      case "bulk-opener":
        return "Bulk URL Opener & Ping Inspector";
      case "url-cleaner":
        return "Protocol Cleaner & Duplicate Remover";
      case "domain-metrics":
        return "Moz, Ahrefs & Semrush Authority Inspector";
      case "keyword-difficulty":
        return "Keyword Difficulty & Search Intent";
      case "rank-tracker":
        return "Worldwide SERP & Rank Tracker";
      default:
        return "SEO Suite & Optimizer";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E9ECEF] flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 rounded-md text-[#636E72] hover:bg-gray-100 hover:text-[#2D3436] transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-semibold text-[#2D3436] truncate">
          {getTabTitle(activeTab)}
        </h2>

        {/* Quick Jump Action Pills matching Clean Minimalism theme */}
        <div className="hidden md:flex items-center gap-2">
          {activeTab !== "url-cleaner" && (
            <button
              onClick={() => setActiveTab("url-cleaner")}
              className="px-3 py-1 text-xs border border-[#E9ECEF] rounded-md hover:bg-gray-50 text-[#636E72] transition-colors"
            >
              Strip HTTP/WWW
            </button>
          )}
          {activeTab !== "link-generator" && (
            <button
              onClick={() => setActiveTab("link-generator")}
              className="px-3 py-1 text-xs border border-[#E9ECEF] rounded-md hover:bg-gray-50 text-[#636E72] transition-colors"
            >
              Hyperlink Generator
            </button>
          )}
          {activeTab !== "domain-metrics" && (
            <button
              onClick={() => setActiveTab("domain-metrics")}
              className="px-3 py-1 text-xs border border-[#E9ECEF] rounded-md hover:bg-gray-50 text-[#636E72] transition-colors"
            >
              Check Moz/Ahrefs
            </button>
          )}
        </div>
      </div>

      {/* Right side status badge and active tool indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] text-xs text-[#636E72]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">All Tools Active</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#EBF5FF] text-[#0984E3] font-semibold border border-[#0984E3]/20">
          Pro Mode
        </span>
      </div>
    </header>
  );
};
