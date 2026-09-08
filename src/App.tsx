/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ActiveTab } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BulkLinkGenerator } from "./components/BulkLinkGenerator";
import { UrlCleaner } from "./components/UrlCleaner";
import { BulkUrlOpener } from "./components/BulkUrlOpener";
import { DomainMetricsChecker } from "./components/DomainMetricsChecker";
import { KeywordDifficultyChecker } from "./components/KeywordDifficultyChecker";
import { RankTracker } from "./components/RankTracker";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("link-generator");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] text-[#2D3436] font-sans overflow-hidden">
      {/* Clean Minimalism Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Scrollable View Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FA]">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === "link-generator" && <BulkLinkGenerator />}
            {activeTab === "url-cleaner" && <UrlCleaner />}
            {activeTab === "bulk-opener" && <BulkUrlOpener />}
            {activeTab === "domain-metrics" && <DomainMetricsChecker />}
            {activeTab === "keyword-difficulty" && <KeywordDifficultyChecker />}
            {activeTab === "rank-tracker" && <RankTracker />}
          </div>
        </div>
      </main>
    </div>
  );
}
