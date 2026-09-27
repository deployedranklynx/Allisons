import React, { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle2, Clock, Globe, Shield } from "lucide-react";
import { SiteCustomization } from "../types";

export const ContactPage: React.FC<{ siteSettings?: SiteCustomization }> = ({ siteSettings }) => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "Business Name Generator Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormState({ name: "", email: "", subject: "Business Name Generator Inquiry", message: "" });
    }, 600);
  };

  const supportEmail = siteSettings?.socialLinks?.email || "support@ranklynx.com";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0984E3] border border-blue-100 mb-3">
          <Mail className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Contact Our Engineering & Support Team
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed max-w-2xl">
          Have feedback on the Business Name Generator, a feature request, or an inquiry regarding
          advertising and sponsorships? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Contact Form */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A]">Message Received!</h2>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Thank you for reaching out. Our team reviews all messages and will respond to your email
                within 24–48 business hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-[#0984E3] hover:underline cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-[#0F172A] mb-1">Send Us a Direct Message</h2>
              <p className="text-xs text-[#64748B] mb-4">
                Fill out the form below and we will get back to you promptly.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Subject</label>
                <select
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                >
                  <option value="Business Name Generator Inquiry">Business Name Generator Inquiry</option>
                  <option value="Feature Suggestion">Feature Suggestion</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Advertising & Sponsorship">Advertising & Sponsorship</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder="Tell us what's on your mind or how we can assist you..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0984E3] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "Sending..." : "Submit Inquiry"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info & Response Times */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A]">Direct Communication</h2>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-[#0984E3]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0F172A]">Email Inquiries</div>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-xs text-[#0984E3] hover:underline break-all"
                >
                  {supportEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0F172A]">Average Response Time</div>
                <div className="text-xs text-[#64748B]">Within 24–48 Business Hours</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0F172A]">Privacy Guarantee</div>
                <div className="text-xs text-[#64748B]">We never share your email with third parties.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
