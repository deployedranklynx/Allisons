import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  RemoveFormatting,
  Eye,
  CodeXml,
  Check,
  X,
  ClipboardPaste,
  Sparkles,
  Trash2,
  FileText,
} from "lucide-react";
import {
  cleanAndFormatArticleContent,
  isMarkdownString,
  isHtmlString,
} from "../lib/articleFormatter";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write or paste your article content here...",
  minHeight = "400px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef<boolean>(false);
  const lastHtmlRef = useRef<string>(value || "");

  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);
  const [htmlDraft, setHtmlDraft] = useState<string>(value || "");

  // Smart Paste Modal state
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [pasteInputText, setPasteInputText] = useState<string>("");

  // Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkText, setLinkText] = useState<string>("");

  // Image Modal state
  const [isImgModalOpen, setIsImgModalOpen] = useState<boolean>(false);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [imgAlt, setImgAlt] = useState<string>("");

  // Safe synchronization: Only sync if editor is NOT focused, or if value differs from last known HTML
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (!isFocusedRef.current && editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
        lastHtmlRef.current = value || "";
      }
    }
    if (isHtmlMode) {
      setHtmlDraft(value || "");
    }
  }, [value, isHtmlMode]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
      setHtmlDraft(html);
    }
  }, [onChange]);

  // Command executor for visual editor
  const executeCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  // NATIVE CLIPBOARD PASTE HANDLER
  // Intercepts paste events (Ctrl+V / Right-Click Paste) and cleans/formats automatically
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const pastedHtml = clipboardData.getData("text/html");
    const pastedText = clipboardData.getData("text/plain");

    let cleanResult = "";
    if (pastedHtml && pastedHtml.trim()) {
      cleanResult = cleanAndFormatArticleContent(pastedHtml);
    } else if (pastedText && pastedText.trim()) {
      cleanResult = cleanAndFormatArticleContent(pastedText);
    }

    if (cleanResult) {
      // Try inserting formatted HTML at cursor
      const success = document.execCommand("insertHTML", false, cleanResult);
      if (!success && editorRef.current) {
        // Fallback for browsers that restrict insertHTML
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = cleanResult;
          const frag = document.createDocumentFragment();
          let node;
          while ((node = tempDiv.firstChild)) {
            frag.appendChild(node);
          }
          range.insertNode(frag);
        } else {
          editorRef.current.innerHTML += cleanResult;
        }
      }
      handleInput();
    }
  };

  // SMART PASTE MODAL: Submits pasted text and auto-formats
  const handleApplySmartPaste = (replaceEntire: boolean = false) => {
    if (!pasteInputText.trim()) return;

    const formatted = cleanAndFormatArticleContent(pasteInputText);

    if (replaceEntire) {
      if (editorRef.current) {
        editorRef.current.innerHTML = formatted;
      }
      onChange(formatted);
      setHtmlDraft(formatted);
      lastHtmlRef.current = formatted;
    } else {
      if (editorRef.current) {
        editorRef.current.focus();
        const success = document.execCommand("insertHTML", false, formatted);
        if (!success) {
          editorRef.current.innerHTML = (editorRef.current.innerHTML || "") + "\n" + formatted;
        }
        handleInput();
      } else {
        const next = (value || "") + "\n" + formatted;
        onChange(next);
        setHtmlDraft(next);
        lastHtmlRef.current = next;
      }
    }

    setPasteInputText("");
    setIsPasteModalOpen(false);
  };

  // CLEAR ALL HANDLER
  const handleClearAll = () => {
    if (window.confirm("Clear all text from the editor?")) {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      onChange("");
      setHtmlDraft("");
      lastHtmlRef.current = "";
    }
  };

  // LINK MODAL SUBMIT
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
      const cleanUrl = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      if (linkText) {
        const linkHtml = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800">${linkText}</a>`;
        document.execCommand("insertHTML", false, linkHtml);
      } else {
        document.execCommand("createLink", false, cleanUrl);
      }
      handleInput();
    }
    setLinkUrl("");
    setLinkText("");
    setIsLinkModalOpen(false);
  };

  // IMAGE MODAL SUBMIT
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
      const imgHtml = `<figure class="my-6"><img src="${imgUrl}" alt="${imgAlt || 'Article illustration'}" class="w-full rounded-xl object-cover shadow-sm border border-gray-200" /><figcaption class="text-center text-xs text-gray-500 mt-2 italic">${imgAlt || ''}</figcaption></figure><p><br></p>`;
      document.execCommand("insertHTML", false, imgHtml);
      handleInput();
    }
    setImgUrl("");
    setImgAlt("");
    setIsImgModalOpen(false);
  };

  // Switch between WYSIWYG and HTML
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML source to visual
      onChange(htmlDraft);
      lastHtmlRef.current = htmlDraft;
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlDraft;
      }
      setIsHtmlMode(false);
    } else {
      // Switching from visual to HTML source
      const current = editorRef.current ? editorRef.current.innerHTML : value;
      setHtmlDraft(current);
      lastHtmlRef.current = current;
      setIsHtmlMode(true);
    }
  };

  // Word & Reading statistics
  const plainText = (value || "").replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  // Detected format for Smart Paste Modal
  const detectedFormat = isMarkdownString(pasteInputText)
    ? "ChatGPT Markdown (#, **, - lists)"
    : isHtmlString(pasteInputText)
    ? "Rich Text / Word HTML"
    : "Plain Text Paragraphs";

  return (
    <div className="border border-[#CBD5E1] rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col focus-within:border-[#0984E3] focus-within:ring-2 focus-within:ring-[#0984E3]/15 transition-all">
      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] select-none text-gray-700">
        <div className="flex flex-wrap items-center gap-1">
          {/* Smart Paste Button (Hero feature for user) */}
          <button
            type="button"
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0984E3] text-white hover:bg-[#0770C2] rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer mr-1"
            title="Paste entire article from Word, Google Docs, ChatGPT or Web"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste & Auto-Format</span>
          </button>

          {/* Headings */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => handleFormatBlock("p")}
              className="px-2 py-1 text-xs font-semibold rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Normal Paragraph"
            >
              P
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("h2")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Main Heading (H2)"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("h3")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Subheading (H3)"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Text styling */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors font-bold cursor-pointer"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Structural lists & quotes */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => executeCommand("insertUnorderedList")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("insertOrderedList")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("blockquote")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Blockquote (Quote Callout)"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock("pre")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("insertHorizontalRule")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Media & Links */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsImgModalOpen(true)}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors cursor-pointer"
              title="Insert In-article Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("removeFormat")}
              className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>

          {/* Clear All */}
          <button
            type="button"
            onClick={handleClearAll}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Clear All Content"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switcher (Visual / HTML) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHtmlMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isHtmlMode
                ? "bg-[#0984E3] text-white shadow-2xs"
                : "bg-white border border-[#CBD5E1] text-gray-700 hover:bg-gray-100"
            }`}
            title={isHtmlMode ? "Switch to Visual WYSIWYG Editor" : "Switch to Raw HTML Code"}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual WYSIWYG</span>
              </>
            ) : (
              <>
                <CodeXml className="w-3.5 h-3.5" />
                <span>Raw HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1 bg-white">
        {isHtmlMode ? (
          <textarea
            value={htmlDraft}
            onChange={(e) => {
              setHtmlDraft(e.target.value);
              onChange(e.target.value);
              lastHtmlRef.current = e.target.value;
            }}
            className="w-full p-5 font-mono text-xs leading-relaxed text-gray-800 bg-gray-50/60 focus:outline-none resize-y border-none"
            style={{ minHeight }}
            placeholder="Write or paste HTML code directly..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              handleInput();
            }}
            onInput={handleInput}
            onPaste={handlePaste}
            style={{ minHeight }}
            className="p-6 font-serif text-[17px] leading-[1.8] text-[#1E293B] focus:outline-none overflow-y-auto max-w-none
              prose prose-slate
              [&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0F172A] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:tracking-tight
              [&_h3]:font-sans [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#1E293B] [&_h3]:mt-6 [&_h3]:mb-2
              [&_h4]:font-sans [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-[#334155] [&_h4]:mt-4 [&_h4]:mb-2
              [&_p]:mb-5
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul>li]:mb-1.5 [&_ul>li]:font-sans
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol>li]:mb-1.5 [&_ol>li]:font-sans
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#0984E3] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:my-6 [&_blockquote]:bg-blue-50/40 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg
              [&_pre]:bg-[#0F172A] [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre]:font-mono [&_pre]:text-xs
              [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#0984E3]
              [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-4 [&_img]:border [&_img]:border-gray-200
              empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Editor Footer Stats */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
        <div className="flex items-center gap-4">
          <span>
            Words: <strong className="text-gray-900 font-semibold">{wordCount}</strong>
          </span>
          <span>
            Estimated Read: <strong className="text-gray-900 font-semibold">~{readTimeEst} min</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-700 font-medium">Smart Paste & Auto-Sanitization Active</span>
        </div>
      </div>

      {/* MODAL: SMART PASTE ARTICLE DIALOG */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0984E3] flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Smart Article Paste & Auto-Format
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Paste from Word, Google Docs, ChatGPT, Webpage, or Markdown with automatic cleanup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-gray-700">Paste your content here:</span>
                {pasteInputText && (
                  <span className="text-[11px] font-mono text-[#0984E3] bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                    {detectedFormat}
                  </span>
                )}
              </div>
              <textarea
                rows={10}
                value={pasteInputText}
                onChange={(e) => setPasteInputText(e.target.value)}
                placeholder="Paste your full article text or HTML here (from ChatGPT, Google Docs, Word, or any website)..."
                autoFocus
                className="w-full p-3.5 text-xs font-mono border border-gray-300 rounded-xl focus:outline-none focus:border-[#0984E3] focus:ring-1 focus:ring-[#0984E3] bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="text-[11px] text-gray-500">
                {pasteInputText.trim()
                  ? `${pasteInputText.trim().split(/\s+/).length} words detected`
                  : "Strips bloat, keeps headings, bullet points, and quotes."}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!pasteInputText.trim()}
                  onClick={() => handleApplySmartPaste(true)}
                  className="px-4 py-2 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                  title="Replace all existing content with this pasted article"
                >
                  Replace All
                </button>
                <button
                  type="button"
                  disabled={!pasteInputText.trim()}
                  onClick={() => handleApplySmartPaste(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0770C2] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Insert Clean Formatted</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSERT LINK */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#0984E3]" />
                Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInsertLink} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/guide"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Link Anchor Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. read our case study"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0984E3] hover:bg-[#0873c4] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSERT IMAGE */}
      {isImgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0984E3]" />
                Insert Article Image
              </h3>
              <button
                type="button"
                onClick={() => setIsImgModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInsertImage} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Image Web URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Caption / Alt Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backlink distribution chart"
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImgModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0984E3] hover:bg-[#0873c4] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
