import React from "react";
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { SiteCustomization } from "../types";

export const TermsOfUsePage: React.FC<{ siteSettings?: SiteCustomization }> = ({ siteSettings }) => {
  const siteName = siteSettings?.siteName || "RankLynx";
  const updatedDate = "October 2025";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Terms of Use
        </h1>
        <p className="text-xs text-[#64748B] mt-2">
          Last revised: {updatedDate} • Please review these terms carefully before utilizing our services.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[#475569] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">1. Acceptance of Terms</h2>
          <p>
            By accessing or using {siteName}, including our Business Name Generator, URL Opener, Bulk URL
            Checker, and document converters, you agree to be bound by these Terms of Use and all applicable
            laws and regulations. If you do not agree with any of these terms, you are prohibited from using
            this site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">2. Business Name Generator Disclaimer & Trademarks</h2>
          <p>
            Our Business Name Generator uses algorithmic permutations and creative vocabulary to produce
            naming suggestions. However:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
            <li>
              Generation of a name does <strong>not</strong> constitute legal clearance, trademark availability,
              or an official guarantee of domain ownership.
            </li>
            <li>
              You are solely responsible for conducting legal trademark searches (e.g. through the United States
              Patent and Trademark Office - USPTO, WIPO, or your local national trademark registry) before registering
              a business, investing in marketing materials, or filing legal articles of incorporation.
            </li>
            <li>
              {siteName} holds no claim of ownership or intellectual property over the names you generate and adopt.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">3. Acceptable Use Policy</h2>
          <p>
            You agree to use our tools only for lawful purposes. You must not:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#64748B]">
            <li>Use automated scrapers, bots, or denial-of-service tactics to disrupt platform infrastructure.</li>
            <li>Input malicious scripts, malware, or illicit URLs into our webmaster inspection tools.</li>
            <li>Attempt to reverse-engineer proprietary server code or bypass security constraints.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">4. Disclaimer of Warranties</h2>
          <p>
            The materials and tools on {siteName} are provided on an 'as is' and 'as available' basis.
            We make no warranties, expressed or implied, regarding 100% server uptime, algorithmic outcomes,
            or third-party domain registrar prices and availability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">5. Limitation of Liability</h2>
          <p>
            In no event shall {siteName}, its creators, or partners be liable for any indirect, incidental,
            or consequential damages arising out of the use or inability to use the tools, even if advised
            of the possibility of such damages.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0F172A]">6. Modifications to Terms</h2>
          <p>
            We may revise these Terms of Use at any time without prior notice. By continuing to use the
            site, you agree to be bound by the current version of these terms.
          </p>
        </section>
      </div>
    </div>
  );
};
