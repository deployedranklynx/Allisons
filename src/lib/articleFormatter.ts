// Universal Article Formatter & Cleaner
// Handles pastes from MS Word, Google Docs, ChatGPT (Markdown), Webpages, and Plain Text

/**
 * Converts Markdown text (like ChatGPT output) into clean semantic HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Trim trailing whitespace
    line = line.replace(/\s+$/, "");

    // Empty line resets list/blockquote
    if (!line.trim()) {
      if (inList) {
        htmlParts.push(inList === "ul" ? "</ul>" : "</ol>");
        inList = null;
      }
      if (inBlockquote) {
        htmlParts.push("</blockquote>");
        inBlockquote = false;
      }
      continue;
    }

    // Headings
    if (/^######\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h6>${formatInlineMarkdown(line.replace(/^######\s+/, ""))}</h6>`);
      continue;
    }
    if (/^#####\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h5>${formatInlineMarkdown(line.replace(/^#####\s+/, ""))}</h5>`);
      continue;
    }
    if (/^####\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h4>${formatInlineMarkdown(line.replace(/^####\s+/, ""))}</h4>`);
      continue;
    }
    if (/^###\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h3>${formatInlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h2>${formatInlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^#\s+(.+)/.test(line)) {
      if (inList) { htmlParts.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      htmlParts.push(`<h2>${formatInlineMarkdown(line.replace(/^#\s+/, ""))}</h2>`);
      continue;
    }

    // Blockquote
    if (/^>\s*(.*)/.test(line)) {
      const quoteText = line.replace(/^>\s*/, "");
      if (!inBlockquote) {
        htmlParts.push("<blockquote>");
        inBlockquote = true;
      }
      htmlParts.push(`<p>${formatInlineMarkdown(quoteText)}</p>`);
      continue;
    } else if (inBlockquote) {
      htmlParts.push("</blockquote>");
      inBlockquote = false;
    }

    // Unordered list (* or -)
    if (/^[\*\-]\s+(.+)/.test(line)) {
      const itemText = line.replace(/^[\*\-]\s+/, "");
      if (inList !== "ul") {
        if (inList) htmlParts.push("</ol>");
        htmlParts.push("<ul>");
        inList = "ul";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
      continue;
    }

    // Ordered list (1. 2. etc.)
    if (/^\d+\.\s+(.+)/.test(line)) {
      const itemText = line.replace(/^\d+\.\s+/, "");
      if (inList !== "ol") {
        if (inList) htmlParts.push("</ul>");
        htmlParts.push("<ol>");
        inList = "ol";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
      continue;
    }

    // If list was open but line is not list item
    if (inList) {
      htmlParts.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      htmlParts.push("<hr />");
      continue;
    }

    // Normal paragraph
    htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  if (inList) {
    htmlParts.push(inList === "ul" ? "</ul>" : "</ol>");
  }
  if (inBlockquote) {
    htmlParts.push("</blockquote>");
  }

  return htmlParts.join("\n");
}

/**
 * Replaces inline markdown (**bold**, *italic*, `code`, [link](url)) with HTML
 */
function formatInlineMarkdown(text: string): string {
  let res = text;
  // Bold & Italic
  res = res.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  res = res.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  res = res.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  res = res.replace(/\*([^\*]+?)\*/g, "<em>$1</em>");
  res = res.replace(/_([^_]+?)_/g, "<em>$1</em>");
  // Inline Code
  res = res.replace(/`([^`]+?)`/g, "<code>$1</code>");
  // Links [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return res;
}

/**
 * Determines whether text is raw HTML
 */
export function isHtmlString(str: string): boolean {
  if (!str) return false;
  return /<(p|h[1-6]|ul|ol|li|blockquote|div|article|section|strong|b|em|i|a|img|pre|code|table|br)\b[^>]*>/i.test(
    str
  );
}

/**
 * Determines whether text looks like Markdown
 */
export function isMarkdownString(str: string): boolean {
  if (!str) return false;
  return (
    /(^#{1,6}\s+)|(\*\*[^*]+\*\*)|(^\s*[\*\-]\s+)|(^\s*\d+\.\s+)|(^>\s+)/m.test(str)
  );
}

/**
 * Universal Cleaner for any article input (Word, Google Docs, Webpage HTML, Markdown, or Plain Text)
 */
export function cleanAndFormatArticleContent(rawInput: string): string {
  if (!rawInput || !rawInput.trim()) return "";

  let cleaned = rawInput.trim();

  // CASE 1: If it's Markdown without HTML tags, convert Markdown directly to semantic HTML
  if (!isHtmlString(cleaned) && isMarkdownString(cleaned)) {
    return markdownToHtml(cleaned);
  }

  // CASE 2: If it's plain text (no HTML tags, no markdown), convert double newlines to paragraphs
  if (!isHtmlString(cleaned)) {
    const paragraphs = cleaned
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    return paragraphs
      .map((para) => {
        // Check if single line looks like a title / heading (under 80 chars, no terminal punctuation)
        if (
          para.length < 80 &&
          !para.includes("\n") &&
          !/[.?!]$/.test(para) &&
          !para.toLowerCase().startsWith("http")
        ) {
          return `<h2>${para}</h2>`;
        }
        // Convert single line breaks into <br>
        const formatted = para.replace(/\n/g, "<br />");
        return `<p>${formatted}</p>`;
      })
      .join("\n\n");
  }

  // CASE 3: It contains HTML (e.g. from Google Docs, MS Word, Web Browser, or HTML source)
  // 1. Strip Office / XML comments <!--[if ...]>...<![endif]-->
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, "");
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, "");
  cleaned = cleaned.replace(/<o:p[\s\S]*?>[\s\S]*?<\/o:p>/gi, "");
  cleaned = cleaned.replace(/<\/?(o|v|w|x|p):[^>]*>/gi, "");

  // 2. Strip Google Docs internal wrapper tags and comment tags
  cleaned = cleaned.replace(/<b\s+id="docs-internal-guid-[^"]*">([\s\S]*?)<\/b>/gi, "$1");

  // 3. Strip MS Word classes (class="MsoNormal", class="MsoListParagraph", etc.)
  cleaned = cleaned.replace(/\s*class=["']?[^"']*\bMso[a-zA-Z0-9_-]*[^"']*["']?/gi, "");

  // 4. Clean invasive inline styles:
  // Strip font-family, fixed font-size, background-color, line-height, text-indent, mso-* rules
  cleaned = cleaned.replace(/\s*style=["']([^"']*)["']/gi, (match, styleBody: string) => {
    // Preserve only safe image widths/alignments or text-align if needed
    const safeProps = styleBody
      .split(";")
      .map((rule) => rule.trim())
      .filter((rule) => {
        const lower = rule.toLowerCase();
        if (!lower) return false;
        if (lower.startsWith("mso-")) return false;
        if (lower.startsWith("font-family")) return false;
        if (lower.startsWith("font-size")) return false;
        if (lower.startsWith("background")) return false;
        if (lower.startsWith("color")) return false; // let theme handle text color
        if (lower.startsWith("line-height")) return false;
        if (lower.startsWith("margin")) return false;
        return true;
      })
      .join("; ");

    return safeProps ? ` style="${safeProps}"` : "";
  });

  // 5. Clean unnecessary spans (spans without attributes or with empty style)
  cleaned = cleaned.replace(/<span(?:\s+style=["']\s*["'])?>([\s\S]*?)<\/span>/gi, "$1");
  cleaned = cleaned.replace(/<span>([\s\S]*?)<\/span>/gi, "$1");

  // 6. Convert smart quotes and typography
  cleaned = cleaned
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");

  // 7. Unwrap pointless root wrappers like <html><body> or huge empty <div> shells
  cleaned = cleaned.replace(/<\/?(html|body|head|meta|link)[^>]*>/gi, "");

  // 8. Clean empty paragraphs (<p>&nbsp;</p>, <p></p>)
  cleaned = cleaned.replace(/<p>\s*(&nbsp;)?\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<div>\s*(&nbsp;)?\s*<\/div>/gi, "");
  cleaned = cleaned.replace(/<h[1-6]>\s*<\/h[1-6]>/gi, "");

  // 9. Ensure headings are capped at H2, H3, H4 for good on-page SEO (turn H1 into H2 so article has only 1 H1 which is the title)
  cleaned = cleaned.replace(/<h1\b([^>]*)>/gi, "<h2$1>");
  cleaned = cleaned.replace(/<\/h1>/gi, "</h2>");

  // 10. Trim whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n").trim();

  return cleaned;
}
