import React from "react";
import { ActiveTab } from "../types";
import {
  Link2,
  Scissors,
  ExternalLink,
  BarChart3,
  Search,
  Globe2,
  X,
} from "lucide-react";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const navSections = [
    {
      group: "Bulk Operations",
      items: [
        {
          id: "link-generator" as ActiveTab,
          label: "Hyperlink Suite",
          icon: Link2,
          emoji: "🔗",
        },
        {
          id: "bulk-opener" as ActiveTab,
          label: "URL Bulk Opener",
          icon: ExternalLink,
          emoji: "📂",
        },
        {
          id: "url-cleaner" as ActiveTab,
          label: "Protocol & Dupe Cleaner",
          icon: Scissors,
          emoji: "✂️",
        },
      ],
    },
    {
      group: "Domain Metrics",
      items: [
        {
          id: "domain-metrics" as ActiveTab,
          label: "Moz / Ahrefs / Semrush",
          icon: BarChart3,
          emoji: "📊",
        },
        {
          id: "keyword-difficulty" as ActiveTab,
          label: "Keyword Difficulty",
          icon: Search,
          emoji: "🔎",
        },
      ],
    },
    {
      group: "Tracking",
      items: [
        {
          id: "rank-tracker" as ActiveTab,
          label: "Rank Tracker",
          icon: Globe2,
          emoji: "📍",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Aside Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E9ECEF] flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E9ECEF] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#0984E3] rounded flex items-center justify-center text-white font-bold text-sm shadow-xs">
                A
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#2D3436]">
                ASA Tool
              </h1>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#B2BEC3] mt-1 font-semibold">
              Pro SEO Optimizer
            </p>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#636E72] hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={section.group} className={idx > 0 ? "mt-6" : ""}>
              <div className="px-6 mb-2 text-[11px] font-bold text-[#636E72] uppercase tracking-wider">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center px-6 py-3 text-sm transition-colors text-left ${
                        isActive
                          ? "bg-[#EBF5FF] text-[#0984E3] border-r-4 border-[#0984E3] font-semibold"
                          : "text-[#636E72] hover:bg-gray-50 hover:text-[#2D3436] font-medium"
                      }`}
                    >
                      <span className="mr-3 text-base">{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status Footer */}
        <div className="p-4 bg-gray-50 border-t border-[#E9ECEF]">
          <div className="text-xs text-[#636E72] font-medium">System Status</div>
          <div className="flex items-center mt-1 text-[11px] text-emerald-600 font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
            All Services Online
          </div>
        </div>
      </aside>
    </>
  );
};
