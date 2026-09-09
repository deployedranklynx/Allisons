import React, { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
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
} from "lucide-react";
import {
  savePdfProjectToDb,
  getAllSavedPdfProjects,
  getSavedPdfProjectById,
  deleteSavedPdfProject,
  SavedPdfProject,
} from "../lib/pdfStorage";

// Setup PDF.js worker safely
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not set PDF.js workerSrc CDN:", e);
}

// Interfaces for editable elements on each page
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  fontSize: number; // pt (10 - 48)
  fontFamily: "Helvetica" | "Times" | "Courier";
  color: string;
  bgColor?: string;
  bold?: boolean;
  italic?: boolean;
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
}

export interface StampImage {
  id: string;
  imageUrl: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
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

export const PdfEditor: React.FC = () => {
  // Document state
  const [docName, setDocName] = useState<string>("Untitled Document.pdf");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // percentage
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

  // Selected tool: "select", "text", "whiteout", "draw", "stamp"
  const [selectedTool, setSelectedTool] = useState<"select" | "text" | "whiteout" | "draw" | "stamp">("select");

  // Tool properties
  const [textColor, setTextColor] = useState<string>("#1e293b");
  const [textFontSize, setTextFontSize] = useState<number>(14);
  const [textFontFamily, setTextFontFamily] = useState<"Helvetica" | "Times" | "Courier">("Helvetica");
  const [textBgColor, setTextBgColor] = useState<string>("transparent");

  const [drawColor, setDrawColor] = useState<string>("#0984E3");
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [whiteoutColor, setWhiteoutColor] = useState<string>("#ffffff");

  // Selection & dragging state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<"text" | "whiteout" | "stamp" | null>(null);

  // Status & Saved Drafts Modals
  const [savedDrafts, setSavedDrafts] = useState<SavedPdfProject[]>([]);
  const [showSavedDraftsModal, setShowSavedDraftsModal] = useState<boolean>(false);
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Freehand drawing canvas refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pdfRenderCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);

  // Signature pad state
  const sigPadCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSigDrawingRef = useRef<boolean>(false);

  // Load existing drafts on mount
  useEffect(() => {
    loadSavedDraftsList();
    // Initialize default blank document
    createBlankDocument();
  }, []);

  const loadSavedDraftsList = async () => {
    try {
      const list = await getAllSavedPdfProjects();
      setSavedDrafts(list);
    } catch (err) {
      console.warn("Could not load drafts:", err);
    }
  };

  // Helper to create a new blank PDF
  const createBlankDocument = async () => {
    try {
      const newPdf = await PDFDocument.create();
      newPdf.addPage([595.28, 841.89]); // Standard A4 points
      const bytes = await newPdf.save();
      setPdfBytes(bytes);
      setDocName("New Document.pdf");
      setPageCount(1);
      setCurrentPageIndex(0);
      setPagesData([
        {
          pageIndex: 0,
          rotation: 0,
          textOverlays: [
            {
              id: "sample-header",
              text: "RankLynx PDF Document",
              x: 10,
              y: 8,
              fontSize: 22,
              fontFamily: "Helvetica",
              color: "#0F172A",
              bold: true,
            },
            {
              id: "sample-body",
              text: "Click anywhere to add text, use Whiteout to erase content, draw signatures, or upload any PDF to edit.",
              x: 10,
              y: 15,
              fontSize: 12,
              fontFamily: "Helvetica",
              color: "#64748B",
            },
          ],
          whiteouts: [],
          drawings: [],
          stamps: [],
        },
      ]);
    } catch (err) {
      console.error("Error creating blank document:", err);
    }
  };

  // Load sample document (invoice / contract)
  const loadSampleDocument = async () => {
    try {
      const newPdf = await PDFDocument.create();
      const page = newPdf.addPage([595.28, 841.89]);
      const font = await newPdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText("SERVICE AGREEMENT & NDA", {
        x: 50,
        y: 780,
        size: 20,
        font,
        color: rgb(0.06, 0.52, 0.89),
      });

      const regularFont = await newPdf.embedFont(StandardFonts.Helvetica);
      page.drawText("Document Reference: #RL-2026-9871", {
        x: 50,
        y: 750,
        size: 11,
        font: regularFont,
        color: rgb(0.4, 0.45, 0.5),
      });

      page.drawRectangle({
        x: 50,
        y: 720,
        width: 495,
        height: 1,
        color: rgb(0.85, 0.88, 0.9),
      });

      page.drawText("1. SCOPE OF SEARCH ENGINE OPTIMIZATION SERVICES", {
        x: 50,
        y: 690,
        size: 13,
        font,
        color: rgb(0.1, 0.15, 0.2),
      });

      page.drawText(
        "The Consultant agrees to deliver complete technical auditing, on-page optimization,\nand high-authority backlink outreach as outlined in Exhibit A.",
        {
          x: 50,
          y: 660,
          size: 11,
          font: regularFont,
          color: rgb(0.2, 0.25, 0.3),
          lineHeight: 16,
        }
      );

      page.drawText("Authorized Representative:", {
        x: 50,
        y: 540,
        size: 11,
        font,
        color: rgb(0.1, 0.15, 0.2),
      });

      page.drawText("Date of Execution: ____________________", {
        x: 50,
        y: 480,
        size: 11,
        font: regularFont,
        color: rgb(0.3, 0.35, 0.4),
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
          textOverlays: [
            {
              id: "client-name",
              text: "[Client Name: TechCorp Global]",
              x: 10,
              y: 42,
              fontSize: 12,
              fontFamily: "Helvetica",
              color: "#0984E3",
              bold: true,
            },
          ],
          whiteouts: [],
          drawings: [],
          stamps: [],
        },
      ]);
      setStatusMsg("Loaded sample editable PDF agreement.");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error("Failed to load sample:", err);
    }
  };

  // Render current PDF page using PDF.js onto the background canvas
  useEffect(() => {
    if (!pdfBytes) return;

    let isCancelled = false;
    const renderPage = async () => {
      try {
        setIsRenderingPage(true);
        // Load document into PDF.js
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

        // Calculate scale based on standard A4 width (~800px display width)
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Match drawing overlay canvas dimensions exactly
        if (drawingCanvasRef.current) {
          drawingCanvasRef.current.width = viewport.width;
          drawingCanvasRef.current.height = viewport.height;
          redrawCurrentDrawings();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await (page.render(renderContext as any)).promise;
      } catch (err) {
        console.warn("PDF.js render fallback:", err);
      } finally {
        if (!isCancelled) setIsRenderingPage(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPageIndex]);

  // Redraw existing freehand drawings for the current page onto drawingCanvasRef
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

      // Convert percentage coordinates back to pixel coordinates
      const first = drawing.points[0];
      ctx.moveTo((first.x / 100) * canvas.width, (first.y / 100) * canvas.height);

      for (let i = 1; i < drawing.points.length; i++) {
        const pt = drawing.points[i];
        ctx.lineTo((pt.x / 100) * canvas.width, (pt.y / 100) * canvas.height);
      }
      ctx.stroke();
    });
  };

  // Redraw whenever pagesData or currentPageIndex changes
  useEffect(() => {
    redrawCurrentDrawings();
  }, [pagesData, currentPageIndex]);

  // Current page state helper
  const getCurrentPage = (): PageState => {
    const found = pagesData.find((p) => p.pageIndex === currentPageIndex);
    if (found) return found;
    const newPage: PageState = {
      pageIndex: currentPageIndex,
      rotation: 0,
      textOverlays: [],
      whiteouts: [],
      drawings: [],
      stamps: [],
    };
    setPagesData((prev) => [...prev, newPage]);
    return newPage;
  };

  const updateCurrentPage = (updater: (prev: PageState) => PageState) => {
    setPagesData((prev) => {
      const exists = prev.some((p) => p.pageIndex === currentPageIndex);
      if (!exists) {
        const fresh: PageState = {
          pageIndex: currentPageIndex,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        };
        return [...prev, updater(fresh)];
      }
      return prev.map((p) => (p.pageIndex === currentPageIndex ? updater(p) : p));
    });
  };

  // Upload user's PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Verify with pdf-lib
      const loadedDoc = await PDFDocument.load(bytes);
      const totalPages = loadedDoc.getPageCount();

      setPdfBytes(bytes);
      setDocName(file.name);
      setPageCount(totalPages);
      setCurrentPageIndex(0);

      // Initialize empty overlays for each page
      const initPages: PageState[] = [];
      for (let i = 0; i < totalPages; i++) {
        initPages.push({
          pageIndex: i,
          rotation: 0,
          textOverlays: [],
          whiteouts: [],
          drawings: [],
          stamps: [],
        });
      }
      setPagesData(initPages);
      setStatusMsg(`Successfully loaded "${file.name}" (${totalPages} pages)`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      alert("Failed to parse PDF file. Please ensure it is a valid, uncorrupted PDF.");
    }
  };

  // Click on PDF Canvas Container: Handle placing new text box or whiteout
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === "select") return;

    const container = pageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(95, (clickX / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(95, (clickY / rect.height) * 100));

    if (selectedTool === "text") {
      const newText: TextOverlay = {
        id: `text-${Date.now()}`,
        text: "Click to edit text",
        x: Math.round(xPercent),
        y: Math.round(yPercent),
        fontSize: textFontSize,
        fontFamily: textFontFamily,
        color: textColor,
        bgColor: textBgColor !== "transparent" ? textBgColor : undefined,
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

  // Drawing Canvas mouse events (Freehand pen/highlighter)
  const handleDrawingMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "draw") return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentPathRef.current = [{ x, y }];
  };

  const handleDrawingMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || selectedTool !== "draw") return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentPathRef.current.push({ x, y });

    // Live stroke
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const pts = currentPathRef.current;
    if (pts.length > 1) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo((p1.x / 100) * canvas.width, (p1.y / 100) * canvas.height);
      ctx.lineTo((p2.x / 100) * canvas.width, (p2.y / 100) * canvas.height);
      ctx.stroke();
    }
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawingRef.current || selectedTool !== "draw") return;
    isDrawingRef.current = false;

    if (currentPathRef.current.length > 1) {
      const newDrawing: FreehandDrawing = {
        id: `draw-${Date.now()}`,
        points: [...currentPathRef.current],
        color: drawColor,
        width: drawWidth,
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
          x: 20,
          y: 20,
          width: 25,
          height: 15,
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

  // Add signature image from Signature Pad
  const handleSaveSignature = (sigDataUrl: string) => {
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
    setStatusMsg("Signature placed! You can drag and position it anywhere.");
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Page Operations
  const handleRotatePage = () => {
    updateCurrentPage((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
    setStatusMsg("Page rotated 90 degrees.");
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
      setStatusMsg(`Added new blank page (Page ${newTotal}).`);
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

      // Re-index pagesData
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
      // Convert pdfBytes to base64 data URL
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
      // Decode base64 PDF
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

  // Delete saved draft
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved draft?")) return;
    await deleteSavedPdfProject(id);
    await loadSavedDraftsList();
  };

  // Export / Compile Final PDF with pdf-lib ("bina kisi issues ke save kr skhu")
  const handleExportPdf = async () => {
    if (!pdfBytes) return;

    try {
      setIsExporting(true);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // Embed standard fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

      // Iterate through all pages and bake overlays
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const page = pages[pIdx];
        const { width: pWidth, height: pHeight } = page.getSize();
        const pageData = pagesData.find((p) => p.pageIndex === pIdx);
        if (!pageData) continue;

        // Apply rotation if any
        if (pageData.rotation) {
          page.setRotation(degrees(pageData.rotation));
        }

        // 1. Draw Whiteouts / Redactions FIRST so text overlays can sit on top
        for (const w of pageData.whiteouts) {
          const wWidth = (w.width / 100) * pWidth;
          const wHeight = (w.height / 100) * pHeight;
          const x = (w.x / 100) * pWidth;
          // In PDF, Y=0 is at bottom!
          const y = pHeight - (w.y / 100) * pHeight - wHeight;

          page.drawRectangle({
            x,
            y,
            width: wWidth,
            height: wHeight,
            color: hexToPdfRgb(w.color),
          });
        }

        // 2. Draw Stamps and Signatures (PNG / JPEG images)
        for (const s of pageData.stamps) {
          try {
            let embeddedImg;
            if (s.imageUrl.includes("image/png")) {
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

        // 3. Draw Text Overlays
        for (const t of pageData.textOverlays) {
          let fontToUse = helveticaFont;
          if (t.fontFamily === "Times") fontToUse = timesFont;
          else if (t.fontFamily === "Courier") fontToUse = courierFont;
          else if (t.bold) fontToUse = helveticaBold;

          const x = (t.x / 100) * pWidth;
          // Calculate PDF y coordinate (top to bottom inverted)
          const y = pHeight - (t.y / 100) * pHeight - t.fontSize;

          // If text has a background color, draw background box
          if (t.bgColor && t.bgColor !== "transparent") {
            const textWidth = fontToUse.widthOfTextAtSize(t.text, t.fontSize);
            page.drawRectangle({
              x: x - 4,
              y: y - 2,
              width: textWidth + 8,
              height: t.fontSize + 6,
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

      // Save modified PDF
      const finalPdfBytes = await pdfDoc.save();

      // Trigger browser download
      const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docName.endsWith(".pdf") ? `edited_${docName}` : `${docName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMsg("PDF compiled & downloaded successfully!");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF: " + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  // Print PDF directly
  const handlePrintPdf = async () => {
    if (!pdfBytes) return;
    try {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch {
      window.print();
    }
  };

  const currentPage = getCurrentPage();

  return (
    <div className="space-y-5">
      {/* Top Header & Project Bar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="text-lg font-bold text-[#0F172A] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0984E3] focus:outline-none transition-colors"
              title="Click to rename document"
            />
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              PDF Editor Pro
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Edit any PDF document, add text, whiteout/redact, draw signatures, insert stamps, and save drafts locally for later.
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
            <Upload className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>Upload PDF</span>
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
            <span>{isExporting ? "Exporting..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Editing Toolbar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Tool Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTool("select")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "select"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Select, move, and edit elements"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Select / Move</span>
            </button>

            <button
              onClick={() => setSelectedTool("text")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "text"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Click on the page to insert custom text"
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Text</span>
            </button>

            <button
              onClick={() => setSelectedTool("whiteout")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "whiteout"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Place a whiteout box to hide or redact text"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-600" />
              <span>Whiteout / Redact</span>
            </button>

            <button
              onClick={() => setSelectedTool("draw")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "draw"
                  ? "bg-[#0984E3] text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
              title="Freehand pen or highlight notes"
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-600" />
              <span>Draw / Pen</span>
            </button>

            <button
              onClick={() => setShowSignatureModal(true)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Draw or stamp digital signature"
            >
              <Feather className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Signature</span>
            </button>

            <input
              ref={stampInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleStampUpload}
              className="hidden"
            />
            <button
              onClick={() => stampInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload logo, company stamp, or badge image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Insert Image</span>
            </button>
          </div>

          {/* Page & Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRotatePage}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="Rotate Page 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-200" />

            <button
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(175, prev + 15))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-200" />

            <button
              onClick={handlePrintPdf}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Tool Settings */}
        {selectedTool === "text" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600 animate-fadeIn">
            <span className="font-semibold text-slate-400">Text Settings:</span>
            <select
              value={textFontFamily}
              onChange={(e) => setTextFontFamily(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="Helvetica">Helvetica (Clean)</option>
              <option value="Times">Times Roman (Formal)</option>
              <option value="Courier">Courier (Typewriter)</option>
            </select>

            <select
              value={textFontSize}
              onChange={(e) => setTextFontSize(parseInt(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value={10}>10 pt (Small)</option>
              <option value={12}>12 pt (Standard)</option>
              <option value={14}>14 pt (Medium)</option>
              <option value={18}>18 pt (Heading)</option>
              <option value={24}>24 pt (Title)</option>
              <option value={32}>32 pt (Banner)</option>
            </select>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium">Color:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium">Bg Fill:</span>
              <select
                value={textBgColor}
                onChange={(e) => setTextBgColor(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="transparent">Transparent</option>
                <option value="#ffffff">White Box</option>
                <option value="#fef08a">Yellow Highlight</option>
                <option value="#bfdbfe">Blue Tint</option>
              </select>
            </div>

            <span className="text-[11px] text-blue-600 italic">
              👉 Click anywhere on the PDF page below to place text.
            </span>
          </div>
        )}

        {selectedTool === "whiteout" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600 animate-fadeIn">
            <span className="font-semibold text-slate-400">Whiteout Settings:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium">Block Color:</span>
              <select
                value={whiteoutColor}
                onChange={(e) => setWhiteoutColor(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="#ffffff">White (Erase/Cover)</option>
                <option value="#000000">Black (Redaction)</option>
                <option value="#f8fafc">Off-White</option>
              </select>
            </div>
            <span className="text-[11px] text-amber-600 italic">
              👉 Click anywhere on the document to place a redaction box.
            </span>
          </div>
        )}

        {selectedTool === "draw" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 animate-fadeIn">
            <span className="font-semibold text-slate-400">Brush Settings:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium">Color:</span>
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium">Width:</span>
              <select
                value={drawWidth}
                onChange={(e) => setDrawWidth(parseInt(e.target.value))}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value={2}>Fine (2px)</option>
                <option value={4}>Medium (4px)</option>
                <option value={8}>Marker / Highlight (8px)</option>
              </select>
            </div>
            <button
              onClick={() => {
                updateCurrentPage((prev) => ({ ...prev, drawings: [] }));
                redrawCurrentDrawings();
              }}
              className="text-xs text-red-600 hover:underline cursor-pointer"
            >
              Clear drawings on this page
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Frame & Page Navigation */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center overflow-x-auto min-h-[700px]">
        {/* Page Pagination Bar */}
        <div className="bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200 flex items-center gap-4 mb-4 text-xs font-semibold text-slate-700">
          <button
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <span className="font-bold text-[#0984E3]">{currentPageIndex + 1}</span> of{" "}
            <span className="font-bold">{pageCount}</span>
          </span>
          <button
            onClick={() => setCurrentPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={currentPageIndex >= pageCount - 1}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200" />

          <button
            onClick={handleAddNewBlankPage}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            title="Insert new blank page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Page</span>
          </button>

          {pageCount > 1 && (
            <button
              onClick={handleDeleteCurrentPage}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer ml-1"
              title="Delete current page"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>

        {/* Scaled PDF Document Page Container */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="relative"
        >
          <div
            ref={pageContainerRef}
            onClick={handleContainerClick}
            className={`relative bg-white shadow-lg border border-slate-300 rounded-sm overflow-hidden select-none ${
              selectedTool === "text"
                ? "cursor-text"
                : selectedTool === "whiteout"
                ? "cursor-crosshair"
                : selectedTool === "draw"
                ? "cursor-crosshair"
                : "cursor-default"
            }`}
            style={{
              width: "794px", // Standard A4 display pixel width at 96 DPI
              minHeight: "1123px", // Standard A4 display pixel height
              transform: `rotate(${currentPage.rotation}deg)`,
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {/* 1. Underlying PDF Render Canvas */}
            <canvas
              ref={pdfRenderCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* 2. Whiteouts / Redaction Boxes */}
            {currentPage.whiteouts.map((w) => (
              <div
                key={w.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(w.id);
                  setSelectedElementType("whiteout");
                }}
                className={`absolute group cursor-move ${
                  selectedElementId === w.id ? "ring-2 ring-blue-500 shadow-md" : ""
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
                  <div className="absolute -top-7 right-0 bg-slate-900 text-white rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1 shadow">
                    <span>Redaction Box</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCurrentPage((prev) => ({
                          ...prev,
                          whiteouts: prev.whiteouts.filter((item) => item.id !== w.id),
                        }));
                      }}
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 3. Stamp Images / Digital Signatures */}
            {currentPage.stamps.map((s) => (
              <div
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(s.id);
                  setSelectedElementType("stamp");
                }}
                className={`absolute group cursor-move ${
                  selectedElementId === s.id ? "ring-2 ring-emerald-500 shadow-md" : ""
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
                  alt="Stamp"
                  className="w-full h-full object-contain pointer-events-none"
                />
                {selectedElementId === s.id && (
                  <div className="absolute -top-7 right-0 bg-slate-900 text-white rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1 shadow">
                    <span>Stamp/Signature</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCurrentPage((prev) => ({
                          ...prev,
                          stamps: prev.stamps.filter((item) => item.id !== s.id),
                        }));
                      }}
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 4. Freehand Ink Overlay Canvas */}
            <canvas
              ref={drawingCanvasRef}
              onMouseDown={handleDrawingMouseDown}
              onMouseMove={handleDrawingMouseMove}
              onMouseUp={handleDrawingMouseUp}
              className={`absolute inset-0 w-full h-full z-10 ${
                selectedTool === "draw" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
              }`}
            />

            {/* 5. Interactive Text Overlays */}
            {currentPage.textOverlays.map((t) => (
              <div
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(t.id);
                  setSelectedElementType("text");
                }}
                className={`absolute z-20 group transition-shadow ${
                  selectedElementId === t.id
                    ? "ring-2 ring-[#0984E3] bg-blue-50/20 shadow-md rounded"
                    : "hover:ring-1 hover:ring-slate-400/50"
                }`}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  fontSize: `${t.fontSize}px`,
                  fontFamily: t.fontFamily,
                  color: t.color,
                  backgroundColor: t.bgColor || "transparent",
                  fontWeight: t.bold ? "bold" : "normal",
                  fontStyle: t.italic ? "italic" : "normal",
                  padding: "2px 4px",
                }}
              >
                <input
                  type="text"
                  value={t.text}
                  onChange={(e) => {
                    const newText = e.target.value;
                    updateCurrentPage((prev) => ({
                      ...prev,
                      textOverlays: prev.textOverlays.map((item) =>
                        item.id === t.id ? { ...item, text: newText } : item
                      ),
                    }));
                  }}
                  className="bg-transparent border-0 focus:outline-none min-w-[60px]"
                />

                {selectedElementId === t.id && (
                  <div className="absolute -top-7 left-0 bg-slate-900 text-white rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1.5 shadow whitespace-nowrap">
                    <span>X: {t.x}% Y: {t.y}%</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCurrentPage((prev) => ({
                          ...prev,
                          textOverlays: prev.textOverlays.filter((item) => item.id !== t.id),
                        }));
                      }}
                      className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                      title="Delete text"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Information & Sample Templates */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div>
            <span className="font-semibold text-slate-400 mr-1">Document:</span>
            <span className="font-bold text-[#0F172A]">{docName}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Pages:</span>
            <span className="font-bold text-[#0F172A]">{pageCount}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Overlays on this page:</span>
            <span className="font-bold text-[#0984E3]">
              {currentPage.textOverlays.length} texts, {currentPage.whiteouts.length} whiteouts,{" "}
              {currentPage.stamps.length} stamps
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={createBlankDocument}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            New Blank PDF
          </button>
          <div className="w-[1px] h-4 bg-slate-200" />
          <button
            onClick={loadSampleDocument}
            className="text-xs font-semibold text-[#0984E3] hover:underline cursor-pointer"
          >
            Load Sample Agreement
          </button>
        </div>
      </div>

      {/* Modal: Saved Drafts ("save kr skhu bad ke liye") */}
      {showSavedDraftsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Saved PDF Projects & Drafts
                </h3>
              </div>
              <button
                onClick={() => setShowSavedDraftsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Your drafts are securely preserved in your browser’s local storage. You can reopen any project and continue editing without losing text, stamps, or redactions.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {savedDrafts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No saved drafts yet. Click "Save Draft" in the editor to save your current work!
                </div>
              ) : (
                savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => handleOpenDraft(draft)}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#0984E3]">
                        {draft.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Saved: {new Date(draft.savedAt).toLocaleString()} • {draft.pageCount} page(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0984E3]">Resume</span>
                      <button
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSavedDraftsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Draw Digital Signature */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Feather className="w-4 h-4 text-emerald-600" />
                <span>Draw Your Digital Signature</span>
              </h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Draw your handwritten signature below using your mouse, trackpad, or touch screen.
            </p>

            <div className="border border-slate-300 rounded-xl bg-slate-50/50 p-1 flex justify-center">
              <canvas
                ref={sigPadCanvasRef}
                width={380}
                height={160}
                onMouseDown={(e) => {
                  isSigDrawingRef.current = true;
                  const canvas = sigPadCanvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const rect = canvas.getBoundingClientRect();
                  ctx.beginPath();
                  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                  ctx.strokeStyle = "#0F172A";
                  ctx.lineWidth = 2.5;
                  ctx.lineCap = "round";
                  ctx.lineJoin = "round";
                }}
                onMouseMove={(e) => {
                  if (!isSigDrawingRef.current) return;
                  const canvas = sigPadCanvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const rect = canvas.getBoundingClientRect();
                  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                  ctx.stroke();
                }}
                onMouseUp={() => {
                  isSigDrawingRef.current = false;
                }}
                className="cursor-crosshair bg-white rounded-lg shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const canvas = sigPadCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext("2d");
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear Signature
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const canvas = sigPadCanvasRef.current;
                    if (canvas) {
                      const dataUrl = canvas.toDataURL("image/png");
                      handleSaveSignature(dataUrl);
                    }
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Place Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
