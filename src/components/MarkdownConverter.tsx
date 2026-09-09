import React, { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import TurndownService from "turndown";
import {
  FileText,
  Code,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Sparkles,
  Trash2,
  BookOpen,
  Sliders,
  Eye,
  CheckCircle2,
  Hash,
} from "lucide-react";

// Initialize Turndown service with clean GitHub-flavored Markdown settings
const turndownService = new TurndownService({
  headingStyle: "atx", // # H1, ## H2
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// Configure marked with GFM
marked.setOptions({
  gfm: true,
  breaks: true,
});

const SAMPLE_MARKDOWN_CONTENT = `# Complete Markdown & Rich Text Guide

Welcome to the **Rich Text to Markdown & Markdown to Rich Text** bi-directional suite.

## 🚀 Key Capabilities
- **Real-Time Bi-Directional Conversion**: Type in rich visual text or raw Markdown, and both sides synchronize instantly.
- **GitHub-Flavored Markdown (GFM)**: Full support for task lists, tables, syntax highlighting blocks, and strikethrough.
- **Zero Data Loss**: Converts clean semantic HTML into elegant, readable Markdown without messy tags.

### 📝 Task List Example
- [x] Complete on-page keyword research
- [x] Audit technical Core Web Vitals
- [ ] Implement bi-directional markdown sync

### 📊 Performance Comparison Table
| Metric | Markdown Format | Rich HTML Format |
|---|---|---|
| Readability | Extremely High | Visual Rendered |
| Portability | Standard text (.md) | Web pages & CMS |
| Search Optimization | Lightweight | Semantic Structure |

> "Simplicity is the soul of efficiency. Clean Markdown enables distraction-free writing for technical authors and marketers."

\`\`\`typescript
// Quick snippet example
function calculateReadingTime(words: number): string {
  const wpm = 200;
  return \`\${Math.ceil(words / wpm)} min read\`;
}
\`\`\`

---
*Feel free to edit either side or paste your own document!*`;

export const MarkdownConverter: React.FC = () => {
  const [markdownText, setMarkdownText] = useState<string>(SAMPLE_MARKDOWN_CONTENT);
  const [richHtml, setRichHtml] = useState<string>(() => {
    return marked.parse(SAMPLE_MARKDOWN_CONTENT) as string;
  });
  const [activeView, setActiveView] = useState<"split" | "rich" | "markdown" | "preview">("split");
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedRich, setCopiedRich] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const richEditorRef = useRef<HTMLDivElement>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingFromRich = useRef<boolean>(false);
  const isUpdatingFromMd = useRef<boolean>(false);

  // Sync initial content to rich editor
  useEffect(() => {
    if (richEditorRef.current && !isUpdatingFromRich.current) {
      richEditorRef.current.innerHTML = richHtml;
    }
  }, [richHtml]);

  // When Markdown changes -> update Rich Text HTML
  const handleMarkdownChange = (newMd: string) => {
    setMarkdownText(newMd);
    if (!isUpdatingFromRich.current) {
      isUpdatingFromMd.current = true;
      try {
        const parsedHtml = marked.parse(newMd) as string;
        setRichHtml(parsedHtml);
        if (richEditorRef.current) {
          richEditorRef.current.innerHTML = parsedHtml;
        }
      } catch (err) {
        console.error("Markdown parse error:", err);
      }
      setTimeout(() => {
        isUpdatingFromMd.current = false;
      }, 50);
    }
  };

  // When Rich Text editor input changes -> update Markdown
  const handleRichInput = () => {
    if (richEditorRef.current && !isUpdatingFromMd.current) {
      isUpdatingFromRich.current = true;
      const html = richEditorRef.current.innerHTML;
      setRichHtml(html);
      try {
        const convertedMd = turndownService.turndown(html);
        setMarkdownText(convertedMd);
      } catch (err) {
        console.error("Turndown conversion error:", err);
      }
      setTimeout(() => {
        isUpdatingFromRich.current = false;
      }, 50);
    }
  };

  // Insert markdown syntax helper at current cursor in textarea
  const insertMarkdownSyntax = (before: string, after: string = "", defaultText: string = "") => {
    if (activeView === "rich") {
      // If user is in Rich mode, execute rich text command
      if (before === "**") document.execCommand("bold");
      else if (before === "*") document.execCommand("italic");
      else if (before === "~~") document.execCommand("strikeThrough");
      else if (before.startsWith("#")) {
        const hLevel = before.trim().length;
        document.execCommand("formatBlock", false, `<h${hLevel}>`);
      } else if (before === "> ") document.execCommand("formatBlock", false, "<blockquote>");
      else if (before === "- ") document.execCommand("insertUnorderedList");
      else if (before === "1. ") document.execCommand("insertOrderedList");
      else if (before === "---") document.execCommand("insertHorizontalRule");
      handleRichInput();
      return;
    }

    const textarea = markdownTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdownText.substring(start, end) || defaultText;

    const newText =
      markdownText.substring(0, start) +
      before +
      selected +
      after +
      markdownText.substring(end);

    handleMarkdownChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  // Insert Markdown Table
  const handleInsertTable = () => {
    const tableTemplate = `\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Item A1 | Item B1 | Item C1 |\n| Item A2 | Item B2 | Item C2 |\n\n`;
    insertMarkdownSyntax(tableTemplate, "");
  };

  // File Upload (.md, .txt, .html)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
          // Convert uploaded HTML to Markdown
          const md = turndownService.turndown(content);
          handleMarkdownChange(md);
          setToastMsg(`Converted "${file.name}" from HTML to Markdown!`);
        } else {
          // Standard Markdown or text file
          handleMarkdownChange(content);
          setToastMsg(`Imported "${file.name}"!`);
        }
        setTimeout(() => setToastMsg(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  // Download .md file
  const handleDownloadMd = () => {
    const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download standalone .html file
  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background-color: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background-color: #f8fafc; }
    blockquote { border-left: 4px solid #0984E3; margin: 16px 0; padding-left: 16px; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  ${richHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown-preview.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Markdown
  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  // Copy Rich Text
  const handleCopyRich = () => {
    if (richEditorRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(richEditorRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges();
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2000);
    }
  };

  // Copy HTML
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(richHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  // Metrics
  const words = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
  const chars = markdownText.length;
  const lines = markdownText.split("\n").length;
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Rich Text to Markdown & Markdown to Rich Text
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Bi-Directional Converter
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Convert visual rich formatted text to clean GitHub Markdown, or paste Markdown code to render instant visual rich text.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.html"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Import Markdown, text, or HTML file"
          >
            <Upload className="w-3.5 h-3.5 text-[#0984E3]" />
            <span>Upload File</span>
          </button>

          <button
            onClick={handleDownloadMd}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download document as .md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download formatted HTML document"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download .HTML</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-xs font-medium text-indigo-800 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Markdown Toolbar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Markdown Syntax Formatters */}
          <div className="flex flex-wrap items-center gap-1 text-slate-700 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
              Insert:
            </span>

            {/* Headings */}
            <button
              onClick={() => insertMarkdownSyntax("# ", "", "Heading 1")}
              className="px-2 py-1 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => insertMarkdownSyntax("## ", "", "Heading 2")}
              className="px-2 py-1 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => insertMarkdownSyntax("### ", "", "Heading 3")}
              className="px-2 py-1 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer"
              title="Heading 3"
            >
              H3
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            {/* Inline Formatting */}
            <button
              onClick={() => insertMarkdownSyntax("**", "**", "bold text")}
              className="p-1.5 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("*", "*", "italic text")}
              className="p-1.5 hover:bg-slate-100 rounded-lg italic cursor-pointer"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("~~", "~~", "strikethrough")}
              className="p-1.5 hover:bg-slate-100 rounded-lg line-through cursor-pointer"
              title="Strikethrough (~~text~~)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            {/* Code */}
            <button
              onClick={() => insertMarkdownSyntax("`", "`", "code")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Inline Code (`code`)"
            >
              <Code className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("```typescript\n", "\n```", "// your code here")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Fenced Code Block"
            >
              <Code2 className="w-4 h-4 text-emerald-700" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            {/* Lists & Quotes */}
            <button
              onClick={() => insertMarkdownSyntax("- ", "", "List item")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Bulleted List (- )"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("1. ", "", "Ordered item")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Numbered List (1. )"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("- [ ] ", "", "Task todo")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Task List Checklist (- [ ])"
            >
              <ListChecks className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("> ", "", "Quote text")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Blockquote (> )"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            {/* Link & Image & Table */}
            <button
              onClick={() => insertMarkdownSyntax("[", "](https://example.com)", "anchor text")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Link [text](url)"
            >
              <LinkIcon className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("![", "](https://images.unsplash.com/...)", "alt text")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Image ![alt](url)"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={handleInsertTable}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Markdown Table"
            >
              <TableIcon className="w-4 h-4 text-purple-600" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("\n---\n")}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Divider (---)"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveView("split")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === "split" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveView("rich")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === "rich" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Rich Text
            </button>
            <button
              onClick={() => setActiveView("markdown")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === "markdown" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Markdown Code
            </button>
            <button
              onClick={() => setActiveView("preview")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === "preview" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Live Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Pane: Rich Text WYSIWYG Editor */}
        {(activeView === "split" || activeView === "rich") && (
          <div
            className={`bg-white border border-[#E9ECEF] rounded-2xl flex flex-col shadow-xs overflow-hidden ${
              activeView === "rich" ? "lg:col-span-2" : ""
            }`}
          >
            <div className="px-5 py-3 bg-slate-50/70 border-b border-[#E9ECEF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Rich Formatted Text (Visual Editor)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRich}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedRich ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRich ? "Copied!" : "Copy Rich Text"}</span>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 min-h-[500px] max-h-[720px] overflow-y-auto bg-slate-50/20">
              <div
                ref={richEditorRef}
                contentEditable
                onInput={handleRichInput}
                className="w-full min-h-[460px] bg-white p-8 rounded-xl border border-slate-200/80 shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 prose prose-indigo max-w-none text-slate-800 text-sm leading-relaxed"
                style={{ minHeight: "460px" }}
              />
            </div>
          </div>
        )}

        {/* Right Pane: Raw Markdown Source Editor */}
        {(activeView === "split" || activeView === "markdown") && (
          <div
            className={`bg-white border border-[#E9ECEF] rounded-2xl flex flex-col shadow-xs overflow-hidden ${
              activeView === "markdown" ? "lg:col-span-2" : ""
            }`}
          >
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-100">
                  Markdown Source (`.md`)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {lines} lines
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMd}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMd ? "Copied!" : "Copy Markdown"}</span>
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 min-h-[500px] max-h-[720px] bg-slate-950 flex flex-col">
              <textarea
                ref={markdownTextareaRef}
                value={markdownText}
                onChange={(e) => handleMarkdownChange(e.target.value)}
                placeholder="# Start typing your Markdown here..."
                spellCheck={false}
                className="w-full flex-1 min-h-[470px] bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-indigo-600/40"
              />
            </div>
          </div>
        )}

        {/* Full Screen Live HTML Rendered Preview */}
        {activeView === "preview" && (
          <div className="lg:col-span-2 bg-white border border-[#E9ECEF] rounded-2xl flex flex-col shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50/70 border-b border-[#E9ECEF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Rendered Article Preview (HTML Output)
                </span>
              </div>

              <button
                onClick={handleCopyHtml}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? "Copied HTML!" : "Copy Clean HTML"}</span>
              </button>
            </div>

            <div className="p-8 max-w-4xl mx-auto w-full min-h-[500px] prose prose-indigo text-slate-800 text-sm leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: richHtml }} />
            </div>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="bg-white border border-[#E9ECEF] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div>
            <span className="font-semibold text-slate-400 mr-1">Words:</span>
            <span className="font-bold text-[#0F172A]">{words.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Characters:</span>
            <span className="font-bold text-[#0F172A]">{chars.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Lines:</span>
            <span className="font-bold text-[#0F172A]">{lines}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <div>
            <span className="font-semibold text-slate-400 mr-1">Estimated Reading Time:</span>
            <span className="font-bold text-indigo-600">{readingTimeMin} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleMarkdownChange(SAMPLE_MARKDOWN_CONTENT);
              setToastMsg("Reset to default documentation guide.");
              setTimeout(() => setToastMsg(null), 2500);
            }}
            className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Load Sample Guide
          </button>
        </div>
      </div>
    </div>
  );
};
