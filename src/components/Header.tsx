import React from "react";
import { ActiveTab, User, AuthModalMode } from "../types";
import { Menu, Home, User as UserIcon, Sparkles, BookOpen } from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSidebar: () => void;
  user?: User | null;
  onOpenAuth?: (mode?: AuthModalMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
  user,
  onOpenAuth,
}) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case "landing":
        return "Home & Toolkit Overview";
      case "blog":
        return "Editorial Journal & Tactical SEO Guides";
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
          <button
            onClick={() => setActiveTab("landing")}
            className="px-3 py-1 text-xs border border-[#E9ECEF] rounded-md hover:bg-gray-50 text-[#636E72] transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>Home Page</span>
          </button>

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
          {activeTab !== "blog" && (
            <button
              onClick={() => setActiveTab("blog")}
              className="px-3 py-1 text-xs border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 rounded-md text-[#0984E3] font-semibold transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3 text-[#0984E3]" />
              <span>Blog & Guides</span>
            </button>
          )}
        </div>
      </div>

      {/* Right side status badge and user account action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] text-xs text-[#636E72]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">All Tools Active</span>
        </div>

        {/* User Account / Sign In CTA */}
        {user ? (
          <button
            onClick={() => onOpenAuth && onOpenAuth("profile")}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-[#E9ECEF] hover:border-[#0984E3] text-xs text-[#2D3436] transition-all cursor-pointer shadow-2xs"
            title="View Account & Plan"
          >
            <div className="w-6 h-6 rounded-full bg-[#0984E3] text-white flex items-center justify-center font-bold text-[11px]">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-semibold block leading-tight max-w-[100px] truncate">{user.name}</span>
              <span className="text-[10px] text-emerald-600 font-medium leading-none">Free Plan</span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => onOpenAuth && onOpenAuth("signup")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign Up Free</span>
          </button>
        )}
      </div>
    </header>
  );
};
