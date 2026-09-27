import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Printer,
  Eye,
  Edit3,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  RefreshCw,
  Building2,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  FileCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { AdBanner } from "./AdBanner";
import { AdItem } from "../types";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", name: "US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "Euro (€)" },
  { code: "GBP", symbol: "£", name: "British Pound (£)" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CA$)" },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar (AU$)" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen (¥)" },
  { code: "INR", symbol: "₹", name: "Indian Rupee (₹)" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee (₨)" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham (AED)" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc (CHF)" },
  { code: "SGD", symbol: "SG$", name: "Singapore Dollar (SG$)" },
];

const THEME_COLORS: Record<string, { label: string; primary: string; lightBg: string; pdfRgb: [number, number, number] }> = {
  blue: { label: "Modern Blue", primary: "#0984E3", lightBg: "#EFF6FF", pdfRgb: [0.035, 0.518, 0.89] },
  charcoal: { label: "Classic Slate", primary: "#0F172A", lightBg: "#F8FAFC", pdfRgb: [0.06, 0.09, 0.16] },
  emerald: { label: "Forest Emerald", primary: "#059669", lightBg: "#ECFDF5", pdfRgb: [0.02, 0.59, 0.41] },
  purple: { label: "Royal Indigo", primary: "#6366F1", lightBg: "#EEF2FF", pdfRgb: [0.39, 0.4, 0.95] },
  rose: { label: "Crimson Rose", primary: "#E11D48", lightBg: "#FFF1F2", pdfRgb: [0.88, 0.11, 0.28] },
};

export const InvoiceGenerator: React.FC<{ ads?: AdItem[] }> = ({ ads = [] }) => {
  // Business info
  const [businessName, setBusinessName] = useState<string>("PixelCraft Creative Agency");
  const [businessEmail, setBusinessEmail] = useState<string>("billing@pixelcraft.agency");
  const [businessAddress, setBusinessAddress] = useState<string>("120 Innovation Way, Suite 400");
  const [businessCityZip, setBusinessCityZip] = useState<string>("San Francisco, CA 94107");
  const [businessPhone, setBusinessPhone] = useState<string>("+1 (415) 555-0192");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Client info
  const [clientName, setClientName] = useState<string>("Apex Global Ventures");
  const [clientEmail, setClientEmail] = useState<string>("accounts@apexventures.com");
  const [clientAddress, setClientAddress] = useState<string>("750 Commercial Blvd, Tower B");
  const [clientCityZip, setClientCityZip] = useState<string>("New York, NY 10001");
  const [clientPhone, setClientPhone] = useState<string>("+1 (212) 555-8392");

  // Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState<string>("INV-2026-081");
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [poNumber, setPoNumber] = useState<string>("PO-94821");

  // Currency & Themes
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[0]);
  const [themeColorKey, setThemeColorKey] = useState<string>("blue");

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item-1",
      description: "Frontend Web Application Design & UI Kit Development",
      quantity: 1,
      price: 2400,
    },
    {
      id: "item-2",
      description: "Technical SEO Audit, URL Sanitization & Canonical Architecture",
      quantity: 12,
      price: 150,
    },
    {
      id: "item-3",
      description: "Performance Optimization, Core Web Vitals & Caching Setup",
      quantity: 1,
      price: 850,
    },
  ]);

  // Adjustments (Tax, Discount, Shipping)
  const [taxPercent, setTaxPercent] = useState<number>(8.5);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Notes & Payment terms
  const [notes, setNotes] = useState<string>(
    "Thank you for choosing PixelCraft! Please remit payment within 14 business days via wire transfer or ACH."
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    "Bank: Silicon Valley Bank • Account: 9840-2391-49 • Routing: 121000358 • Swift: SVBUS6S"
  );

  // View Mode: 'edit', 'preview', or 'split'
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.price) || 0), 0);
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(taxPercent) || 0)) / 100;
  const total = taxableAmount + taxAmount + (Number(shippingFee) || 0);

  const formatMoney = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Add line item
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      description: "",
      quantity: 1,
      price: 0,
    };
    setItems([...items, newItem]);
  };

  // Update line item
  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Preset loaders
  const loadPreset = (type: "agency" | "freelance" | "blank") => {
    if (type === "agency") {
      setBusinessName("Stratosphere Media & Digital Labs");
      setBusinessEmail("invoicing@stratosphere.io");
      setBusinessAddress("500 Tech Parkway, Suite 1200");
      setBusinessCityZip("Austin, TX 78701");
      setClientName("OmniCorp International");
      setClientEmail("finance@omnicorp.com");
      setClientAddress("452 Lexington Ave, Floor 18");
      setClientCityZip("New York, NY 10017");
      setInvoiceNumber("INV-2026-901");
      setItems([
        { id: "i1", description: "Full-Stack Web Application Architecture", quantity: 40, price: 125 },
        { id: "i2", description: "Cloud Infrastructure Setup & CI/CD Pipelines", quantity: 1, price: 1500 },
        { id: "i3", description: "Security Audit & Vulnerability Assessment", quantity: 1, price: 1200 },
      ]);
      setTaxPercent(8.25);
      setDiscountPercent(5);
    } else if (type === "freelance") {
      setBusinessName("Elena Vance — Creative Copywriter & Brand Strategist");
      setBusinessEmail("elena@vancewords.com");
      setBusinessAddress("742 Evergreen Terrace");
      setBusinessCityZip("Portland, OR 97201");
      setClientName("BrightPath EdTech");
      setClientEmail("sarah@brightpathed.com");
      setClientAddress("1200 Beacon St");
      setClientCityZip("Boston, MA 02116");
      setInvoiceNumber("INV-2026-034");
      setItems([
        { id: "i1", description: "Homepage & Landing Page Copywriting (3 variants)", quantity: 1, price: 950 },
        { id: "i2", description: "Email Onboarding Sequence (5 Drip Emails)", quantity: 5, price: 180 },
        { id: "i3", description: "Brand Voice Guidelines Document", quantity: 1, price: 600 },
      ]);
      setTaxPercent(0);
      setDiscountPercent(0);
    } else {
      setBusinessName("");
      setBusinessEmail("");
      setBusinessAddress("");
      setBusinessCityZip("");
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setClientCityZip("");
      setInvoiceNumber("INV-001");
      setItems([{ id: "blank-1", description: "", quantity: 1, price: 0 }]);
      setTaxPercent(0);
      setDiscountPercent(0);
      setShippingFee(0);
    }
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please upload an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setLogoDataUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Native Vector PDF Generation via pdf-lib
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const pdfDoc = await PDFDocument.create();
      // Standard A4: 595.28 x 841.89 points
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const theme = THEME_COLORS[themeColorKey] || THEME_COLORS.blue;
      const primaryColor = rgb(theme.pdfRgb[0], theme.pdfRgb[1], theme.pdfRgb[2]);
      const darkText = rgb(0.06, 0.09, 0.16);
      const grayText = rgb(0.39, 0.45, 0.55);
      const lightBorder = rgb(0.89, 0.91, 0.94);
      const lightBg = rgb(0.97, 0.98, 0.99);

      // Embed logo if provided
      let logoImage: any = null;
      if (logoDataUrl) {
        try {
          if (logoDataUrl.startsWith("data:image/png")) {
            logoImage = await pdfDoc.embedPng(logoDataUrl);
          } else if (logoDataUrl.startsWith("data:image/jpeg") || logoDataUrl.startsWith("data:image/jpg")) {
            logoImage = await pdfDoc.embedJpg(logoDataUrl);
          }
        } catch {
          // If format unsupported, skip image embedding safely
        }
      }

      let y = height - 50;

      // Top Header Bar
      page.drawRectangle({
        x: 40,
        y: y - 55,
        width: width - 80,
        height: 60,
        color: lightBg,
      });

      // Accent border on top
      page.drawRectangle({
        x: 40,
        y: y + 5,
        width: width - 80,
        height: 4,
        color: primaryColor,
      });

      // Invoice Title
      page.drawText("INVOICE", {
        x: 55,
        y: y - 25,
        size: 22,
        font: fontBold,
        color: primaryColor,
      });

      // Invoice # & Due Date in top right
      const invNumStr = `# ${invoiceNumber || "INV-001"}`;
      const invNumWidth = fontBold.widthOfTextAtSize(invNumStr, 12);
      page.drawText(invNumStr, {
        x: width - 55 - invNumWidth,
        y: y - 20,
        size: 12,
        font: fontBold,
        color: darkText,
      });

      const dateStr = `Date: ${issueDate}  |  Due: ${dueDate}`;
      const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 9);
      page.drawText(dateStr, {
        x: width - 55 - dateWidth,
        y: y - 38,
        size: 9,
        font: fontRegular,
        color: grayText,
      });

      y -= 80;

      // Draw Logo or Company Initials Box
      if (logoImage) {
        const logoDims = logoImage.scale(Math.min(45 / logoImage.height, 90 / logoImage.width));
        page.drawImage(logoImage, {
          x: 40,
          y: y - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        });
      }

      // Business & Client Info (2 Columns)
      y -= 15;
      const col1X = 40;
      const col2X = 320;

      // Business From
      page.drawText("FROM:", { x: col1X, y, size: 9, font: fontBold, color: grayText });
      page.drawText("BILL TO:", { x: col2X, y, size: 9, font: fontBold, color: grayText });

      y -= 16;
      page.drawText(businessName || "Your Business Name", {
        x: col1X,
        y,
        size: 12,
        font: fontBold,
        color: darkText,
      });
      page.drawText(clientName || "Client Name", {
        x: col2X,
        y,
        size: 12,
        font: fontBold,
        color: darkText,
      });

      y -= 14;
      if (businessEmail) {
        page.drawText(businessEmail, { x: col1X, y, size: 9, font: fontRegular, color: grayText });
      }
      if (clientEmail) {
        page.drawText(clientEmail, { x: col2X, y, size: 9, font: fontRegular, color: grayText });
      }

      y -= 12;
      if (businessAddress) {
        page.drawText(businessAddress, { x: col1X, y, size: 9, font: fontRegular, color: grayText });
      }
      if (clientAddress) {
        page.drawText(clientAddress, { x: col2X, y, size: 9, font: fontRegular, color: grayText });
      }

      y -= 12;
      if (businessCityZip) {
        page.drawText(businessCityZip, { x: col1X, y, size: 9, font: fontRegular, color: grayText });
      }
      if (clientCityZip) {
        page.drawText(clientCityZip, { x: col2X, y, size: 9, font: fontRegular, color: grayText });
      }

      y -= 12;
      if (businessPhone) {
        page.drawText(businessPhone, { x: col1X, y, size: 9, font: fontRegular, color: grayText });
      }
      if (poNumber) {
        page.drawText(`P.O. / Ref: ${poNumber}`, { x: col2X, y, size: 9, font: fontBold, color: darkText });
      }

      // Line items table
      y -= 30;

      // Table Header
      page.drawRectangle({
        x: 40,
        y: y - 6,
        width: width - 80,
        height: 22,
        color: primaryColor,
      });

      page.drawText("DESCRIPTION", { x: 50, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText("QTY", { x: 340, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText("UNIT PRICE", { x: 410, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText("AMOUNT", { x: 495, y, size: 9, font: fontBold, color: rgb(1, 1, 1) });

      y -= 22;

      // Table Rows
      items.forEach((item, idx) => {
        const itemAmount = (Number(item.quantity) || 0) * (Number(item.price) || 0);
        const rowBg = idx % 2 === 0 ? rgb(1, 1, 1) : lightBg;

        page.drawRectangle({
          x: 40,
          y: y - 6,
          width: width - 80,
          height: 20,
          color: rowBg,
        });

        const safeDesc = item.description || "Service or item";
        const truncatedDesc = safeDesc.length > 50 ? `${safeDesc.slice(0, 47)}...` : safeDesc;

        page.drawText(truncatedDesc, { x: 50, y, size: 9, font: fontRegular, color: darkText });
        page.drawText(String(item.quantity || 1), { x: 345, y, size: 9, font: fontRegular, color: darkText });
        page.drawText(formatMoney(item.price || 0), { x: 410, y, size: 9, font: fontRegular, color: darkText });
        page.drawText(formatMoney(itemAmount), { x: 495, y, size: 9, font: fontBold, color: darkText });

        y -= 20;
      });

      // Bottom Divider
      page.drawLine({
        start: { x: 40, y: y + 2 },
        end: { x: width - 40, y: y + 2 },
        thickness: 1,
        color: lightBorder,
      });

      y -= 15;

      // Summary Breakdown in Bottom Right
      const sumX = 360;
      const sumValX = 495;

      page.drawText("Subtotal:", { x: sumX, y, size: 9, font: fontRegular, color: grayText });
      page.drawText(formatMoney(subtotal), { x: sumValX, y, size: 9, font: fontRegular, color: darkText });
      y -= 14;

      if (discountPercent > 0) {
        page.drawText(`Discount (${discountPercent}%):`, { x: sumX, y, size: 9, font: fontRegular, color: grayText });
        page.drawText(`-${formatMoney(discountAmount)}`, { x: sumValX, y, size: 9, font: fontRegular, color: darkText });
        y -= 14;
      }

      if (taxPercent > 0) {
        page.drawText(`Tax / VAT (${taxPercent}%):`, { x: sumX, y, size: 9, font: fontRegular, color: grayText });
        page.drawText(formatMoney(taxAmount), { x: sumValX, y, size: 9, font: fontRegular, color: darkText });
        y -= 14;
      }

      if (shippingFee > 0) {
        page.drawText("Shipping / Extra:", { x: sumX, y, size: 9, font: fontRegular, color: grayText });
        page.drawText(formatMoney(shippingFee), { x: sumValX, y, size: 9, font: fontRegular, color: darkText });
        y -= 14;
      }

      // Total Due Highlight Box
      page.drawRectangle({
        x: sumX - 10,
        y: y - 10,
        width: width - sumX - 30,
        height: 26,
        color: primaryColor,
      });

      page.drawText("TOTAL DUE:", { x: sumX, y: y - 2, size: 10, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText(formatMoney(total), { x: sumValX - 5, y: y - 2, size: 11, font: fontBold, color: rgb(1, 1, 1) });

      // Notes & Bank Details on Left Column
      let leftY = y + 30;
      if (notes) {
        page.drawText("NOTES / MEMO:", { x: 40, y: leftY, size: 8, font: fontBold, color: grayText });
        leftY -= 12;
        const safeNotes = notes.length > 80 ? `${notes.slice(0, 77)}...` : notes;
        page.drawText(safeNotes, { x: 40, y: leftY, size: 8, font: fontRegular, color: darkText });
        leftY -= 16;
      }

      if (paymentTerms) {
        page.drawText("PAYMENT INSTRUCTIONS:", { x: 40, y: leftY, size: 8, font: fontBold, color: grayText });
        leftY -= 12;
        const safeTerms = paymentTerms.length > 80 ? `${paymentTerms.slice(0, 77)}...` : paymentTerms;
        page.drawText(safeTerms, { x: 40, y: leftY, size: 8, font: fontRegular, color: darkText });
      }

      // Footer
      page.drawText("Generated with RankLynx Free Invoice Generator • 100% Client-Side & Secure", {
        x: 40,
        y: 25,
        size: 7,
        font: fontRegular,
        color: grayText,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber || "Invoice"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("PDF generation error:", err);
      setIsDownloading(false);
      // Fallback to browser print if vector rendering encountered an edge case
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTheme = THEME_COLORS[themeColorKey] || THEME_COLORS.blue;

  const faqs = [
    {
      q: "Is this Invoice Generator 100% free with no watermark?",
      a: "Yes! You can create, preview, and download unlimited invoices completely free. We do not insert intrusive watermarks or require subscriptions.",
    },
    {
      q: "Is my business and client data stored on your servers?",
      a: "No. All calculations and PDF synthesis execute entirely in your web browser. Your confidential client names, banking details, and invoice figures are never uploaded, stored, or viewed by third parties.",
    },
    {
      q: "Can I customize the currency, taxes, and discounts?",
      a: "Absolutely. Choose from over 10 global currencies (USD, EUR, GBP, CAD, AUD, JPY, INR, PKR, AED, CHF, SGD) and configure custom percentage tax (VAT, GST) and discounts with automatic real-time mathematical calculations.",
    },
    {
      q: "How can I send the invoice to my client?",
      a: "Click 'Download PDF' to save a clean, high-resolution vector PDF to your computer or phone. You can then attach it to an email, message it via Slack or WhatsApp, or click 'Print' to print a physical copy.",
    },
    {
      q: "Can I add my business logo to the invoice?",
      a: "Yes. Simply click 'Upload Logo' to select your brand PNG or JPEG image. It will be seamlessly positioned on the invoice header and embedded into your downloaded PDF.",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0984E3] border border-blue-100 mb-2.5">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Free Online Invoicing Utility</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Free Invoice Generator
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Create professional, mathematically precise PDF invoices in seconds. Itemize services,
              apply taxes and discounts, choose any currency, and download clean vector PDFs instantly.
            </p>
          </div>

          {/* Quick Presets & Download Bar */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => loadPreset("agency")}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors cursor-pointer"
            >
              Agency Sample
            </button>
            <button
              onClick={() => loadPreset("freelance")}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#475569] transition-colors cursor-pointer"
            >
              Freelance Sample
            </button>
            <button
              onClick={() => loadPreset("blank")}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
              <span>{isDownloading ? "Generating PDF..." : downloadSuccess ? "Downloaded!" : "Download PDF"}</span>
            </button>
          </div>
        </div>

        {/* View Mode & Customization Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
          {/* View Toggles */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "edit"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "preview"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer items-center gap-1.5 ${
                viewMode === "split"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Currency & Theme Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Currency */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]">
              <DollarSign className="w-4 h-4 text-[#94A3B8]" />
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] font-semibold focus:outline-none focus:border-[#0984E3]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Colors */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#94A3B8] font-medium hidden sm:inline">Theme:</span>
              <div className="flex items-center gap-1">
                {Object.entries(THEME_COLORS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setThemeColorKey(key)}
                    style={{ backgroundColor: item.primary }}
                    title={item.label}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      themeColorKey === key ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] transition-colors cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
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
              <span>Sponsored Financial Partner — Modern Business Banking & 0% Foreign Exchange Invoicing</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Automate multi-currency payouts and streamline accounting with zero monthly fees.
            </p>
          </div>
        )}
      </div>

      {/* Main Workspace Frame: Edit, Preview, or Split Grid */}
      <div
        className={`grid gap-6 ${
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {/* EDIT FORM COLUMN */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={`space-y-6 ${
              viewMode === "split" ? "lg:col-span-6 xl:col-span-7" : "max-w-4xl mx-auto w-full"
            }`}
          >
            {/* Section 1: Business Details & Logo */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0984E3]" />
                  <h2 className="text-sm font-bold text-[#0F172A]">Your Business Information (From)</h2>
                </div>

                {/* Logo Uploader */}
                <label className="cursor-pointer text-xs font-semibold text-[#0984E3] hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoDataUrl ? "Change Logo" : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Business / Company Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Studio LLC"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] font-semibold focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="123 Business Way, Suite 100"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">City, State, Zip</label>
                  <input
                    type="text"
                    value={businessCityZip}
                    onChange={(e) => setBusinessCityZip(e.target.value)}
                    placeholder="City, State, Zip code"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Client Details */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
                <User className="w-4 h-4 text-[#0984E3]" />
                <h2 className="text-sm font-bold text-[#0F172A]">Client Details (Bill To)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Client / Customer Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. John Doe or Global Enterprises"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] font-semibold focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@domain.com"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Client Phone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Client Street Address"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">City, State, Zip</label>
                  <input
                    type="text"
                    value={clientCityZip}
                    onChange={(e) => setClientCityZip(e.target.value)}
                    placeholder="Client City, State, Zip"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Invoice Metadata Dates & Reference */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
                <Calendar className="w-4 h-4 text-[#0984E3]" />
                <h2 className="text-sm font-bold text-[#0F172A]">Invoice Dates & Numbering</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] font-mono font-bold focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">PO / Project Ref</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="PO-0000"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Line Items Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0984E3]" />
                  <h2 className="text-sm font-bold text-[#0F172A]">Line Items & Services</h2>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0984E3] border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#64748B]">Item #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                            placeholder="e.g. Website development, consultation hours..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Unit Price ({currency.symbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "price", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col justify-end">
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Total
                          </label>
                          <div className="px-2 py-1.5 text-xs font-bold text-[#0F172A] bg-slate-100 rounded-lg text-right truncate">
                            {formatMoney(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Adjustments: Discount, Tax, Shipping */}
              <div className="pt-4 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Tax / VAT (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Shipping / Extra Fee ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Notes & Payment Terms */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Customer Notes & Memo
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business..."
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">
                  Payment Instructions & Bank Transfer Details
                </label>
                <textarea
                  rows={2}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Bank: Chase, Account #: 123456789, Swift:..."
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0984E3] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW COLUMN */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`${
              viewMode === "split" ? "lg:col-span-6 xl:col-span-5" : "max-w-3xl mx-auto w-full"
            }`}
          >
            {/* Visual Invoice Card (Print-ready document styling) */}
            <div
              id="printable-invoice"
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 sm:p-8 space-y-6 sticky top-6"
            >
              {/* Header colored banner */}
              <div
                style={{ backgroundColor: currentTheme.primary }}
                className="h-2 rounded-t-lg -mt-6 -mx-6 sm:-mt-8 sm:-mx-8 mb-6"
              />

              {/* Invoice Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#F1F5F9] pb-6">
                <div>
                  {logoDataUrl ? (
                    <img
                      src={logoDataUrl}
                      alt="Business Logo"
                      className="h-12 max-w-[160px] object-contain rounded mb-2"
                    />
                  ) : (
                    <div
                      style={{ color: currentTheme.primary }}
                      className="text-2xl font-black tracking-tight"
                    >
                      INVOICE
                    </div>
                  )}
                  <div className="text-sm font-bold text-[#0F172A] mt-1">
                    {businessName || "Your Business Name"}
                  </div>
                  <div className="text-xs text-[#64748B]">{businessEmail}</div>
                  <div className="text-xs text-[#64748B]">{businessAddress}</div>
                  <div className="text-xs text-[#64748B]">{businessCityZip}</div>
                  {businessPhone && <div className="text-xs text-[#64748B]">{businessPhone}</div>}
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-lg font-bold font-mono text-[#0F172A]">
                    {invoiceNumber || "INV-001"}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    <span className="font-semibold text-[#0F172A]">Date:</span> {issueDate}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    <span className="font-semibold text-[#0F172A]">Due Date:</span> {dueDate}
                  </div>
                  {poNumber && (
                    <div className="text-xs text-[#64748B]">
                      <span className="font-semibold text-[#0F172A]">PO / Ref:</span> {poNumber}
                    </div>
                  )}
                  <div className="inline-block mt-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Balance Due
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To Box */}
              <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  Billed To:
                </div>
                <div className="text-sm font-bold text-[#0F172A]">{clientName || "Client Name"}</div>
                <div className="text-xs text-[#64748B]">{clientEmail}</div>
                <div className="text-xs text-[#64748B]">{clientAddress}</div>
                <div className="text-xs text-[#64748B]">{clientCityZip}</div>
                {clientPhone && <div className="text-xs text-[#64748B]">{clientPhone}</div>}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      style={{ backgroundColor: currentTheme.lightBg }}
                      className="border-b border-[#E2E8F0] font-bold text-[#0F172A]"
                    >
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {items.map((item, idx) => {
                      const lineAmt = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                            {item.description || "Line item"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#64748B]">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-[#64748B]">
                            {formatMoney(item.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#0F172A]">
                            {formatMoney(lineAmt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-[#E2E8F0] pt-4 flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex justify-between w-64 text-[#64748B]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#0F172A]">{formatMoney(subtotal)}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between w-64 text-emerald-600">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}

                {taxPercent > 0 && (
                  <div className="flex justify-between w-64 text-[#64748B]">
                    <span>Tax / VAT ({taxPercent}%):</span>
                    <span className="font-semibold text-[#0F172A]">{formatMoney(taxAmount)}</span>
                  </div>
                )}

                {shippingFee > 0 && (
                  <div className="flex justify-between w-64 text-[#64748B]">
                    <span>Shipping / Fee:</span>
                    <span className="font-semibold text-[#0F172A]">{formatMoney(shippingFee)}</span>
                  </div>
                )}

                <div
                  style={{ backgroundColor: currentTheme.primary }}
                  className="flex justify-between w-64 text-white p-2.5 rounded-lg text-sm font-bold mt-2 shadow-2xs"
                >
                  <span>Total Due:</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              {/* Notes & Terms */}
              {(notes || paymentTerms) && (
                <div className="border-t border-[#F1F5F9] pt-4 space-y-2 text-xs">
                  {notes && (
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11px] uppercase tracking-wider">
                        Notes:
                      </span>
                      <p className="text-[#64748B] leading-relaxed">{notes}</p>
                    </div>
                  )}
                  {paymentTerms && (
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11px] uppercase tracking-wider">
                        Payment Instructions:
                      </span>
                      <p className="text-[#64748B] font-mono text-[11px] leading-relaxed">{paymentTerms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Card Footer Download Action */}
              <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#94A3B8]">
                  Client-side rendering • Vector PDF
                </span>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="px-4 py-2 rounded-xl bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AD PLACEHOLDER 2: Middle Sponsored Service Card */}
      <div className="w-full bg-white rounded-xl border border-dashed border-[#CBD5E1] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center justify-center font-bold text-sm">
            Ad
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">
              Accept Credit Cards & ACH Payments with 1.5% Flat Rate
            </div>
            <div className="text-[11px] text-[#64748B]">
              Add instant "Pay Now" payment links directly into your invoices with our partner gateway.
            </div>
          </div>
        </div>
        <button
          onClick={() => window.open("https://stripe.com", "_blank")}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shrink-0 cursor-pointer"
        >
          Explore Payment Gateway
        </button>
      </div>

      {/* Section: Short "How it works" */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            How the Free Invoice Generator Works
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6 max-w-2xl">
          Generate an audit-proof, client-ready billing invoice in three simple steps with zero registration:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Fill Business & Client Details</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Enter your brand name, contact email, and client billing coordinates. Optionally upload your company logo to give the invoice an official agency feel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Itemize Services & Apply Rates</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Add individual deliverables with quantities and rates. The calculator handles subtotal, percentage discounts, and sales tax / VAT calculations automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-bold text-[#0F172A] mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0984E3] flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Preview & Download Vector PDF</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Review your live side-by-side preview and click "Download PDF" to generate a crisp, vector A4 document ready to email to your client or print physically.
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
            Invoice Generator FAQ
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mb-6">
          Common questions regarding formatting, tax compliance, and privacy when issuing invoices.
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
