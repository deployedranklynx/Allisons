import React, { useState, useEffect, useRef, useId } from "react";
import QRCode from "qrcode";
import {
  QrCode as QrIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  FileText,
  Wifi,
  Mail,
  Phone,
  Contact,
  Palette,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Smartphone,
  Info,
} from "lucide-react";
import { AdBanner } from "./AdBanner";
import { AdItem } from "../types";

export type QrContentType = "url" | "text" | "wifi" | "email" | "phone";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const COLOR_PRESETS = [
  { name: "Classic Black", hex: "#000000", bg: "#FFFFFF" },
  { name: "Slate Dark", hex: "#0F172A", bg: "#F8FAFC" },
  { name: "Electric Blue", hex: "#0984E3", bg: "#FFFFFF" },
  { name: "Emerald Green", hex: "#059669", bg: "#FFFFFF" },
  { name: "Royal Indigo", hex: "#4F46E5", bg: "#FFFFFF" },
  { name: "Sunset Crimson", hex: "#E11D48", bg: "#FFFFFF" },
  { name: "Deep Violet", hex: "#7C3AED", bg: "#FFFFFF" },
  { name: "Charcoal & Cream", hex: "#1E293B", bg: "#FEFCE8" },
];

export const QrCodeGenerator: React.FC<{ ads?: AdItem[] }> = ({ ads = [] }) => {
  const [contentType, setContentType] = useState<QrContentType>("url");

  // Input states
  const [urlInput, setUrlInput] = useState<string>("https://ranklynx.com");
  const [textInput, setTextInput] = useState<string>("Hello, welcome to RankLynx Pro Utilities!");
  // WiFi states
  const [wifiSsid, setWifiSsid] = useState<string>("Office_HighSpeed_5G");
  const [wifiPassword, setWifiPassword] = useState<string>("SecretPass2026");
  const [wifiSecurity, setWifiSecurity] = useState<string>("WPA");
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);
  // Email states
  const [emailTo, setEmailTo] = useState<string>("support@ranklynx.com");
  const [emailSubject, setEmailSubject] = useState<string>("Feedback on Webmaster Tools");
  const [emailBody, setEmailBody] = useState<string>("Hi team, I really like the new generator suite!");
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState<string>("+15550192834");

  // Styling states
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#FFFFFF");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>("M");
  const [resolutionSize, setResolutionSize] = useState<number>(512);
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);

  // Generated QR output state
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvgString, setQrSvgString] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCopiedData, setIsCopiedData] = useState<boolean>(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Construct raw string to encode
  const rawString = (() => {
    switch (contentType) {
      case "url": {
        const trimmed = urlInput.trim();
        if (!trimmed) return "https://ranklynx.com";
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      }
      case "text":
        return textInput.trim() || "RankLynx Free Utilities";
      case "wifi":
        return `WIFI:T:${wifiSecurity};S:${wifiSsid};P:${wifiPassword};H:${wifiHidden ? "true" : "false"};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        return `tel:${phoneNumber.replace(/\s+/g, "")}`;
      default:
        return urlInput;
    }
  })();

  // Generate QR Code dynamically
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const generateQr = async () => {
      try {
        const options: QRCode.QRCodeToDataURLOptions = {
          errorCorrectionLevel: errorCorrection,
          margin: includeMargin ? 3 : 1,
          width: resolutionSize,
          color: {
            dark: fgColor,
            light: bgColor === "transparent" ? "#00000000" : bgColor,
          },
        };

        const dataUrl = await QRCode.toDataURL(rawString, options);
        const svgString = await QRCode.toString(rawString, {
          type: "svg",
          errorCorrectionLevel: errorCorrection,
          margin: includeMargin ? 3 : 1,
          color: {
            dark: fgColor,
            light: bgColor === "transparent" ? "#00000000" : bgColor,
          },
        });

        if (!isCancelled) {
          setQrDataUrl(dataUrl);
          setQrSvgString(svgString);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("QR generation error:", err);
        if (!isCancelled) setIsGenerating(false);
      }
    };

    const timer = setTimeout(generateQr, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [rawString, fgColor, bgColor, errorCorrection, resolutionSize, includeMargin]);

  // Download PNG
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    const cleanFileName = `qrcode-${contentType}-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.download = cleanFileName;
    link.click();
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${contentType}-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      if (!qrDataUrl) return;
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback: Copy data URL
      navigator.clipboard.writeText(qrDataUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Copy Encoded Content String
  const handleCopyRawContent = () => {
    navigator.clipboard.writeText(rawString);
    setIsCopiedData(true);
    setTimeout(() => setIsCopiedData(false), 2000);
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFgColor(preset.hex);
    setBgColor(preset.bg);
  };

  const faqs = [
    {
      q: "Do these generated QR codes ever expire?",
      a: "No! These are standard static QR codes. The encoded information (URL, WiFi credentials, plain text, or email) is stored directly within the 2D visual matrix itself. They will work forever without any expiration date or subscription.",
    },
    {
      q: "Can I use these QR codes for commercial products, flyers, and menus?",
      a: "Yes, 100% free with no royalties, sign-ups, or watermarks. You can download high-resolution PNG or SVG files suitable for print media, restaurant table tents, product packaging, and billboard banners.",
    },
    {
      q: "What color contrast should I maintain for reliable scanning?",
      a: "Always ensure strong contrast between the QR code pattern and its background. For maximum reliability across all smartphone cameras, keep the QR code dark (e.g. black, navy, dark green) on a light or white background.",
    },
    {
      q: "What is Error Correction Level (L, M, Q, H)?",
      a: "Error correction allows a QR code to remain fully scannable even if partially covered, damaged, or smudged. Level L recovers 7% of missing data, Level M recovers 15%, Level Q recovers 25%, and Level H recovers up to 30%. Level M is recommended for general use, and Level H for printed signage.",
    },
    {
      q: "What is the minimum recommended size for printing a QR code?",
      a: "For standard viewing distances (such as business cards or menus), the printed QR code should be at least 2 x 2 cm (0.8 x 0.8 inches). For posters, multiply the scanning distance by 10% (e.g. from 10 feet away, print a 1-foot wide QR code).",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2.5">
              <QrIcon className="w-3.5 h-3.5" />
              <span>Instant Vector & High-Res QR Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Free QR Code Generator
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Generate instant, custom-colored QR codes for websites, plain text, WiFi passwords, and emails.
              No sign-up required, no expiration, and free commercial-grade PNG and SVG downloads.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPng}
              className="px-4 py-2.5 rounded-xl bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors cursor-pointer"
              title="Download Scalable Vector Graphics"
            >
              SVG Vector
            </button>
          </div>
        </div>

        {/* Content Type Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setContentType("url")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contentType === "url"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Website URL</span>
          </button>

          <button
            type="button"
            onClick={() => setContentType("text")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contentType === "text"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>

          <button
            type="button"
            onClick={() => setContentType("wifi")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contentType === "wifi"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>WiFi Network</span>
          </button>

          <button
            type="button"
            onClick={() => setContentType("email")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contentType === "email"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email (Mailto)</span>
          </button>

          <button
            type="button"
            onClick={() => setContentType("phone")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contentType === "phone"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-slate-300"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone Dial</span>
          </button>
        </div>
      </div>

      {/* AD PLACEHOLDER 1: Top Responsive Banner */}
      <div className="w-full">
        {ads.length > 0 ? (
          <AdBanner placement="tool_banner" ads={ads} />
        ) : (
          <div className="w-full rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#64748B]">
              <span className="px-2 py-0.5 rounded bg-slate-200 text-[#475569] text-[10px] font-bold uppercase tracking-wider">
                Ad
              </span>
              <span>Sponsored Partner — Custom Business Cards, Menus & Smart NFC Stands</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Print your custom QR codes on premium matte cards and acrylic table displays with free 2-day delivery.
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Input & Styling Controls on Left, Live Sticky QR Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Styling */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Content Input */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0984E3]" />
              <span>1. Enter Content to Encode</span>
            </h2>

            {contentType === "url" && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Target Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourwebsite.com/promotion"
                    className="w-full px-3.5 py-2.5 pl-10 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-medium focus:outline-none focus:border-[#0984E3]"
                  />
                  <Link2 className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1.5">
                  Users who scan this QR code will instantly open this URL in their default browser.
                </p>
              </div>
            )}

            {contentType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Plain Text or Message
                </label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter any text, wifi notes, serial number, or instructions..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#0984E3] resize-none"
                />
                <div className="flex justify-between items-center text-[11px] text-[#94A3B8] mt-1">
                  <span>Characters encoded: {textInput.length}</span>
                  <span>Max ~2,000 characters recommended</span>
                </div>
              </div>
            )}

            {contentType === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    WiFi Network Name (SSID) *
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Guest_WiFi_5G"
                    className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Network Password
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Encryption Type
                    </label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded text-[#0984E3] focus:ring-0"
                  />
                  <span className="text-xs text-[#64748B]">Hidden Network (SSID not broadcast)</span>
                </label>
              </div>
            )}

            {contentType === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Pre-filled Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Question regarding product"
                    className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Pre-filled Body Message
                  </label>
                  <textarea
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your email body..."
                    className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3] resize-none"
                  />
                </div>
              </div>
            )}

            {contentType === "phone" && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3.5 py-2.5 pl-10 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-medium focus:outline-none focus:border-[#0984E3]"
                  />
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1.5">
                  When scanned, smartphones will prompt the user to call this number with a single tap.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Colors & Visual Palette */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#0984E3]" />
                <span>2. Customize Colors & Themes</span>
              </h2>
            </div>

            {/* Quick Color Presets */}
            <div>
              <span className="block text-xs font-semibold text-[#64748B] mb-2">
                Popular Brand Color Combos
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((p) => {
                  const isMatch = fgColor === p.hex && bgColor === p.bg;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyColorPreset(p)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                        isMatch
                          ? "border-[#0984E3] bg-blue-50/70 text-[#0984E3]"
                          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-white"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  QR Pattern (Foreground)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#CBD5E1] cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor === "transparent" ? "#ffffff" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#CBD5E1] cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Advanced Precision Controls */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0984E3]" />
              <span>3. Resolution & Error Correction</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Resolution Size (Pixels)
                </label>
                <select
                  value={resolutionSize}
                  onChange={(e) => setResolutionSize(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                >
                  <option value={256}>256 x 256 px (Web & Screen)</option>
                  <option value={512}>512 x 512 px (Standard HD)</option>
                  <option value={1024}>1024 x 1024 px (Print & Menus)</option>
                  <option value={2048}>2048 x 2048 px (Ultra Vector)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Error Correction
                </label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                >
                  <option value="L">Level L (7% Recovery - Crisp)</option>
                  <option value="M">Level M (15% Recovery - Standard)</option>
                  <option value="Q">Level Q (25% Recovery)</option>
                  <option value="H">Level H (30% Recovery - Print)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Quiet Zone Margin
                </label>
                <button
                  type="button"
                  onClick={() => setIncludeMargin(!includeMargin)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-left flex items-center justify-between ${
                    includeMargin
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]"
                  }`}
                >
                  <span>{includeMargin ? "Margin Enabled" : "Tight Border"}</span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${includeMargin ? "text-emerald-600" : "text-slate-300"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Sticky QR Preview Card */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-[#0F172A]">Live Interactive Preview</h3>
              </div>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                {resolutionSize}x{resolutionSize}px
              </span>
            </div>

            {/* Visual QR Code Display Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div
                className="p-4 rounded-xl shadow-xs transition-transform hover:scale-[1.02] flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: bgColor === "transparent" ? "#FFFFFF" : bgColor,
                }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain transition-opacity duration-200"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-[#94A3B8]">
                    Generating QR pattern...
                  </div>
                )}
              </div>

              {/* Encoded Content Snippet & Verification */}
              <div className="mt-4 w-full bg-white p-3 rounded-xl border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-0.5">
                  Encoded Target Data:
                </span>
                <p className="text-xs font-mono text-[#0F172A] truncate max-w-full" title={rawString}>
                  {rawString}
                </p>

                {contentType === "url" && (
                  <a
                    href={rawString}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0984E3] hover:underline mt-1.5"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="w-full py-3 px-4 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG ({resolutionSize}px)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Mobile Scan Tip */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-[#0984E3]">
              <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Scan test:</strong> Point your iOS or Android camera at your screen to test the live code instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AD PLACEHOLDER 2: Middle Native Print Service Placement */}
      <div className="w-full bg-white rounded-xl border border-dashed border-[#CBD5E1] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-sm">
            Ad
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">
              Print 500 Custom Business Cards with Your QR Code for $19.99
            </div>
            <div className="text-[11px] text-[#64748B]">
              Premium 16pt cardstock, soft-touch matte finish, and sharp vector print reproduction.
            </div>
          </div>
        </div>
        <button
          onClick={() => window.open("https://www.vistaprint.com", "_blank")}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shrink-0 cursor-pointer"
        >
          Order Prints
        </button>
      </div>

      {/* Section: How QR Codes Work */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            How QR Codes Work & Why They Are Everywhere
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6 max-w-2xl leading-relaxed">
          QR (Quick Response) codes were invented in 1994 by Denso Wave to track automotive components.
          Today, they are the universal bridge connecting the physical and digital world:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                1
              </span>
              <span>2D Matrix Encoding</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Unlike traditional 1D barcodes that only store numbers horizontally, QR codes encode binary
              data in both horizontal and vertical axes, holding over 7,000 characters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Position Detection Patterns</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              The three large squares in the corners allow camera lenses and scanner sensors to instantly identify
              the code's orientation and boundary perspective from any 360-degree angle.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Reed-Solomon Error Correction</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Advanced mathematical parity bytes ensure that even if up to 30% of the code is torn, stained,
              scratched, or covered by a logo, the smartphone can reconstruct the original payload.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Universal Native Scanning</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Every modern iOS and Android device has built-in QR decoding right inside the default camera app,
              eliminating the need for any third-party app installations.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Frequently Asked Questions (FAQ) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6">
          Everything you need to know about creating, printing, and scanning free static QR codes.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={faq.q}
                className="border border-[#E2E8F0] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left bg-[#F8FAFC] hover:bg-slate-100 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#64748B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs text-[#475569] leading-relaxed border-t border-[#E2E8F0]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
