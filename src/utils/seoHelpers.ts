import { GeneratedLink, LinkGeneratorOptions, ProtocolCleanerOptions } from "../types";

// Format anchor text case
export function formatAnchorText(text: string, format: LinkGeneratorOptions["caseFormat"]): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  switch (format) {
    case "title":
      return trimmed
        .toLowerCase()
        .split(" ")
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
        .join(" ");
    case "lowercase":
      return trimmed.toLowerCase();
    case "uppercase":
      return trimmed.toUpperCase();
    case "capitalize-first":
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    case "original":
    default:
      return trimmed;
  }
}

// Ensure URL has protocol if required
export function ensureUrlProtocol(rawUrl: string, autoHttps: boolean = true): string {
  let url = rawUrl.trim();
  if (!url) return "";
  if (autoHttps && !/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

// Generate HTML, BBCode, and Markdown simultaneously
export function generateLinks(
  urls: string[],
  keywords: string[],
  options: LinkGeneratorOptions
): GeneratedLink[] {
  const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
  const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean);

  if (cleanUrls.length === 0 && cleanKeywords.length === 0) return [];

  const results: GeneratedLink[] = [];

  // Construct rel string
  const relList: string[] = [];
  if (options.relAttributes.nofollow) relList.push("nofollow");
  if (options.relAttributes.sponsored) relList.push("sponsored");
  if (options.relAttributes.ugc) relList.push("ugc");
  if (options.targetBlank && options.relAttributes.noreferrer) {
    relList.push("noopener", "noreferrer");
  } else if (options.relAttributes.noreferrer) {
    relList.push("noreferrer");
  }
  const relAttr = relList.length > 0 ? ` rel="${relList.join(" ")}"` : "";
  const targetAttr = options.targetBlank ? ` target="_blank"` : "";

  const createSingleLink = (rawUrl: string, rawKw: string, index: number): GeneratedLink => {
    const finalUrl = ensureUrlProtocol(rawUrl, options.autoHttps);
    const anchor = formatAnchorText(rawKw, options.caseFormat);

    const html = `${options.prefix}<a href="${finalUrl}"${targetAttr}${relAttr}>${anchor}</a>${options.suffix}`;
    const bbcode = `${options.prefix}[url=${finalUrl}]${anchor}[/url]${options.suffix}`;
    const markdown = `${options.prefix}[${anchor}](${finalUrl})${options.suffix}`;

    return {
      id: `link-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: finalUrl,
      keyword: anchor,
      html,
      bbcode,
      markdown,
    };
  };

  if (options.pairingMode === "one-to-one") {
    const maxLen = Math.max(cleanUrls.length, cleanKeywords.length);
    for (let i = 0; i < maxLen; i++) {
      const url = cleanUrls[i] || cleanUrls[cleanUrls.length - 1] || "https://example.com";
      const kw = cleanKeywords[i] || cleanKeywords[cleanKeywords.length - 1] || "Anchor Text";
      results.push(createSingleLink(url, kw, i));
    }
  } else if (options.pairingMode === "all-combinations") {
    let count = 0;
    for (const url of cleanUrls) {
      for (const kw of cleanKeywords) {
        results.push(createSingleLink(url, kw, count++));
      }
    }
  } else if (options.pairingMode === "tab-separated") {
    // urls array might contain combined tab or comma separated items
    cleanUrls.forEach((line, i) => {
      const parts = line.split(/[,\t|]+/);
      const url = parts[0]?.trim() || "https://example.com";
      const kw = parts[1]?.trim() || cleanKeywords[i] || "Anchor Text";
      results.push(createSingleLink(url, kw, i));
    });
  }

  return results;
}

// Remove Duplicate URLs with fine-grained options
export function removeDuplicateUrls(
  rawInput: string,
  options: {
    ignoreTrailingSlash: boolean;
    caseInsensitive: boolean;
    stripQueryParams: boolean;
    stripFragments: boolean;
    normalizeProtocol: boolean;
  }
) {
  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueUrls: string[] = [];
  const duplicateUrls: string[] = [];

  for (const line of lines) {
    let normalized = line;

    if (options.caseInsensitive) {
      normalized = normalized.toLowerCase();
    }

    if (options.normalizeProtocol) {
      normalized = normalized.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    }

    if (options.stripQueryParams) {
      normalized = normalized.split("?")[0];
    }

    if (options.stripFragments) {
      normalized = normalized.split("#")[0];
    }

    if (options.ignoreTrailingSlash) {
      normalized = normalized.replace(/\/+$/, "");
    }

    if (seen.has(normalized)) {
      duplicateUrls.push(line);
    } else {
      seen.add(normalized);
      uniqueUrls.push(line);
    }
  }

  return {
    originalCount: lines.length,
    uniqueCount: uniqueUrls.length,
    duplicateCount: duplicateUrls.length,
    uniqueUrls,
    duplicateUrls,
  };
}

// Protocol, www, and prefix cleaner
export function cleanUrlProtocols(urls: string[], options: ProtocolCleanerOptions): string[] {
  return urls
    .map((raw) => {
      let u = raw.trim();
      if (!u) return "";

      // Lowercase if requested
      if (options.lowercase) {
        u = u.toLowerCase();
      }

      // Extract domain only if checked
      if (options.extractDomainOnly) {
        try {
          const withScheme = /^https?:\/\//i.test(u) ? u : `http://${u}`;
          const parsed = new URL(withScheme);
          u = parsed.hostname;
        } catch {
          u = u.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0].split("?")[0];
        }
      }

      // Strip query parameters
      if (options.removeQueryParams && !options.extractDomainOnly) {
        u = u.split("?")[0];
      }

      // Strip protocol
      if (options.removeProtocol) {
        u = u.replace(/^https?:\/\//i, "");
      }

      // Strip www
      if (options.removeWww) {
        u = u.replace(/^(https?:\/\/)?www\./i, (match) => {
          if (match.toLowerCase().startsWith("http")) {
            return match.replace(/www\./i, "");
          }
          return "";
        });
      }

      // Strip trailing slash
      if (options.removeTrailingSlash) {
        u = u.replace(/\/+$/, "");
      }

      // Remove port if present
      if (options.removePort) {
        u = u.replace(/(:\d+)(\/.*)?$/, "$2");
      }

      // Prepend prefix if selected
      if (options.addProtocolPrefix === "https") {
        if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
      } else if (options.addProtocolPrefix === "http") {
        if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
      } else if (options.addProtocolPrefix === "https-www") {
        u = u.replace(/^(https?:\/\/)?(www\.)?/i, "");
        u = `https://www.${u}`;
      }

      return u;
    })
    .filter(Boolean);
}

// Download file utility
export function downloadFile(content: string, fileName: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy to clipboard with fallback
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Clipboard copy failed", err);
    return false;
  }
}

// Format numbers (e.g. 1.2M, 45K)
export function formatCompactNumber(num: number): string {
  if (!num && num !== 0) return "0";
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}
