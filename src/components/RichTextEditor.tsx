import React, { useRef, useState, useEffect } from "react";
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
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your classical article content here...",
  minHeight = "360px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(false);
  const [htmlDraft, setHtmlDraft] = useState<string>(value);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkText, setLinkText] = useState<string>("");
  const [isImgModalOpen, setIsImgModalOpen] = useState<boolean>(false);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [imgAlt, setImgAlt] = useState<string>("");

  // Sync editor content with incoming value when mounted or switched
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isHtmlMode]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setHtmlDraft(html);
    }
  };

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

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgUrl) return;
    if (editorRef.current) {
      editorRef.current.focus();
      const imgHtml = `<figure class="my-6"><img src="${imgUrl}" alt="${imgAlt || 'Editorial figure'}" class="w-full rounded-xl object-cover shadow-sm border border-gray-200" /><figcaption class="text-center text-xs text-gray-500 mt-2 italic">${imgAlt || ''}</figcaption></figure><p><br></p>`;
      document.execCommand("insertHTML", false, imgHtml);
      handleInput();
    }
    setImgUrl("");
    setImgAlt("");
    setIsImgModalOpen(false);
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML source to visual
      onChange(htmlDraft);
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlDraft;
      }
      setIsHtmlMode(false);
    } else {
      // Switching from visual to HTML source
      const current = editorRef.current ? editorRef.current.innerHTML : value;
      setHtmlDraft(current);
      setIsHtmlMode(true);
    }
  };

  // Word & Reading statistics
  const plainText = (value || "").replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="border border-[#CBD5E1] rounded-xl overflow-hidden bg-white shadow-xs flex flex-col focus-within:border-[#0984E3] focus-within:ring-2 focus-within:ring-[#0984E3]/15 transition-all">
      {/* Editor Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F8FAFC] border-b border-[#E2E8F0] select-none text-gray-700">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => handleFormatBlock("p")}
            className="px-2 py-1 text-xs font-semibold rounded hover:bg-[#E2E8F0] text-gray-600 transition-colors"
            title="Normal Paragraph"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("h2")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Heading 2 (Major section)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("h3")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Heading 3 (Subsection)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text styling */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors font-bold"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Structural lists & quotes */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("blockquote")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Blockquote (Quote Callout)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("pre")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Horizontal Divider"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsImgModalOpen(true)}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-700 transition-colors"
            title="Insert In-article Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 rounded hover:bg-[#E2E8F0] text-gray-500 hover:text-red-600 transition-colors"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switcher (Visual / HTML) */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHtmlMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              isHtmlMode
                ? "bg-[#0984E3] text-white"
                : "bg-white border border-[#CBD5E1] text-gray-700 hover:bg-gray-50"
            }`}
            title={isHtmlMode ? "Switch to Visual WYSIWYG" : "Switch to Raw HTML Code"}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Editor</span>
              </>
            ) : (
              <>
                <CodeXml className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1">
        {isHtmlMode ? (
          <textarea
            value={htmlDraft}
            onChange={(e) => {
              setHtmlDraft(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full p-4 font-mono text-xs leading-relaxed text-gray-800 bg-gray-50 focus:outline-none resize-y border-none"
            style={{ minHeight }}
            placeholder="Write HTML directly..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            style={{ minHeight }}
            className="p-5 font-serif text-[16px] leading-[1.75] text-[#1E293B] focus:outline-none overflow-y-auto prose prose-slate max-w-none empty:before:content-[attr(placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Editor Footer Stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
        <div className="flex items-center gap-4">
          <span>
            Words: <strong className="text-gray-900 font-semibold">{wordCount}</strong>
          </span>
          <span>
            Reading Time: <strong className="text-gray-900 font-semibold">~{readTimeEst} min</strong>
          </span>
        </div>
        <div>
          <span className="text-emerald-700 font-medium">Auto-syncs live</span>
        </div>
      </div>

      {/* Modal: Insert Link */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#0984E3]" />
                Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0984E3] hover:bg-[#0873c4] rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Insert Image */}
      {isImgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0984E3]" />
                Insert Article Image
              </h3>
              <button
                type="button"
                onClick={() => setIsImgModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0984E3] hover:bg-[#0873c4] rounded-lg shadow-xs flex items-center gap-1.5"
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
