import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Code,
  Sparkles,
  Download,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Eraser,
  Undo,
  Redo,
  FileCode,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

const SAMPLE_WORD_CONTENT = `<h1>Ultimate On-Page SEO Checklist & Guidelines</h1>
<p>Welcome to the <strong>Word to HTML</strong> converter. This professional tool cleans Microsoft Word documents, Google Docs pastes, and rich text into clean, valid, search-engine-ready HTML.</p>
<h2>1. Why Clean Word HTML?</h2>
<p>When you copy text from Microsoft Word or Office 365, it introduces thousands of redundant XML tags, conditional comments, and proprietary <code>mso-*</code> CSS properties that bloat web pages and harm Core Web Vitals.</p>
<ul>
  <li>Strips <em>MsoNormal</em> classes and proprietary tags.</li>
  <li>Converts curly quotes (“smart quotes”) into standard characters.</li>
  <li>Normalizes heading hierarchy and bulleted lists.</li>
  <li>Generates responsive, lightweight web tables.</li>
</ul>
<blockquote>"Clean code leads to faster indexing, better user experience, and higher organic rankings." — Search Engine Journal</blockquote>
<h2>2. Technical Performance Matrix</h2>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th>Feature</th>
      <th>Dirty Word Output</th>
      <th>RankLynx Clean HTML</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>File Payload</td>
      <td>~85 KB</td>
      <td>~4.2 KB (95% reduction)</td>
    </tr>
    <tr>
      <td>MS Office Namespaces</td>
      <td>&lt;o:p&gt;, &lt;w:WordDocument&gt;</td>
      <td>Zero bloat, 100% W3C valid</td>
    </tr>
    <tr>
      <td>Search Engine Friendliness</td>
      <td>Poor / Cluttered</td>
      <td>High / Fast parsing</td>
    </tr>
  </tbody>
</table>
<p>Try making live edits on the left, or edit the HTML source directly on the right!</p>`;

// Function to clean MS Word junk and unwanted tags
export function cleanWordHtml(html: string, options: {
  stripMso?: boolean;
  stripStyles?: boolean;
  stripEmptyTags?: boolean;
  stripSpans?: boolean;
  convertQuotes?: boolean;
  cleanFonts?: boolean;
} = {}): string {
  let cleaned = html;

  // 1. Remove XML declarations and Office comments <!--[if ...]>...<![endif]-->
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, "");
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, "");
  cleaned = cleaned.replace(/<o:p[\s\S]*?>[\s\S]*?<\/o:p>/gi, "");
  cleaned = cleaned.replace(/<\/?(o|v|w|x|p):[^>]*>/gi, "");

  // 2. Strip MS Word classes like class="MsoNormal", class="MsoListParagraph"
  if (options.stripMso !== false) {
    cleaned = cleaned.replace(/\s*class=["']?Mso[a-zA-Z0-9_-]*["']?/gi, "");
    cleaned = cleaned.replace(/\s*style=["'][^"']*mso-[^"']*["']/gi, (match) => {
      // Clean only the mso- rules out of style attribute
      const filtered = match
        .replace(/mso-[a-zA-Z0-9_-]+:[^;]+;?/gi, "")
        .replace(/style=["']\s*["']/gi, "");
      return filtered.trim() === 'style=""' ? "" : filtered;
    });
  }

  // 3. Convert smart quotes and special characters
  if (options.convertQuotes !== false) {
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/&lsquo;|&rsquo;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .replace(/&ndash;|&mdash;/g, "-");
  }

  // 4. Strip <font> tags while preserving text
  if (options.cleanFonts !== false) {
    cleaned = cleaned.replace(/<\/?font[^>]*>/gi, "");
  }

  // 5. Strip <span> wrappers if requested or if without styles
  if (options.stripSpans) {
    cleaned = cleaned.replace(/<\/?span[^>]*>/gi, "");
  } else {
    // Strip empty unstyled <span></span> or <span>text</span> with no attributes
    cleaned = cleaned.replace(/<span>([\s\S]*?)<\/span>/gi, "$1");
  }

  // 6. Strip all inline styles if requested
  if (options.stripStyles) {
    cleaned = cleaned.replace(/\s*style=["'][^"']*["']/gi, "");
  }

  // 7. Strip empty tags (<p>&nbsp;</p>, <p></p>, <div></div>, etc.)
  if (options.stripEmptyTags !== false) {
    cleaned = cleaned.replace(/<p>\s*(&nbsp;)?\s*<\/p>/gi, "");
    cleaned = cleaned.replace(/<div>\s*(&nbsp;)?\s*<\/div>/gi, "");
    cleaned = cleaned.replace(/<(b|strong|i|em|u|span)>\s*<\/\1>/gi, "");
  }

  // 8. Trim extra whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n").trim();

  return cleaned;
}

// Format / Beautify HTML with indentation
export function beautifyHtml(html: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";

  // Normalize newlines around tags
  const tokens = html
    .replace(/>\s*</g, "><")
    .replace(/(<[a-zA-Z0-9]+[^>]*>)/g, "\n$1")
    .replace(/(<\/[a-zA-Z0-9]+>)/g, "$1\n")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  tokens.forEach((token) => {
    // Closing tag
    if (token.match(/^<\/[a-zA-Z0-9]+/)) {
      indent = Math.max(0, indent - 1);
    }

    formatted += tab.repeat(indent) + token + "\n";

    // Opening tag that is not self-closing and not inline
    if (
      token.match(/^<[a-zA-Z0-9]+[^>]*>/) &&
      !token.match(/\/>$/) &&
      !token.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i) &&
      !token.match(/^<(b|strong|i|em|u|span|a|code|sub|sup)/i) &&
      !token.match(/^<([a-zA-Z0-9]+)[^>]*>.*<\/\1>$/) // Single line element
    ) {
      indent++;
    }
  });

  return formatted.trim();
}

// Minify HTML
export function minifyHtml(html: string): string {
  return html
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

export const WordHtmlConverter: React.FC = () => {
  const [contentHtml, setContentHtml] = useState<string>(SAMPLE_WORD_CONTENT);
  const [htmlCode, setHtmlCode] = useState<string>(() => beautifyHtml(SAMPLE_WORD_CONTENT));
  const [activePane, setActivePane] = useState<"split" | "visual" | "html">("split");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Link dialog state
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("https://");
  const [linkText, setLinkText] = useState<string>("");
  const [linkTargetBlank, setLinkTargetBlank] = useState<boolean>(true);

  // Table modal state
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);

  // Image modal state
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingFromCode = useRef<boolean>(false);
  const isUpdatingFromVisual = useRef<boolean>(false);

  // Sync initial content to visual editor
  useEffect(() => {
    if (visualEditorRef.current && !isUpdatingFromVisual.current) {
      visualEditorRef.current.innerHTML = contentHtml;
    }
  }, [contentHtml]);

  // Handle visual editor input
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      isUpdatingFromVisual.current = true;
      const html = visualEditorRef.current.innerHTML;
      setContentHtml(html);
      setHtmlCode(beautifyHtml(html));
      setTimeout(() => {
        isUpdatingFromVisual.current = false;
      }, 50);
    }
  };

  // Handle paste in visual editor with auto MS-Word cleanup
  const handleVisualPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData("text/html");
    const pastedText = e.clipboardData.getData("text/plain");

    if (pastedHtml) {
      // Auto-clean Word formatting on paste!
      const cleaned = cleanWordHtml(pastedHtml);
      document.execCommand("insertHTML", false, cleaned);
      setStatusMsg("Auto-cleaned pasted MS Word format!");
      setTimeout(() => setStatusMsg(null), 3000);
    } else if (pastedText) {
      document.execCommand("insertText", false, pastedText);
    }
    handleVisualInput();
  };

  // Handle HTML code editor input
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setHtmlCode(newCode);
    isUpdatingFromCode.current = true;
    setContentHtml(newCode);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = newCode;
    }
    setTimeout(() => {
      isUpdatingFromCode.current = false;
    }, 50);
  };

  // Formatting actions
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    handleVisualInput();
  };

  // Insert link
  const handleInsertLink = () => {
    if (!linkUrl) return;
    const targetAttr = linkTargetBlank ? ' target="_blank" rel="noopener noreferrer"' : "";
    const anchorHtml = `<a href="${linkUrl}"${targetAttr}>${linkText || linkUrl}</a>`;
    executeCommand("insertHTML", anchorHtml);
    setShowLinkModal(false);
    setLinkUrl("https://");
    setLinkText("");
  };

  // Insert table
  const handleInsertTable = () => {
    let tableHtml = '<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">\n<thead>\n<tr style="background-color: #f1f5f9;">\n';
    for (let c = 1; c <= tableCols; c++) {
      tableHtml += `  <th>Header ${c}</th>\n`;
    }
    tableHtml += "</tr>\n</thead>\n<tbody>\n";
    for (let r = 1; r <= tableRows; r++) {
      tableHtml += "<tr>\n";
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `  <td>Row ${r}, Cell ${c}</td>\n`;
      }
      tableHtml += "</tr>\n";
    }
    tableHtml += "</tbody>\n</table>\n<p></p>";
    executeCommand("insertHTML", tableHtml);
    setShowTableModal(false);
  };

  // Insert image
  const handleInsertImage = () => {
    if (!imageUrl) return;
    const imgHtml = `<img src="${imageUrl}" alt="${imageAlt || "Image"}" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
    executeCommand("insertHTML", imgHtml);
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  };

  // WordHTML Cleaner Triggers
  const handleCleanWordJunk = () => {
    const cleaned = cleanWordHtml(contentHtml, {
      stripMso: true,
      stripEmptyTags: true,
      convertQuotes: true,
      cleanFonts: true,
    });
    const formatted = beautifyHtml(cleaned);
    setContentHtml(cleaned);
    setHtmlCode(formatted);
    if (visualEditorRef.current) visualEditorRef.current.innerHTML = cleaned;
    setStatusMsg("MS Word junk tags, mso styles & smart quotes cleaned!");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleStripAllStyles = () => {
    const cleaned = cleanWordHtml(contentHtml, {
      stripMso: true,
      stripStyles: true,
      stripEmptyTags: true,
      stripSpans: true,
    });
    const formatted = beautifyHtml(cleaned);
    setContentHtml(cleaned);
    setHtmlCode(formatted);
    if (visualEditorRef.current) visualEditorRef.current.innerHTML = cleaned;
    setStatusMsg("All inline CSS styles & font spans removed!");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleBeautify = () => {
    const formatted = beautifyHtml(htmlCode);
    setHtmlCode(formatted);
    setStatusMsg("HTML formatted with clean indentation!");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleMinify = () => {
    const minified = minifyHtml(htmlCode);
    setHtmlCode(minified);
    setStatusMsg("HTML minified into compact single line!");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      setContentHtml("");
      setHtmlCode("");
      if (visualEditorRef.current) visualEditorRef.current.innerHTML = "";
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        let importedHtml = text;
        if (file.name.endsWith(".txt")) {
          // Convert plain text paragraphs into HTML
          importedHtml = text
            .split(/\n\s*\n/)
            .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
            .join("\n");
        } else {
          // Auto-clean Word or HTML file
          importedHtml = cleanWordHtml(text);
        }

        const formatted = beautifyHtml(importedHtml);
        setContentHtml(importedHtml);
        setHtmlCode(formatted);
        if (visualEditorRef.current) visualEditorRef.current.innerHTML = importedHtml;
        setStatusMsg(`Imported and cleaned "${file.name}"!`);
        setTimeout(() => setStatusMsg(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  // Download as HTML file
  const handleDownloadHtml = () => {
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clean-document.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as MS Word (.doc)
  const handleDownloadWordDoc = () => {
    // Standard MSO Word HTML MIME wrapper that opens seamlessly in Microsoft Word, LibreOffice, and Google Docs
    const wordDocContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Document</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #2d3748; }
    h1 { font-size: 20pt; color: #1a202c; }
    h2 { font-size: 16pt; color: #2d3748; }
    h3 { font-size: 13pt; color: #4a5568; }
    table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
    th, td { border: 1px solid #cbd5e0; padding: 6pt; }
    th { background-color: #edf2f7; }
    blockquote { border-left: 3pt solid #3182ce; padding-left: 10pt; color: #4a5568; font-style: italic; }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

    const blob = new Blob([wordDocContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exported-document.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy HTML
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy Visual / Rich Text
  const handleCopyVisual = () => {
    if (visualEditorRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(visualEditorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Word & Character count metrics
  const textOnly = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
  const charCount = textOnly.length;
  const htmlSizeKb = (new Blob([htmlCode]).size / 1024).toFixed(2);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] flex items-center justify-center font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Word to HTML & HTML to Word Converter
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              WordHTML Engine
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Clean Microsoft Word documents, convert visual text into clean W3C HTML, strip bloat, and export Word documents instantly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Upload HTML, Word, or text file"
          >
            <Upload className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>Upload File</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download clean HTML document"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download .HTML</span>
          </button>

          <button
            onClick={handleDownloadWordDoc}
            className="px-3.5 py-2 bg-[#0984E3] hover:bg-[#0873C4] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Export native Word Document (.doc)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download .DOC (Word)</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-medium text-blue-800 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#0984E3] shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Top WordHTML Cleaning & Formatting Toolbar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-3 shadow-xs space-y-2.5">
        {/* Row 1: Word Cleanup Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              WordHTML Cleaners:
            </span>

            <button
              onClick={handleCleanWordJunk}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0984E3] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Strip Microsoft Office tags (<o:p>, mso styles, smart quotes, comments)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean MS Word Junk</span>
            </button>

            <button
              onClick={handleStripAllStyles}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Remove all inline style='' attributes and font tags"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-600" />
              <span>Strip All Styles</span>
            </button>

            <button
              onClick={handleBeautify}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Beautify and indent HTML code"
            >
              <Code className="w-3.5 h-3.5 text-indigo-600" />
              <span>Format HTML</span>
            </button>

            <button
              onClick={handleMinify}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Compress HTML into single line"
            >
              <Minus className="w-3.5 h-3.5 text-slate-500" />
              <span>Minify</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActivePane("split")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activePane === "split" ? "bg-white text-[#0984E3] shadow-xs" : "text-slate-600"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setActivePane("visual")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activePane === "visual" ? "bg-white text-[#0984E3] shadow-xs" : "text-slate-600"
                }`}
              >
                Word Visual
              </button>
              <button
                onClick={() => setActivePane("html")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activePane === "html" ? "bg-white text-[#0984E3] shadow-xs" : "text-slate-600"
                }`}
              >
                HTML Code
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Clear entire document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: WYSIWYG Rich Text Formatting Bar */}
        <div className="flex flex-wrap items-center gap-1 text-slate-700 text-xs">
          {/* History */}
          <button
            onClick={() => executeCommand("undo")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("redo")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Heading Style dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                executeCommand("formatBlock", `<${e.target.value}>`);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="" disabled>
              Heading Style
            </option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1 (H1)</option>
            <option value="h2">Heading 2 (H2)</option>
            <option value="h3">Heading 3 (H3)</option>
            <option value="h4">Heading 4 (H4)</option>
            <option value="blockquote">Blockquote</option>
            <option value="pre">Code Block</option>
          </select>

          {/* Font Family */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                executeCommand("fontName", e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="" disabled>
              Font Family
            </option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Basic Text Formatting */}
          <button
            onClick={() => executeCommand("bold")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("italic")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 italic cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("underline")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 underline cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("strikeThrough")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 line-through cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          {/* Text Color Picker */}
          <label
            className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1 text-slate-700"
            title="Text Color"
          >
            <span className="font-bold text-xs border-b-2 border-red-500">A</span>
            <input
              type="color"
              onChange={(e) => executeCommand("foreColor", e.target.value)}
              className="w-0 h-0 opacity-0 absolute"
            />
          </label>

          {/* Background Highlight Picker */}
          <label
            className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1 text-slate-700"
            title="Highlight Color"
          >
            <span className="bg-yellow-200 px-1 font-bold text-xs rounded">H</span>
            <input
              type="color"
              onChange={(e) => executeCommand("hiliteColor", e.target.value)}
              className="w-0 h-0 opacity-0 absolute"
            />
          </label>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => executeCommand("justifyLeft")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("justifyCenter")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("justifyRight")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("justifyFull")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Lists */}
          <button
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Inserts */}
          <button
            onClick={() => {
              const sel = window.getSelection()?.toString();
              setLinkText(sel || "");
              setShowLinkModal(true);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Insert Hyperlink"
          >
            <LinkIcon className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() => setShowImageModal(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => setShowTableModal(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4 text-purple-600" />
          </button>

          <button
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
            title="Clear Selection Formatting"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dual Pane Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Pane: Visual Word Document Editor */}
        {(activePane === "split" || activePane === "visual") && (
          <div
            className={`bg-white border border-[#E9ECEF] rounded-2xl flex flex-col shadow-xs overflow-hidden ${
              activePane === "visual" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header bar */}
            <div className="px-5 py-3 bg-slate-50/70 border-b border-[#E9ECEF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0984E3]" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Visual Word Editor (WYSIWYG)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Paste Word text here
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyVisual}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? "Copied!" : "Copy Rich Text"}</span>
                </button>
              </div>
            </div>

            {/* Visual Editor Canvas */}
            <div className="p-6 flex-1 min-h-[500px] max-h-[700px] overflow-y-auto bg-slate-50/30">
              <div
                ref={visualEditorRef}
                contentEditable
                onInput={handleVisualInput}
                onPaste={handleVisualPaste}
                className="w-full min-h-[460px] bg-white p-8 sm:p-10 rounded-xl border border-slate-200/80 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#0984E3] prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed"
                style={{ minHeight: "460px" }}
              />
            </div>
          </div>
        )}

        {/* Right Pane: Clean HTML Code Editor */}
        {(activePane === "split" || activePane === "html") && (
          <div
            className={`bg-white border border-[#E9ECEF] rounded-2xl flex flex-col shadow-xs overflow-hidden ${
              activePane === "html" ? "lg:col-span-2" : ""
            }`}
          >
            {/* Header bar */}
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">
                  Clean HTML Source Code
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {htmlSizeKb} KB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy HTML"}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea Canvas */}
            <div className="p-4 flex-1 min-h-[500px] max-h-[700px] bg-slate-950 flex flex-col">
              <textarea
                value={htmlCode}
                onChange={handleCodeChange}
                placeholder="<!-- Paste or type raw HTML here -->"
                spellCheck={false}
                className="w-full flex-1 min-h-[470px] bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-600/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metrics Bar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div>
            <span className="font-semibold text-slate-400 mr-1">Words:</span>
            <span className="font-bold text-[#0F172A]">{wordCount.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Characters:</span>
            <span className="font-bold text-[#0F172A]">{charCount.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">HTML Size:</span>
            <span className="font-bold text-[#0984E3]">{htmlSizeKb} KB</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setContentHtml(SAMPLE_WORD_CONTENT);
              setHtmlCode(beautifyHtml(SAMPLE_WORD_CONTENT));
              if (visualEditorRef.current) visualEditorRef.current.innerHTML = SAMPLE_WORD_CONTENT;
              setStatusMsg("Loaded sample document template.");
              setTimeout(() => setStatusMsg(null), 2500);
            }}
            className="text-xs font-semibold text-[#0984E3] hover:underline cursor-pointer"
          >
            Reset to Sample Document
          </button>
        </div>
      </div>

      {/* Modal: Insert Link */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#0984E3]" />
              <span>Insert Web Hyperlink</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Anchor Text</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Text to display"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="targetBlank"
                checked={linkTargetBlank}
                onChange={(e) => setLinkTargetBlank(e.target.checked)}
                className="rounded border-slate-300 text-[#0984E3]"
              />
              <label htmlFor="targetBlank" className="text-xs text-slate-600">
                Open in new browser tab (`target="_blank"`)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                className="px-4 py-1.5 bg-[#0984E3] text-white rounded-xl text-xs font-bold hover:bg-[#0873C4]"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Insert Table */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-purple-600" />
              <span>Insert HTML Table</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Columns</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertTable}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Insert Image */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Insert Image</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Image Web URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or https://domain.com/photo.png"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alt Text (SEO)</label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descriptive image text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0984E3]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertImage}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
