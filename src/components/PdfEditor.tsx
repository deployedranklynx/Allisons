import React, { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Type,
  Square,
  PenTool,
  Eraser,
  Image as ImageIcon,
  Save,
  FolderOpen,
  Printer,
  ChevronLeft,
  ChevronRight,
  Move,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  Undo2,
  X,
  Feather,
  Palette,
  Layers,
  Search,
  Replace,
  Maximize2,
  Edit3,
  Highlighter,
  Sliders,
  HelpCircle,
  Shield,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  savePdfProjectToDb,
  getAllSavedPdfProjects,
  getSavedPdfProjectById,
  deleteSavedPdfProject,
  SavedPdfProject,
} from "../lib/pdfStorage";

// ---------------------------------------------------------------------------
// 1. POLYFILLS FOR PDF.JS V6 (Ensures 100% stability across all browser environments)
// ---------------------------------------------------------------------------
if (typeof (Promise as any).try !== "function") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (Uint8Array.prototype as any).toHex !== "function") {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this as any)
      .map((b: any) => b.toString(16).padStart(2, "0"))
      .join("");
  };
}

// Setup PDF.js worker safely with local bundled worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfjsWorker ||
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not set PDF.js workerSrc:", e);
}

// ---------------------------------------------------------------------------
// 2. DATA INTERFACES
// ---------------------------------------------------------------------------
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  fontSize: number; // pt (8 - 64)
  fontFamily: "Helvetica" | "Times" | "Courier";
  color: string;
  bgColor?: string;
  bold?: boolean;
  italic?: boolean;
  isReplacement?: boolean; // Replaced an original text block
  originalStr?: string;
}

export interface WhiteoutBox {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  color: string;
}

export interface FreehandDrawing {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isHighlighter?: boolean;
}

export interface StampImage {
  id: string;
  imageUrl: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
}

export interface DetectedOriginalText {
  id: string;
  str: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  fontSize: number; // pt
  fontFamily: "Helvetica" | "Times" | "Courier";
  bold: boolean;
  italic: boolean;
  pdfX: number;
  pdfY: number;
}

export interface PageState {
  pageIndex: number;
  rotation: number;
  textOverlays: TextOverlay[];
  whiteouts: WhiteoutBox[];
  drawings: FreehandDrawing[];
  stamps: StampImage[];
}

// Convert hex color (#RRGGBB) to rgb numbers (0-1) for pdf-lib
function hexToPdfRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
}

// Helper to get matching standard font from pdfDoc
async function getMatchingPdfFont(
  pdfDoc: PDFDocument,
  fontFamily: string,
  bold?: boolean,
  italic?: boolean
) {
  const fam = (fontFamily || "").toLowerCase();
  if (fam.includes("times") || fam.includes("serif") || fam.includes("roman")) {
    if (bold && italic) return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    if (bold) return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    if (italic) return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    return await pdfDoc.embedFont(StandardFonts.TimesRoman);
  }
  if (fam.includes("courier") || fam.includes("mono") || fam.includes("console")) {
    if (bold && italic) return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
    if (bold) return await pdfDoc.embedFont(StandardFonts.CourierBold);
    if (italic) return await pdfDoc.embedFont(StandardFonts.CourierOblique);
    return await pdfDoc.embedFont(StandardFonts.Courier);
  }
  // Standard Sans-Serif (Helvetica / Arial)
  if (bold && italic) return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (bold) return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  if (italic) return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  return await pdfDoc.embedFont(StandardFonts.Helvetica);
}

export const PdfEditor: React.FC = () => {
  // Document state
  const [docName, setDocName] = useState<string>("Document.pdf");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75, 100, 125, 150

  // State of all modifications per page
  const [pagesData, setPagesData] = useState<PageState[]>([
    {
      pageIndex: 0,
      rotation: 0,
      textOverlays: [],
      whiteouts: [],
      drawings: [],
      stamps: [],
    },
  ]);

  // Detected text from original PDF page
  const [detectedTexts, setDetectedTexts] = useState<DetectedOriginalText[]>([]);
  const [showTextLayer, setShowTextLayer] = useState<boolean>(true);

  // Selected tool: "edit-original" | "select" | "text" | "whiteout" | "draw" | "highlighter" | "stamp"
  const [selectedTool, setSelectedTool] = useState<
    "edit-original" | "select" | "text" | "whiteout" | "draw" | "highlighter" | "stamp"
  >("edit-original");

  // Tool properties
  const [textColor, setTextColor] = useState<string>("#0f172a");
  const [textFontSize, setTextFontSize] = useState<number>(14);
  const [textFontFamily, setTextFontFamily] = useState<"Helvetica" | "Times" | "Courier">("Helvetica");
  const [textIsBold, setTextIsBold] = useState<boolean>(false);
  const [textIsItalic, setTextIsItalic] = useState<boolean>(false);
  const [textBgColor, setTextBgColor] = useState<string>("#ffffff");

  const [drawColor, setDrawColor] = useState<string>("#0984E3");
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [whiteoutColor, setWhiteoutColor] = useState<string>("#ffffff");

  // Selection & dragging state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<"text" | "whiteout" | "stamp" | null>(null);

  // In-place text editor modal / popover
  const [editingTarget, setEditingTarget] = useState<{
    detectedText?: DetectedOriginalText;
    existingOverlay?: TextOverlay;
    currentValue: string;
  } | null>(null);

  // Find and Replace state
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>("");
  const [replaceValue, setReplaceValue] = useState<string>("");

  // Status & Saved Drafts Modals
  const [savedDrafts, setSavedDrafts] = useState<SavedPdfProject[]>([]);
  const [showSavedDraftsModal, setShowSavedDraftsModal] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Signature Pad state
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [typedSigName, setTypedSigName] = useState<string>("");
  const [typedSigFont, setTypedSigFont] = useState<string>("cursive");
  const sigPadCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSigDrawingRef = useRef<boolean>(false);

  // Refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pdfRenderCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const currentRenderTaskRef = useRef<any>(null);

  // Load existing drafts on mount & initialize sample document
  useEffect(() => {
    loadSavedDraftsList();
    loadSampleDocument();
  }, []);

  const loadSavedDraftsList = async () => {
    try {
      const list = await getAllSavedPdfProjects();
      setSavedDrafts(list);
    } catch (err) {
      console.warn("Could not load drafts:", err);
    }
  };

  // Create sample invoice/agreement to show real in-place editing immediately
  const loadSampleDocument = async () => {
    try {
      const newPdf = await PDFDocument.create();
      const page = newPdf.addPage([595.28, 841.89]); // Standard A4 points
      const helvBold = await newPdf.embedFont(StandardFonts.HelveticaBold);
      const helvReg = await newPdf.embedFont(StandardFonts.Helvetica);
      const timesBold = await newPdf.embedFont(StandardFonts.TimesRomanBold);
      const timesReg = await newPdf.embedFont(StandardFonts.TimesRoman);

      // Header Banner
      page.drawRectangle({
        x: 40,
        y: 750,
        width: 515,
        height: 50,
        color: rgb(0.06, 0.52, 0.89),
      });

      page.drawText("SEO AUDIT & TECHNICAL SERVICE AGREEMENT", {
        x: 55,
        y: 768,
        size: 16,
        font: helvBold,
        color: rgb(1, 1, 1),
      });

      page.drawText("Client Name: Apex Media Global", {
        x: 50,
        y: 700,
        size: 12,
        font: helvBold,
        color: rgb(0.1, 0.15, 0.2),
      });

      page.drawText("Document Date: September 12, 2026", {
        x: 50,
        y: 675,
        size: 11,
        font: helvReg,
        color: rgb(0.3, 0.35, 0.4),
      });

      page.drawText("Invoice Amount: $1,450.00 USD", {
        x: 50,
        y: 650,
        size: 12,
        font: helvBold,
        color: rgb(0.12, 0.63, 0.35),
      });

      page.drawText("Deliverables & Scope of Work:", {
        x: 50,
        y: 605,
        size: 13,
        font: timesBold,
        color: rgb(0.15, 0.18, 0.22),
      });

      page.drawText(
        "1. Full technical crawling of 150,000 indexable pages for broken links and 301 redirect chains.\n" +
          "2. Core Web Vitals remediation including LCP, CLS, and INP metrics.\n" +
          "3. High authority domain outreach with Moz DA 60+ and Ahrefs DR 65+ tier.\n" +
          "4. Bi-weekly keyword position tracking and ranking volatility reports.",
        {
          x: 50,
          y: 575,
          size: 10.5,
          font: timesReg,
          color: rgb(0.2, 0.25, 0.3),
          lineHeight: 18,
        }
      );

      page.drawText("Authorized Signatory: __________________________", {
        x: 50,
        y: 440,
        size: 11,
        font: helvReg,
        color: rgb(0.3, 0.35, 0.4),
      });

      page.drawText("Status: Approved & Active", {
        x: 50,
        y: 410,
        size: 11,
        font: helvBold,
        color: rgb(0.08, 0.55, 0.3),
      });

      const bytes = await newPdf.save();
      setPdfBytes(bytes);
      setDocName("SEO_Service_Agreement.pdf");
      setPageCount(1);
      setCurrentPageIndex(0);
      setPagesData([
        {
          pageIndex: 0,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        },
      ]);
    } catch (err) {
      console.error("Error creating sample document:", err);
    }
  };

  // Helper to create a new blank PDF
  const createBlankDocument = async () => {
    try {
      const newPdf = await PDFDocument.create();
      newPdf.addPage([595.28, 841.89]);
      const bytes = await newPdf.save();
      setPdfBytes(bytes);
      setDocName("New_Blank_Document.pdf");
      setPageCount(1);
      setCurrentPageIndex(0);
      setPagesData([
        {
          pageIndex: 0,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        },
      ]);
      setDetectedTexts([]);
      setStatusMsg("Created new blank document.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err) {
      console.error("Error creating blank document:", err);
    }
  };

  // Handle PDF upload from user device
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Verify with PDFDocument
      const pdfDoc = await PDFDocument.load(bytes);
      const total = pdfDoc.getPageCount();

      setPdfBytes(bytes);
      setDocName(file.name);
      setPageCount(total);
      setCurrentPageIndex(0);

      // Initialize empty overlays for each page
      const initialPages: PageState[] = [];
      for (let i = 0; i < total; i++) {
        initialPages.push({
          pageIndex: i,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        });
      }
      setPagesData(initialPages);
      setStatusMsg(`Loaded "${file.name}" (${total} pages). Click any text to edit!`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Failed to parse uploaded PDF: " + (err?.message || "Invalid PDF file"));
    }
  };

  // ---------------------------------------------------------------------------
  // 3. ROBUST PDF RENDER & ORIGINAL TEXT DETECTION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!pdfBytes) return;

    let isCancelled = false;

    const renderPageAndDetectText = async () => {
      try {
        setIsRenderingPage(true);

        // Cancel previous render if any
        if (currentRenderTaskRef.current) {
          try {
            currentRenderTaskRef.current.cancel();
          } catch {}
          currentRenderTaskRef.current = null;
        }

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdfDoc = await loadingTask.promise;

        if (isCancelled) return;

        setPageCount(pdfDoc.numPages);
        const validPageIndex = Math.min(currentPageIndex, pdfDoc.numPages - 1);
        const page = await pdfDoc.getPage(validPageIndex + 1);

        if (isCancelled || !pdfRenderCanvasRef.current) return;

        const canvas = pdfRenderCanvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate scale based on zoom level (base scale 1.4 for crisp display)
        const baseScale = 1.4 * (zoomLevel / 100);
        const viewport = page.getViewport({ scale: baseScale });

        // High DPI canvas rendering for razor-sharp text
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(dpr, dpr);

        // Match drawing overlay canvas dimensions
        if (drawingCanvasRef.current) {
          drawingCanvasRef.current.width = viewport.width;
          drawingCanvasRef.current.height = viewport.height;
          drawingCanvasRef.current.style.width = `${viewport.width}px`;
          drawingCanvasRef.current.style.height = `${viewport.height}px`;
          redrawCurrentDrawings();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext as any);
        currentRenderTaskRef.current = renderTask;

        await renderTask.promise;
        currentRenderTaskRef.current = null;

        // EXTRACT ALL ORIGINAL TEXT ON THE PAGE
        const textContent = await page.getTextContent();
        const extracted: DetectedOriginalText[] = [];

        // Page PDF dimensions
        const { width: pWidth, height: pHeight } = page.getViewport({ scale: 1.0 });

        textContent.items.forEach((item: any, idx: number) => {
          if (!item.str || item.str.trim().length === 0) return;

          // In PDF transform: item.transform = [scaleX, skewY, skewX, scaleY, tx, ty]
          const tx = item.transform[4];
          const ty = item.transform[5];
          const fontSizePt = Math.hypot(item.transform[0], item.transform[1]) || 12;

          // Convert to percentage of page
          const xPercent = Math.max(0, (tx / pWidth) * 100);
          // In PDF, ty is from bottom. Top = pHeight - ty - fontSizePt
          const yPercent = Math.max(0, ((pHeight - ty - fontSizePt * 0.85) / pHeight) * 100);
          const widthPercent = Math.min(100, (item.width / pWidth) * 100);
          const heightPercent = Math.min(20, (fontSizePt * 1.3 / pHeight) * 100);

          const fontName = (item.fontName || "").toLowerCase();
          let family: "Helvetica" | "Times" | "Courier" = "Helvetica";
          if (fontName.includes("times") || fontName.includes("serif") || fontName.includes("roman")) {
            family = "Times";
          } else if (fontName.includes("courier") || fontName.includes("mono")) {
            family = "Courier";
          }

          const isBold = fontName.includes("bold") || fontName.includes("black") || fontName.includes("heavy");
          const isItalic = fontName.includes("italic") || fontName.includes("oblique");

          extracted.push({
            id: `orig-${currentPageIndex}-${idx}`,
            str: item.str,
            x: xPercent,
            y: yPercent,
            width: Math.max(widthPercent, 1.5),
            height: Math.max(heightPercent, 2.0),
            fontSize: Math.round(fontSizePt),
            fontFamily: family,
            bold: isBold,
            italic: isItalic,
            pdfX: tx,
            pdfY: ty,
          });
        });

        if (!isCancelled) {
          setDetectedTexts(extracted);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("PDF render fallback:", err);
        }
      } finally {
        if (!isCancelled) setIsRenderingPage(false);
      }
    };

    renderPageAndDetectText();

    return () => {
      isCancelled = true;
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfBytes, currentPageIndex, zoomLevel]);

  // Redraw drawings on overlay canvas
  const redrawCurrentDrawings = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentPageData = pagesData.find((p) => p.pageIndex === currentPageIndex);
    if (!currentPageData || !currentPageData.drawings) return;

    currentPageData.drawings.forEach((drawing) => {
      if (drawing.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (drawing.isHighlighter) {
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalAlpha = 1.0;
      }

      const first = drawing.points[0];
      ctx.moveTo((first.x / 100) * canvas.width, (first.y / 100) * canvas.height);

      for (let i = 1; i < drawing.points.length; i++) {
        const pt = drawing.points[i];
        ctx.lineTo((pt.x / 100) * canvas.width, (pt.y / 100) * canvas.height);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });
  };

  useEffect(() => {
    redrawCurrentDrawings();
  }, [pagesData, currentPageIndex]);

  // Current page state helper
  const getCurrentPage = (): PageState => {
    const found = pagesData.find((p) => p.pageIndex === currentPageIndex);
    if (found) return found;
    return {
      pageIndex: currentPageIndex,
      rotation: 0,
      textOverlays: [],
      whiteouts: [],
      drawings: [],
      stamps: [],
    };
  };

  const updateCurrentPage = (updater: (prev: PageState) => PageState) => {
    setPagesData((prev) => {
      const idx = prev.findIndex((p) => p.pageIndex === currentPageIndex);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updater(copy[idx]);
        return copy;
      } else {
        const newP = updater({
          pageIndex: currentPageIndex,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        });
        return [...prev, newP];
      }
    });
  };

  // ---------------------------------------------------------------------------
  // 4. IN-PLACE ORIGINAL TEXT EDITING ENGINE ("jo font ho wo hi rhe")
  // ---------------------------------------------------------------------------
  const handleStartEditOriginalText = (item: DetectedOriginalText) => {
    // Open in-place editor with matching font, size, and style preloaded
    setTextFontFamily(item.fontFamily);
    setTextFontSize(item.fontSize);
    setTextIsBold(item.bold);
    setTextIsItalic(item.italic);

    setEditingTarget({
      detectedText: item,
      currentValue: item.str,
    });
  };

  const handleApplyTextReplacement = () => {
    if (!editingTarget) return;

    const { detectedText, existingOverlay, currentValue } = editingTarget;

    if (detectedText) {
      // Create exact background whiteout box to completely mask the original text underneath
      const paddingX = 0.4;
      const paddingY = 0.4;
      const maskBox: WhiteoutBox = {
        id: `mask-${detectedText.id}`,
        x: Math.max(0, detectedText.x - paddingX),
        y: Math.max(0, detectedText.y - paddingY),
        width: Math.min(100, detectedText.width + paddingX * 2),
        height: Math.min(100, detectedText.height + paddingY * 2),
        color: whiteoutColor || "#ffffff",
      };

      // Create new text overlay positioned at exact baseline and font match
      const newOverlay: TextOverlay = {
        id: `text-rep-${Date.now()}`,
        text: currentValue,
        x: detectedText.x,
        y: detectedText.y,
        fontSize: textFontSize,
        fontFamily: textFontFamily,
        color: textColor,
        bold: textIsBold,
        italic: textIsItalic,
        bgColor: "transparent",
        isReplacement: true,
        originalStr: detectedText.str,
      };

      updateCurrentPage((prev) => ({
        ...prev,
        // Add whiteout first so it sits beneath
        whiteouts: [...prev.whiteouts, maskBox],
        textOverlays: [...prev.textOverlays, newOverlay],
      }));

      setStatusMsg(`Replaced "${detectedText.str}" with matching ${textFontFamily} font!`);
      setTimeout(() => setStatusMsg(null), 3000);
    } else if (existingOverlay) {
      // Updating an already created overlay
      updateCurrentPage((prev) => ({
        ...prev,
        textOverlays: prev.textOverlays.map((t) =>
          t.id === existingOverlay.id
            ? {
                ...t,
                text: currentValue,
                fontSize: textFontSize,
                fontFamily: textFontFamily,
                color: textColor,
                bold: textIsBold,
                italic: textIsItalic,
              }
            : t
        ),
      }));
    }

    setEditingTarget(null);
  };

  // Erase detected text with one click
  const handleQuickEraseText = (item: DetectedOriginalText) => {
    const maskBox: WhiteoutBox = {
      id: `mask-${item.id}`,
      x: Math.max(0, item.x - 0.4),
      y: Math.max(0, item.y - 0.4),
      width: Math.min(100, item.width + 0.8),
      height: Math.min(100, item.height + 0.8),
      color: whiteoutColor || "#ffffff",
    };

    updateCurrentPage((prev) => ({
      ...prev,
      whiteouts: [...prev.whiteouts, maskBox],
    }));

    setStatusMsg(`Erased "${item.str}" with clean background mask.`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  // ---------------------------------------------------------------------------
  // 5. GLOBAL FIND & REPLACE ENGINE
  // ---------------------------------------------------------------------------
  const handleFindAndReplaceAll = () => {
    if (!findQuery.trim()) return;

    const matches = detectedTexts.filter((t) =>
      t.str.toLowerCase().includes(findQuery.toLowerCase())
    );

    if (matches.length === 0) {
      alert(`No occurrences of "${findQuery}" found on page ${currentPageIndex + 1}.`);
      return;
    }

    const newWhiteouts: WhiteoutBox[] = [];
    const newTextOverlays: TextOverlay[] = [];

    matches.forEach((item) => {
      // Case insensitive replacement
      const regex = new RegExp(findQuery, "gi");
      const replacedText = item.str.replace(regex, replaceValue);

      newWhiteouts.push({
        id: `mask-fr-${item.id}-${Date.now()}`,
        x: Math.max(0, item.x - 0.4),
        y: Math.max(0, item.y - 0.4),
        width: Math.min(100, item.width + 0.8),
        height: Math.min(100, item.height + 0.8),
        color: whiteoutColor || "#ffffff",
      });

      newTextOverlays.push({
        id: `text-fr-${item.id}-${Date.now()}`,
        text: replacedText,
        x: item.x,
        y: item.y,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        color: textColor,
        bold: item.bold,
        italic: item.italic,
        isReplacement: true,
        originalStr: item.str,
      });
    });

    updateCurrentPage((prev) => ({
      ...prev,
      whiteouts: [...prev.whiteouts, ...newWhiteouts],
      textOverlays: [...prev.textOverlays, ...newTextOverlays],
    }));

    setStatusMsg(`Replaced ${matches.length} instances of "${findQuery}" with "${replaceValue}"!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // 6. CANVAS CLICKS & DRAWING INTERACTIONS
  // ---------------------------------------------------------------------------
  const handleCanvasContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === "select" || selectedTool === "edit-original") return;

    const rect = pageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(95, (clickX / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(95, (clickY / rect.height) * 100));

    if (selectedTool === "text") {
      const newText: TextOverlay = {
        id: `text-${Date.now()}`,
        text: "New Text Box",
        x: Math.round(xPercent),
        y: Math.round(yPercent),
        fontSize: textFontSize,
        fontFamily: textFontFamily,
        color: textColor,
        bold: textIsBold,
        italic: textIsItalic,
        bgColor: textBgColor,
      };

      updateCurrentPage((prev) => ({
        ...prev,
        textOverlays: [...prev.textOverlays, newText],
      }));
      setSelectedElementId(newText.id);
      setSelectedElementType("text");
      setSelectedTool("select");
    } else if (selectedTool === "whiteout") {
      const newWhiteout: WhiteoutBox = {
        id: `whiteout-${Date.now()}`,
        x: Math.round(xPercent),
        y: Math.round(yPercent),
        width: 25, // default 25% width
        height: 4, // default 4% height
        color: whiteoutColor,
      };

      updateCurrentPage((prev) => ({
        ...prev,
        whiteouts: [...prev.whiteouts, newWhiteout],
      }));
      setSelectedElementId(newWhiteout.id);
      setSelectedElementType("whiteout");
      setSelectedTool("select");
    }
  };

  // Freehand Pen / Highlighter events
  const handleDrawingMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "draw" && selectedTool !== "highlighter") return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentPathRef.current = [{ x, y }];
  };

  const handleDrawingMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || (selectedTool !== "draw" && selectedTool !== "highlighter")) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentPathRef.current.push({ x, y });

    const isHigh = selectedTool === "highlighter";
    ctx.strokeStyle = isHigh ? "#FDE047" : drawColor;
    ctx.lineWidth = isHigh ? 16 : drawWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = isHigh ? 0.4 : 1.0;

    const pts = currentPathRef.current;
    if (pts.length > 1) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo((p1.x / 100) * canvas.width, (p1.y / 100) * canvas.height);
      ctx.lineTo((p2.x / 100) * canvas.width, (p2.y / 100) * canvas.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPathRef.current.length > 1) {
      const isHigh = selectedTool === "highlighter";
      const newDrawing: FreehandDrawing = {
        id: `draw-${Date.now()}`,
        points: [...currentPathRef.current],
        color: isHigh ? "#FDE047" : drawColor,
        width: isHigh ? 16 : drawWidth,
        isHighlighter: isHigh,
      };

      updateCurrentPage((prev) => ({
        ...prev,
        drawings: [...prev.drawings, newDrawing],
      }));
    }
    currentPathRef.current = [];
  };

  // Stamp / Image Upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newStamp: StampImage = {
          id: `stamp-${Date.now()}`,
          imageUrl: dataUrl,
          x: 25,
          y: 25,
          width: 28,
          height: 14,
        };

        updateCurrentPage((prev) => ({
          ...prev,
          stamps: [...prev.stamps, newStamp],
        }));
        setSelectedElementId(newStamp.id);
        setSelectedElementType("stamp");
        setSelectedTool("select");
      }
    };
    reader.readAsDataURL(file);
  };

  // Signature Pad creation
  const handleApplySignature = () => {
    let sigDataUrl = "";

    if (sigMode === "draw") {
      const canvas = sigPadCanvasRef.current;
      if (!canvas) return;
      sigDataUrl = canvas.toDataURL("image/png");
    } else {
      // Render typed cursive signature to canvas
      const canvas = document.createElement("canvas");
      canvas.width = 450;
      canvas.height = 150;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "italic 48px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
        ctx.fillStyle = "#0F172A";
        ctx.fillText(typedSigName || "Signature", 30, 90);
        sigDataUrl = canvas.toDataURL("image/png");
      }
    }

    if (sigDataUrl) {
      const newStamp: StampImage = {
        id: `sig-${Date.now()}`,
        imageUrl: sigDataUrl,
        x: 35,
        y: 65,
        width: 30,
        height: 12,
      };

      updateCurrentPage((prev) => ({
        ...prev,
        stamps: [...prev.stamps, newStamp],
      }));
      setSelectedElementId(newStamp.id);
      setSelectedElementType("stamp");
      setShowSignatureModal(false);
      setStatusMsg("Signature inserted! Drag and position it wherever needed.");
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  // Page Operations
  const handleRotatePage = () => {
    updateCurrentPage((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
    setStatusMsg("Page rotated 90°.");
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const handleAddNewBlankPage = async () => {
    try {
      if (!pdfBytes) return;
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.addPage([595.28, 841.89]);
      const newBytes = await pdfDoc.save();
      setPdfBytes(newBytes);
      const newTotal = pageCount + 1;
      setPageCount(newTotal);

      setPagesData((prev) => [
        ...prev,
        {
          pageIndex: newTotal - 1,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        },
      ]);
      setCurrentPageIndex(newTotal - 1);
      setStatusMsg(`Added new blank page (${newTotal} of ${newTotal}).`);
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err) {
      console.error("Failed to add blank page:", err);
    }
  };

  const handleDeleteCurrentPage = async () => {
    if (pageCount <= 1) {
      alert("Cannot delete the only page in the document.");
      return;
    }
    if (!window.confirm(`Delete page ${currentPageIndex + 1}?`)) return;

    try {
      if (!pdfBytes) return;
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.removePage(currentPageIndex);
      const newBytes = await pdfDoc.save();
      setPdfBytes(newBytes);
      const newTotal = pageCount - 1;
      setPageCount(newTotal);

      setPagesData((prev) =>
        prev
          .filter((p) => p.pageIndex !== currentPageIndex)
          .map((p) => (p.pageIndex > currentPageIndex ? { ...p, pageIndex: p.pageIndex - 1 } : p))
      );

      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      setStatusMsg("Page deleted.");
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
  };

  // Save Project to IndexedDB ("save kr skhu bad ke liye bhi")
  const handleSaveProjectForLater = async () => {
    if (!pdfBytes) return;

    try {
      let binary = "";
      const len = pdfBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      const base64Data = window.btoa(binary);
      const pdfDataUrl = `data:application/pdf;base64,${base64Data}`;

      const project: SavedPdfProject = {
        id: `pdf-proj-${Date.now()}`,
        name: docName || "My Edited PDF",
        savedAt: new Date().toISOString(),
        pageCount,
        pdfDataUrl,
        pagesData,
      };

      await savePdfProjectToDb(project);
      await loadSavedDraftsList();
      setStatusMsg("Project saved to your browser drafts! You can reopen it anytime.");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error("Failed to save project:", err);
      alert("Failed to save project draft locally.");
    }
  };

  // Open saved draft
  const handleOpenDraft = async (draft: SavedPdfProject) => {
    try {
      const base64 = draft.pdfDataUrl.split(",")[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      setPdfBytes(bytes);
      setDocName(draft.name);
      setPageCount(draft.pageCount);
      setCurrentPageIndex(0);
      setPagesData(draft.pagesData || []);
      setShowSavedDraftsModal(false);
      setStatusMsg(`Resumed draft "${draft.name}"!`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error("Error opening draft:", err);
      alert("Failed to restore draft.");
    }
  };

  // ---------------------------------------------------------------------------
  // 7. EXPORT COMPILED PDF WITH EMBEDDED FONTS & MASKS (`pdf-lib`)
  // ---------------------------------------------------------------------------
  const handleExportPdf = async () => {
    if (!pdfBytes) return;

    try {
      setIsExporting(true);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const page = pages[pIdx];
        const { width: pWidth, height: pHeight } = page.getSize();
        const pageData = pagesData.find((p) => p.pageIndex === pIdx);
        if (!pageData) continue;

        if (pageData.rotation) {
          page.setRotation(degrees(pageData.rotation));
        }

        // 1. Draw Whiteout / Redaction Masks FIRST (covers original text seamlessly)
        for (const w of pageData.whiteouts) {
          const wWidth = (w.width / 100) * pWidth;
          const wHeight = (w.height / 100) * pHeight;
          const x = (w.x / 100) * pWidth;
          // In PDF, Y=0 is bottom
          const y = pHeight - (w.y / 100) * pHeight - wHeight;

          page.drawRectangle({
            x,
            y,
            width: wWidth,
            height: wHeight,
            color: hexToPdfRgb(w.color),
          });
        }

        // 2. Draw Stamps and Signatures (PNG / JPG)
        for (const s of pageData.stamps) {
          try {
            let embeddedImg;
            if (s.imageUrl.includes("image/png") || s.imageUrl.includes("data:image/png")) {
              const base64Data = s.imageUrl.split(",")[1];
              const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
              embeddedImg = await pdfDoc.embedPng(imgBytes);
            } else {
              const base64Data = s.imageUrl.split(",")[1];
              const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
              embeddedImg = await pdfDoc.embedJpg(imgBytes);
            }

            const imgW = (s.width / 100) * pWidth;
            const imgH = (s.height / 100) * pHeight;
            const x = (s.x / 100) * pWidth;
            const y = pHeight - (s.y / 100) * pHeight - imgH;

            page.drawImage(embeddedImg, {
              x,
              y,
              width: imgW,
              height: imgH,
            });
          } catch (imgErr) {
            console.warn("Could not embed stamp image:", imgErr);
          }
        }

        // 3. Draw Text Overlays with exact matching embedded fonts
        for (const t of pageData.textOverlays) {
          const fontToUse = await getMatchingPdfFont(
            pdfDoc,
            t.fontFamily,
            t.bold,
            t.italic
          );

          const x = (t.x / 100) * pWidth;
          // Invert y from top to PDF bottom
          const y = pHeight - (t.y / 100) * pHeight - t.fontSize * 0.9;

          if (t.bgColor && t.bgColor !== "transparent") {
            const textWidth = fontToUse.widthOfTextAtSize(t.text, t.fontSize);
            page.drawRectangle({
              x: x - 2,
              y: y - 2,
              width: textWidth + 4,
              height: t.fontSize + 4,
              color: hexToPdfRgb(t.bgColor),
            });
          }

          page.drawText(t.text, {
            x,
            y,
            size: t.fontSize,
            font: fontToUse,
            color: hexToPdfRgb(t.color),
          });
        }
      }

      const finalPdfBytes = await pdfDoc.save();

      const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docName.endsWith(".pdf") ? `edited_${docName}` : `${docName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMsg("PDF compiled & downloaded successfully with matching fonts!");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF: " + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const currentPage = getCurrentPage();

  return (
    <div className="space-y-4">
      {/* Top Header & Document Title Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
              title="Click to rename document"
            />
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>100% In-Place Editor</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Click any original text on the PDF to edit in-place with matching font, whiteout/redact,
            find & replace text, sign, and save drafts for later.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Upload any PDF file from your device"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload PDF</span>
          </button>

          <button
            onClick={createBlankDocument}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Create clean blank page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Blank PDF</span>
          </button>

          <button
            onClick={() => setShowSavedDraftsModal(true)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open saved drafts"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Saved Drafts ({savedDrafts.length})</span>
          </button>

          <button
            onClick={handleSaveProjectForLater}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Save draft to browser for later"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download completed PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Compiling..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Primary Editing Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Tool Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTool("edit-original")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "edit-original"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              }`}
              title="Click any text directly on the PDF to edit it with matching font"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Original Text</span>
            </button>

            <button
              onClick={() => setSelectedTool("select")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "select"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Select and move overlays"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Select / Move</span>
            </button>

            <button
              onClick={() => setSelectedTool("text")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "text"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Click anywhere to insert a new text box"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Add New Text</span>
            </button>

            <button
              onClick={() => setSelectedTool("whiteout")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "whiteout"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Drag or click to whiteout/erase areas on page"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Whiteout / Erase</span>
            </button>

            <button
              onClick={() => setSelectedTool("draw")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "draw"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Draw freehand pen strokes"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>

            <button
              onClick={() => setSelectedTool("highlighter")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "highlighter"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
              title="Highlight text with translucent marker"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>

            <button
              onClick={() => setShowSignatureModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Insert digital drawn or typed signature"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Signature</span>
            </button>

            <input
              ref={stampInputRef}
              type="file"
              accept="image/*"
              onChange={handleStampUpload}
              className="hidden"
            />
            <button
              onClick={() => stampInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Insert logo, stamp, or image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image / Stamp</span>
            </button>
          </div>

          {/* Find & Replace / Options Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFindReplace
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Find and replace text across page"
            >
              <Replace className="w-3.5 h-3.5 text-purple-600" />
              <span>Find & Replace</span>
            </button>

            <button
              onClick={() => setShowTextLayer(!showTextLayer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showTextLayer
                  ? "bg-slate-100 text-slate-800"
                  : "bg-slate-50 text-slate-400"
              }`}
              title="Toggle interactive text layer hover indicators"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Text Layer {showTextLayer ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Find & Replace Drawer */}
        {showFindReplace && (
          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl flex flex-wrap items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-purple-600 shrink-0" />
              <input
                type="text"
                placeholder="Find text (e.g. $1,450.00 or Apex Media)..."
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Replace className="w-4 h-4 text-purple-600 shrink-0" />
              <input
                type="text"
                placeholder="Replace with (e.g. $2,200.00)..."
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleFindAndReplaceAll}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Replace on Page
            </button>
          </div>
        )}

        {/* Secondary Tool Properties Strip (Font, Size, Color, Weight) */}
        {(selectedTool === "text" || selectedTool === "edit-original" || selectedElementType === "text") && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            {/* Font Family */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Font:</span>
              <select
                value={textFontFamily}
                onChange={(e) => setTextFontFamily(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-medium text-slate-800"
              >
                <option value="Helvetica">Helvetica (Standard Sans)</option>
                <option value="Times">Times Roman (Serif / Formal)</option>
                <option value="Courier">Courier (Monospace / Code)</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">Size:</span>
              <button
                onClick={() => setTextFontSize((s) => Math.max(8, s - 1))}
                className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                -
              </button>
              <input
                type="number"
                min="8"
                max="64"
                value={textFontSize}
                onChange={(e) => setTextFontSize(Number(e.target.value))}
                className="w-12 text-center bg-slate-50 border border-slate-300 rounded py-0.5"
              />
              <button
                onClick={() => setTextFontSize((s) => Math.min(64, s + 1))}
                className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                +
              </button>
            </div>

            {/* Bold & Italic */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={() => setTextIsBold(!textIsBold)}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  textIsBold ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                B
              </button>
              <button
                onClick={() => setTextIsItalic(!textIsItalic)}
                className={`px-2.5 py-1 rounded italic font-serif transition-colors ${
                  textIsItalic ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                I
              </button>
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <span className="text-slate-500 font-semibold">Color:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <div className="flex items-center gap-1">
                {["#0f172a", "#1e3a8a", "#dc2626", "#16a34a"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    style={{ backgroundColor: c }}
                    className="w-4 h-4 rounded-full border border-slate-300 cursor-pointer"
                  />
                ))}
              </div>
            </div>

            {/* Background Mask Color */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <span className="text-slate-500 font-semibold">Mask / Whiteout:</span>
              <input
                type="color"
                value={whiteoutColor}
                onChange={(e) => setWhiteoutColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <span className="text-[10px] text-slate-400">(Default: #FFFFFF)</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Side: Page Navigator & Document Controls */}
        <div className="w-full lg:w-48 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3 shrink-0">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Page {currentPageIndex + 1} of {pageCount}
          </div>

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              disabled={currentPageIndex === 0}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono">
              {currentPageIndex + 1} / {pageCount}
            </span>
            <button
              onClick={() => setCurrentPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPageIndex >= pageCount - 1}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 block">Zoom: {zoomLevel}%</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold"
              >
                -
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px]"
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Page Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <button
              onClick={handleRotatePage}
              className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90°</span>
            </button>

            <button
              onClick={handleAddNewBlankPage}
              className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>

            <button
              onClick={handleDeleteCurrentPage}
              disabled={pageCount <= 1}
              className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Page</span>
            </button>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-tight">
            <p className="font-bold flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Original Text Match</span>
            </p>
            Hover and click any detected word to replace it seamlessly with the exact matching font.
          </div>
        </div>

        {/* Center: PDF Canvas & Interactive Overlay Layer */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-6 rounded-2xl flex justify-center min-h-[700px] border border-slate-300">
          <div
            ref={pageContainerRef}
            onClick={handleCanvasContainerClick}
            className="relative bg-white shadow-xl rounded-sm transition-transform select-none"
            style={{
              transform: `rotate(${currentPage.rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            {/* 1. Underlying Rendered PDF Canvas */}
            <canvas ref={pdfRenderCanvasRef} className="block w-full h-auto" />

            {/* Loading Spinner */}
            {isRenderingPage && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-40">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Rendering vector page & fonts...</span>
                </div>
              </div>
            )}

            {/* 2. Detected Original Text Interactive Layer ("Edit Original Text Mode") */}
            {showTextLayer && selectedTool === "edit-original" && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {detectedTexts.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditOriginalText(item);
                    }}
                    title={`Click to edit "${item.str}" (Font: ${item.fontFamily}, ${item.fontSize}pt)`}
                    className="absolute pointer-events-auto cursor-pointer rounded-xs border border-transparent hover:border-blue-500 hover:bg-blue-500/15 transition-all group"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.width}%`,
                      height: `${item.height}%`,
                    }}
                  >
                    <div className="hidden group-hover:flex absolute -top-5 left-0 items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-30">
                      <span>{item.fontFamily} {item.fontSize}pt</span>
                      <Edit3 className="w-2.5 h-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Whiteout / Redaction Layer */}
            {currentPage.whiteouts.map((w) => (
              <div
                key={w.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(w.id);
                  setSelectedElementType("whiteout");
                }}
                className={`absolute transition-all cursor-move z-10 ${
                  selectedElementId === w.id
                    ? "ring-2 ring-blue-500 shadow-md"
                    : "border border-transparent"
                }`}
                style={{
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  width: `${w.width}%`,
                  height: `${w.height}%`,
                  backgroundColor: w.color,
                }}
              >
                {selectedElementId === w.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCurrentPage((prev) => ({
                        ...prev,
                        whiteouts: prev.whiteouts.filter((item) => item.id !== w.id),
                      }));
                    }}
                    className="absolute -top-3 -right-3 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs hover:bg-rose-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* 4. Text Overlays Layer */}
            {currentPage.textOverlays.map((t) => (
              <div
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(t.id);
                  setSelectedElementType("text");
                  setTextFontFamily(t.fontFamily);
                  setTextFontSize(t.fontSize);
                  setTextColor(t.color);
                  setTextIsBold(!!t.bold);
                  setTextIsItalic(!!t.italic);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTarget({
                    existingOverlay: t,
                    currentValue: t.text,
                  });
                }}
                className={`absolute cursor-move z-20 px-1 py-0.5 rounded-xs transition-all ${
                  selectedElementId === t.id
                    ? "ring-2 ring-blue-600 bg-blue-50/50 shadow-md"
                    : "hover:ring-1 hover:ring-blue-400"
                }`}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  fontSize: `${t.fontSize * (zoomLevel / 100)}px`,
                  fontFamily:
                    t.fontFamily === "Times"
                      ? "'Times New Roman', Times, serif"
                      : t.fontFamily === "Courier"
                      ? "'Courier New', Courier, monospace"
                      : "Helvetica, Arial, sans-serif",
                  color: t.color,
                  fontWeight: t.bold ? "bold" : "normal",
                  fontStyle: t.italic ? "italic" : "normal",
                  backgroundColor: t.bgColor || "transparent",
                }}
              >
                {t.text}

                {selectedElementId === t.id && (
                  <div className="absolute -top-5 right-0 flex items-center gap-1 bg-slate-900 text-white rounded-md px-1.5 py-0.5 text-[9px] shadow-md z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTarget({
                          existingOverlay: t,
                          currentValue: t.text,
                        });
                      }}
                      className="hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <span>•</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCurrentPage((prev) => ({
                          ...prev,
                          textOverlays: prev.textOverlays.filter((item) => item.id !== t.id),
                        }));
                      }}
                      className="hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 5. Stamps and Signatures Layer */}
            {currentPage.stamps.map((s) => (
              <div
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(s.id);
                  setSelectedElementType("stamp");
                }}
                className={`absolute cursor-move z-20 ${
                  selectedElementId === s.id
                    ? "ring-2 ring-indigo-500 shadow-lg"
                    : "hover:ring-1 hover:ring-indigo-300"
                }`}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.width}%`,
                  height: `${s.height}%`,
                }}
              >
                <img
                  src={s.imageUrl}
                  alt="stamp"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {selectedElementId === s.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCurrentPage((prev) => ({
                        ...prev,
                        stamps: prev.stamps.filter((item) => item.id !== s.id),
                      }));
                    }}
                    className="absolute -top-3 -right-3 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs hover:bg-rose-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* 6. Drawing Canvas Layer */}
            <canvas
              ref={drawingCanvasRef}
              onMouseDown={handleDrawingMouseDown}
              onMouseMove={handleDrawingMouseMove}
              onMouseUp={handleDrawingMouseUp}
              onMouseLeave={handleDrawingMouseUp}
              className={`absolute inset-0 z-30 ${
                selectedTool === "draw" || selectedTool === "highlighter"
                  ? "pointer-events-auto cursor-crosshair"
                  : "pointer-events-none"
              }`}
            />
          </div>
        </div>
      </div>

      {/* In-Place Text Editing Modal Popover */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTarget.detectedText ? "Edit Original Text" : "Edit Text Overlay"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Matches the original font ({textFontFamily}, {textFontSize}pt,{" "}
                    {textIsBold ? "Bold" : "Regular"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Text Input Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Replacement Text:
              </label>
              <textarea
                rows={3}
                value={editingTarget.currentValue}
                onChange={(e) =>
                  setEditingTarget({ ...editingTarget, currentValue: e.target.value })
                }
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
              />
            </div>

            {/* Matching Font Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Font Family</label>
                <select
                  value={textFontFamily}
                  onChange={(e) => setTextFontFamily(e.target.value as any)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="Helvetica">Helvetica (Sans-Serif)</option>
                  <option value="Times">Times Roman (Serif)</option>
                  <option value="Courier">Courier (Monospace)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Font Size: {textFontSize}pt</label>
                <input
                  type="number"
                  min="8"
                  max="64"
                  value={textFontSize}
                  onChange={(e) => setTextFontSize(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textIsBold}
                    onChange={(e) => setTextIsBold(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-700">Bold</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={textIsItalic}
                    onChange={(e) => setTextIsItalic(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-700">Italic</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Color:</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {editingTarget.detectedText && (
                <button
                  onClick={() => {
                    handleQuickEraseText(editingTarget.detectedText!);
                    setEditingTarget(null);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Erase Completely</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setEditingTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTextReplacement}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Apply & Match Font
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Studio Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Feather className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Add Digital Signature</h3>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setSigMode("draw")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  sigMode === "draw" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Draw Signature
              </button>
              <button
                onClick={() => setSigMode("type")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  sigMode === "type" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Type Cursive Name
              </button>
            </div>

            {/* Draw Pad */}
            {sigMode === "draw" ? (
              <div className="space-y-2">
                <div className="border border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden">
                  <canvas
                    ref={sigPadCanvasRef}
                    width={400}
                    height={160}
                    onMouseDown={(e) => {
                      isSigDrawingRef.current = true;
                      const ctx = sigPadCanvasRef.current?.getContext("2d");
                      if (ctx) {
                        const rect = sigPadCanvasRef.current!.getBoundingClientRect();
                        ctx.beginPath();
                        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                        ctx.strokeStyle = "#0F172A";
                        ctx.lineWidth = 2.5;
                        ctx.lineCap = "round";
                      }
                    }}
                    onMouseMove={(e) => {
                      if (!isSigDrawingRef.current) return;
                      const ctx = sigPadCanvasRef.current?.getContext("2d");
                      if (ctx) {
                        const rect = sigPadCanvasRef.current!.getBoundingClientRect();
                        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                        ctx.stroke();
                      }
                    }}
                    onMouseUp={() => {
                      isSigDrawingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isSigDrawingRef.current = false;
                    }}
                    className="w-full h-40 cursor-crosshair block"
                  />
                  <span className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none">
                    Sign above using mouse or touch
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const ctx = sigPadCanvasRef.current?.getContext("2d");
                      if (ctx && sigPadCanvasRef.current) {
                        ctx.clearRect(
                          0,
                          0,
                          sigPadCanvasRef.current.width,
                          sigPadCanvasRef.current.height
                        );
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Johnathan Doe"
                    value={typedSigName}
                    onChange={(e) => setTypedSigName(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center min-h-[90px]">
                  <span
                    className="text-3xl text-slate-900"
                    style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive" }}
                  >
                    {typedSigName || "Preview Signature"}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySignature}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Drafts Modal ("save kr skhu bad ke liye bhi") */}
      {showSavedDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Saved PDF Project Drafts</h3>
              </div>
              <button
                onClick={() => setShowSavedDraftsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedDrafts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No saved drafts yet. Click "Save Draft" on any document to resume it anytime!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{draft.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Saved: {new Date(draft.savedAt).toLocaleDateString()} • {draft.pageCount} pages
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDraft(draft)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold"
                      >
                        Resume Draft
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Delete this draft?")) {
                            await deleteSavedPdfProject(draft.id);
                            await loadSavedDraftsList();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
