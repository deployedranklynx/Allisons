import React from "react";
import { Sparkles, ShieldCheck, Zap, Users, Globe2, Award, ArrowRight } from "lucide-react";
import { ActiveTab } from "../types";

export const AboutPage: React.FC<{ onSelectTab: (tab: ActiveTab) => void }> = ({ onSelectTab }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0984E3] border border-blue-100 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Our Platform</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          Empowering Webmasters, Marketers & Founders Worldwide
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
          RankLynx is a comprehensive suite of high-performance utilities built for digital entrepreneurs,
          SEO specialists, webmasters, and modern agencies. We believe essential web tooling—from business
          name generation to bulk URL inspection and hyperlink engineering—should be fast, reliable, and
          free of unnecessary paywalls.
        </p>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0984E3] flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] mb-2">Zero Bloat & Fast</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Our tools execute client-side or on ultra-fast edge nodes. We eliminate heavy bloated scripts
            and convoluted workflows so you get instant results.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] mb-2">Privacy-First Architecture</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your lists, generated names, and proprietary marketing keywords remain confidential. We do not
            harvest, sell, or monetize your search data.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] mb-2">Modern Algorithmic Precision</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            From smart brand phonetics to multi-hop redirect tracing, our tools leverage verified industry
            standards and cutting-edge algorithms.
          </p>
        </div>
      </div>

      {/* Story / Mission */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-[#0F172A]">Our Mission</h2>
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
          Building and scaling an online business involves dozens of repetitive tasks: finding the perfect
          brand name, cleaning messy tracking parameters from URLs, checking redirect status codes, converting
          word documents without mangling HTML markup, and monitoring SERP rankings.
        </p>
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
          RankLynx unites these mission-critical utilities under one elegant, beginner-friendly interface.
          Whether you're brainstorming your very first brand with our Business Name Generator or executing
          an enterprise redirect audit, our platform is designed to make you 10x more productive.
        </p>

        <div className="pt-4 flex flex-wrap gap-3">
          <button
            onClick={() => onSelectTab("business-name-generator")}
            className="px-4 py-2 rounded-xl bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Try Business Name Generator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTab("landing")}
            className="px-4 py-2 rounded-xl border border-[#CBD5E1] hover:bg-slate-50 text-[#0F172A] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Explore All Tools</span>
          </button>
        </div>
      </div>
    </div>
  );
};
