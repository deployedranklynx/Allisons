import React from "react";
import { ActiveTab, SiteCustomization } from "../types";
import {
  Globe,
  Twitter,
  Linkedin,
  Github,
  Mail,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Sparkles,
} from "lucide-react";

interface FooterProps {
  onSelectTab: (tab: ActiveTab) => void;
  siteSettings: SiteCustomization;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, siteSettings }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-auto">
      {/* Upper Footer: Brand, Navigation, Social */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-8 border-b border-[#F1F5F9]">
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {siteSettings.footerLogoUrl ? (
                  <img
                    src={siteSettings.footerLogoUrl}
                    alt={siteSettings.siteName}
                    className="h-8 max-w-[140px] object-contain rounded"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : siteSettings.headerLogoType === "image" && siteSettings.headerLogoUrl ? (
                  <img
                    src={siteSettings.headerLogoUrl}
                    alt={siteSettings.siteName}
                    className="h-8 max-w-[140px] object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-[#0984E3] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    {siteSettings.headerLogoIconLetter || "R"}
                  </div>
                )}
                <div>
                  <span className="font-bold text-base text-[#0F172A] tracking-tight">
                    {siteSettings.siteName || "RankLynx"}
                  </span>
                  <span className="text-xs text-[#64748B] ml-2 font-medium">
                    | {siteSettings.headerTagline || "Pro SEO Optimizer"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
                {siteSettings.footerDescription ||
                  "All-in-one professional link generator, bulk URL opener, protocol cleaner, domain metrics inspector, and editorial SEO intelligence suite for digital webmasters."}
              </p>
            </div>

            {/* Social & Outreach links */}
            <div className="flex items-center gap-3 mt-4 pt-2">
              {siteSettings.socialLinks?.twitter && (
                <a
                  href={siteSettings.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  title="Twitter / X"
                  className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0984E3] hover:border-[#0984E3]/40 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              )}
              {siteSettings.socialLinks?.linkedin && (
                <a
                  href={siteSettings.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0984E3] hover:border-[#0984E3]/40 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
              {siteSettings.socialLinks?.github && (
                <a
                  href={siteSettings.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  title="GitHub"
                  className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0984E3] hover:border-[#0984E3]/40 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                </a>
              )}
              {siteSettings.socialLinks?.email && (
                <a
                  href={`mailto:${siteSettings.socialLinks.email}`}
                  title="Contact Support"
                  className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0984E3] hover:border-[#0984E3]/40 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
              {/* Webmaster / ads.txt direct check button */}
              <a
                href="/ads.txt"
                target="_blank"
                rel="noreferrer"
                title="View live ads.txt file"
                className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <FileCode className="w-3 h-3 text-emerald-600" />
                <span>ads.txt</span>
              </a>
            </div>
          </div>

          {/* Quick Tools Column */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              SEO & Webmaster Tools
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#475569]">
              <button
                onClick={() => onSelectTab("link-generator")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Hyperlink Suite
              </button>
              <button
                onClick={() => onSelectTab("bulk-opener")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Bulk URL Opener
              </button>
              <button
                onClick={() => onSelectTab("url-cleaner")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Protocol Cleaner
              </button>
              <button
                onClick={() => onSelectTab("domain-metrics")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Domain Metrics
              </button>
              <button
                onClick={() => onSelectTab("keyword-difficulty")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Keyword Difficulty
              </button>
              <button
                onClick={() => onSelectTab("rank-tracker")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                SERP Rank Tracker
              </button>
            </div>
          </div>

          {/* Editorial & Webmaster Column */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Resources & Editorial
            </h4>
            <div className="flex flex-col gap-2 text-xs font-medium text-[#475569]">
              <button
                onClick={() => onSelectTab("blog")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 flex items-center gap-1.5 text-[#0984E3] font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Classique Editorial Blog</span>
              </button>
              <button
                onClick={() => onSelectTab("landing")}
                className="text-left hover:text-[#0984E3] transition-colors py-1 cursor-pointer"
              >
                Platform Overview & Guide
              </button>
            </div>
          </div>
        </div>

        {/* Lower Footer: Copyright & Disclaimers */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>
            {siteSettings.footerCopyright ||
              `© ${currentYear} ${siteSettings.siteName || "RankLynx"}. Free Professional SEO Toolkit.`}
          </p>
          <p className="text-center sm:text-right">
            {siteSettings.footerDisclaimer ||
              "Designed for SEO specialists, outreach teams & digital webmasters."}
          </p>
        </div>
      </div>
    </footer>
  );
};
