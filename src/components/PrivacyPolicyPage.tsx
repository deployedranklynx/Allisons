import React from "react";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle } from "lucide-react";
import { SiteCustomization } from "../types";

export const PrivacyPolicyPage: React.FC<{ siteSettings?: SiteCustomization }> = ({ siteSettings }) => {
  const siteName = siteSettings?.siteName || "RankLynx";
  const updatedDate = "October 2025";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Transparency & Data Security</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#64748B] mt-2">
          Last updated: {updatedDate} • Effective immediately for all visitors and tool users.
        </p>
      </div>

      {/* Main Content Body */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[#475569] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">1. Overview & Commitment</h2>
          <p>
            At {siteName}, we respect your personal privacy. This Privacy Policy outlines the types of
            information we collect, how it is used, and the steps we take to protect your data across
            our web applications, including our Business Name Generator, URL utilities, and SEO tooling.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">2. Information You Provide & Client-Side Execution</h2>
          <p>
            Most of our interactive tools—such as the Business Name Generator, Protocol Cleaner, and
            Duplicate Remover—run directly in your web browser (client-side). When you enter search
            keywords, niche parameters, or draft business names:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
            <li>Your input keywords and brainstormed lists are not recorded or sold to third parties.</li>
            <li>Saved favorites are stored locally within your browser session (sessionStorage/localStorage).</li>
            <li>We do not monitor or patent any name ideas you discover using our generator.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">3. Cookies, Analytics & Advertising (Google AdSense)</h2>
          <p>
            To keep our tools free for webmasters and entrepreneurs worldwide, we display contextual
            advertising and sponsor banners, including through partners such as Google AdSense.
          </p>
          <p>
            Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits
            to our website or other websites. Google's use of advertising cookies enables it and its
            partners to serve ads to users based on their visit to our sites and/or other sites on the Internet.
          </p>
          <p>
            Users may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noreferrer"
              className="text-[#0984E3] underline"
            >
              Google Ads Settings
            </a>
            . Alternatively, you can opt out of third-party vendor cookies by visiting{" "}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noreferrer"
              className="text-[#0984E3] underline"
            >
              aboutads.info
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">4. Third-Party Links & Domain Registrars</h2>
          <p>
            Our Business Name Generator and domain metrics tools provide external links to registrar
            services (e.g. Namecheap, WHOIS databases, and USPTO trademark registries) for your convenience.
            Once you leave {siteName}, the privacy practices of those external sites govern your interaction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">5. GDPR & CCPA Compliance</h2>
          <p>
            In compliance with the General Data Protection Regulation (GDPR) and California Consumer Privacy
            Act (CCPA), you retain the right to access, rectify, or request the deletion of any personal data
            you intentionally submit to us (such as support emails). Contact us at any time to exercise your rights.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">6. Contact Information</h2>
          <p>
            If you have questions regarding this Privacy Policy or our data handling practices, please
            contact us via our dedicated contact page or email us at{" "}
            <span className="font-semibold text-[#0F172A]">
              {siteSettings?.socialLinks?.email || "support@ranklynx.com"}
            </span>
            .
          </p>
        </section>
      </div>
    </div>
  );
};
