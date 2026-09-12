export type ActiveTab =
  | "landing"
  | "blog"
  | "link-generator"
  | "url-cleaner"
  | "bulk-opener"
  | "domain-metrics"
  | "keyword-difficulty"
  | "rank-tracker"
  | "word-html"
  | "markdown-converter"
  | "pdf-editor"
  | "bulk-url-checker"
  | "admin-ads";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Rich text HTML
  featuredImage: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  readTime: string;
  status: "published" | "draft";
  publishedAt: string;
  updatedAt: string;
  views: number;
}

export type AdPlacement = "top_banner" | "sidebar" | "tool_banner" | "footer_banner";
export type AdType = "image_link" | "custom_html" | "native_text";

export interface AdItem {
  id: string;
  placement: AdPlacement;
  type: AdType;
  title: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  customHtml?: string;
  buttonText?: string;
  badgeText?: string;
  enabled: boolean;
  impressions: number;
  clicks: number;
}

export interface AdsConfig {
  globalEnabled: boolean;
  ads: AdItem[];
}

export interface SiteSocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  email?: string;
}

export type RobotsDirective =
  | "index, follow"
  | "noindex, follow"
  | "index, nofollow"
  | "noindex, nofollow";

export interface PageSeoConfig {
  pageId: string;
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string;
  secondaryKeywords?: string;
  canonicalUrl: string;
  robotsDirective: RobotsDirective;
  ogType: "website" | "article" | "product";
  ogImageUrl: string;
  twitterCard: "summary_large_image" | "summary";
  schemaType: "SoftwareApplication" | "WebApplication" | "WebSite" | "Article" | "Custom";
  customSchemaJson?: string;
  author?: string;
  updatedAt?: string;
}

export interface SiteCustomization {
  siteName: string;
  headerTagline: string;
  headerLogoUrl: string;
  headerLogoType: "icon" | "image";
  headerLogoIconLetter: string;
  footerLogoUrl: string;
  footerDescription: string;
  footerCopyright: string;
  footerDisclaimer: string;
  socialLinks: SiteSocialLinks;
  adsTxtContent: string;
  adsensePublisherId: string;
  adsenseAutoAdsEnabled: boolean;
  googleSiteVerification: string;
  bingSiteVerification: string;
  customHeadCode: string;
  customBodyCode: string;
  // Per-page On-Page SEO configurations
  pageSeo: Record<string, PageSeoConfig>;
  updatedAt?: string;
}

export const DEFAULT_PAGE_SEO_CONFIGS: Record<string, PageSeoConfig> = {
  landing: {
    pageId: "landing",
    pageName: "Platform Overview (Home)",
    metaTitle: "RankLynx — All-in-One Professional SEO & Link Building Suite",
    metaDescription: "Boost search engine rankings with free professional SEO software: bulk hyperlink creator, high-speed multi-URL opener, protocol cleaner, domain metrics inspector, and keyword difficulty analyzer.",
    focusKeywords: "seo tools, hyperlink generator, bulk url opener, domain metrics, keyword difficulty, rank tracker",
    secondaryKeywords: "backlink creator, clean urls, anchor text generator, serp position tracker",
    canonicalUrl: "https://ranklynx.com/",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "WebApplication",
    author: "RankLynx SEO Team",
  },
  "link-generator": {
    pageId: "link-generator",
    pageName: "Hyperlink & Anchor Suite",
    metaTitle: "Hyperlink Creator & Anchor Text HTML Link Generator | RankLynx",
    metaDescription: "Generate clean HTML links, markdown anchors, forum BBCode, and bulk outreach hyperlinks with custom prefixes, suffixes, and rel=noopener nofollow tags instantly.",
    focusKeywords: "html link generator, anchor text maker, markdown link creator, bulk hyperlink generator",
    secondaryKeywords: "html anchor tags, rel sponsored nofollow, batch links",
    canonicalUrl: "https://ranklynx.com/#link-generator",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "bulk-opener": {
    pageId: "bulk-opener",
    pageName: "Bulk URL Opener",
    metaTitle: "Bulk URL Opener — Open Multiple Websites & URLs Fast in Tabs | RankLynx",
    metaDescription: "Fast bulk URL opener tool. Paste hundreds of web links to open in browser tabs simultaneously with customizable delays, domain deduplication, and protocol safety.",
    focusKeywords: "bulk url opener, open multiple links, batch url open tabs, multiple website opener",
    secondaryKeywords: "open list of urls, web links opener, fast multi tab opener",
    canonicalUrl: "https://ranklynx.com/#bulk-opener",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "url-cleaner": {
    pageId: "url-cleaner",
    pageName: "Protocol & URL Cleaner",
    metaTitle: "URL Protocol Cleaner & Bulk Domain Normalizer | RankLynx",
    metaDescription: "Clean URLs in bulk: remove http/https protocols, strip www, remove trailing slashes, purge UTM tracking parameters, and extract clean root domains instantly.",
    focusKeywords: "url cleaner, remove protocol http https, extract root domain, clean utm parameters",
    secondaryKeywords: "strip www, normalize urls, clean link list, bulk domain extractor",
    canonicalUrl: "https://ranklynx.com/#url-cleaner",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "domain-metrics": {
    pageId: "domain-metrics",
    pageName: "Domain Metrics Inspector",
    metaTitle: "Bulk Domain Authority & Backlink Metrics Checker | RankLynx",
    metaDescription: "Check Moz DA, PA, Spam Score, Ahrefs DR/UR, and organic search traffic metrics in bulk for link-building outreach, prospecting, and competitor analysis.",
    focusKeywords: "domain authority checker, check moz da pa, ahrefs dr bulk checker, website metrics",
    secondaryKeywords: "moz spam score, domain rating, check bulk backlinks, seo domain authority",
    canonicalUrl: "https://ranklynx.com/#domain-metrics",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "keyword-difficulty": {
    pageId: "keyword-difficulty",
    pageName: "Keyword Difficulty Analyzer",
    metaTitle: "Keyword Difficulty & Search Volume Analysis Tool | RankLynx",
    metaDescription: "Calculate keyword difficulty, monthly search volume, CPC, SERP feature analysis, and backlink requirements to rank on the first page of Google.",
    focusKeywords: "keyword difficulty checker, search volume tool, keyword competition, serp difficulty",
    secondaryKeywords: "kd score, cpc keywords, organic search competition, keyword research",
    canonicalUrl: "https://ranklynx.com/#keyword-difficulty",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "rank-tracker": {
    pageId: "rank-tracker",
    pageName: "SERP Rank Tracker",
    metaTitle: "Keyword Rank Tracker & Google SERP Position Monitoring | RankLynx",
    metaDescription: "Track your domain keyword positions across Google Desktop and Mobile search results with real-time rank movement, historical changes, and SERP feature badges.",
    focusKeywords: "serp rank tracker, google keyword position monitor, rank tracker tool, search rankings",
    secondaryKeywords: "keyword ranking check, google search position, serp monitor, track keyword rank",
    canonicalUrl: "https://ranklynx.com/#rank-tracker",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  blog: {
    pageId: "blog",
    pageName: "Classique Editorial Blog",
    metaTitle: "Classique SEO Editorial & Digital Marketing Insights | RankLynx",
    metaDescription: "In-depth SEO case studies, algorithm updates, link building strategies, and actionable technical guides for modern webmasters and digital marketers.",
    focusKeywords: "seo blog, search engine optimization guides, link building strategies, technical seo",
    secondaryKeywords: "digital marketing articles, backlink case studies, google updates",
    canonicalUrl: "https://ranklynx.com/#blog",
    robotsDirective: "index, follow",
    ogType: "article",
    ogImageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "Article",
    author: "RankLynx Editorial Team",
  },
  "word-html": {
    pageId: "word-html",
    pageName: "Word to HTML & HTML to Word",
    metaTitle: "Word to HTML & HTML to Word Converter — Clean MS Word Code | RankLynx",
    metaDescription: "Convert Microsoft Word documents and rich text to clean HTML code or vice-versa. Strip mso bloat, convert smart quotes, clean inline styles, and export Word documents instantly.",
    focusKeywords: "word to html, html to word, clean word html, wordhtml converter, strip mso styles",
    secondaryKeywords: "convert doc to html, clean html code, rich text to html, visual html editor",
    canonicalUrl: "https://ranklynx.com/#word-html",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "markdown-converter": {
    pageId: "markdown-converter",
    pageName: "Rich Text to Markdown Suite",
    metaTitle: "Rich Text to Markdown & Markdown to Rich Text Converter | RankLynx",
    metaDescription: "Bi-directional Rich Text to Markdown and Markdown to Rich Text converter with live split view, GFM task lists, tables, syntax highlighting, and HTML export.",
    focusKeywords: "rich text to markdown, markdown to rich text, convert html to markdown, markdown editor",
    secondaryKeywords: "github flavored markdown, markdown table generator, visual markdown converter",
    canonicalUrl: "https://ranklynx.com/#markdown-converter",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "pdf-editor": {
    pageId: "pdf-editor",
    pageName: "Professional PDF Editor",
    metaTitle: "Free PDF Editor Online — Edit, Add Text, Whiteout & Save Drafts | RankLynx",
    metaDescription: "Edit any PDF document online without issues. Add text, whiteout/redact content, draw signatures, insert stamps, and save project drafts locally for later.",
    focusKeywords: "pdf editor, edit pdf online, free pdf editor, redact pdf, sign pdf, add text to pdf",
    secondaryKeywords: "pdf whiteout, fill pdf, annotate pdf online, save pdf drafts",
    canonicalUrl: "https://ranklynx.com/#pdf-editor",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
  "bulk-url-checker": {
    pageId: "bulk-url-checker",
    pageName: "Bulk URL Status & Redirect Checker",
    metaTitle: "Bulk URL Checker — Free HTTP Status Code & Redirect Chain Checker | RankLynx",
    metaDescription: "Test hundreds of URLs simultaneously. Check HTTP status codes (200, 301, 302, 404, 500), trace multi-hop redirect chains, analyze response headers, latency, canonicals, and export to CSV.",
    focusKeywords: "bulk url checker, http status code checker, bulk redirect checker, check url status, check 404 broken links",
    secondaryKeywords: "bulk status code checker, trace redirect chain, server response headers, free url audit",
    canonicalUrl: "https://ranklynx.com/#bulk-url-checker",
    robotsDirective: "index, follow",
    ogType: "website",
    ogImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    twitterCard: "summary_large_image",
    schemaType: "SoftwareApplication",
    author: "RankLynx SEO Team",
  },
};

export const DEFAULT_SITE_CUSTOMIZATION: SiteCustomization = {
  siteName: "RankLynx",
  headerTagline: "Pro SEO & Link Suite",
  headerLogoUrl: "",
  headerLogoType: "icon",
  headerLogoIconLetter: "R",
  footerLogoUrl: "",
  footerDescription: "All-in-one professional link generator, bulk URL opener, protocol cleaner, domain metrics inspector, and editorial SEO intelligence suite for digital webmasters.",
  footerCopyright: `© ${new Date().getFullYear()} RankLynx. Free Professional SEO Toolkit.`,
  footerDisclaimer: "Designed for SEO specialists, outreach teams & digital webmasters.",
  socialLinks: {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    email: "contact@ranklynx.com",
  },
  adsTxtContent: `# Google AdSense ads.txt
# Replace with your own publisher ID (e.g. pub-1234567890123456)
google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0

# Example Additional Ad Networks (Ezoic, Mediavine, PropellerAds, etc.)
# ezoic.com, 00000, DIRECT
# mediavine.com, 00000, DIRECT
`,
  adsensePublisherId: "",
  adsenseAutoAdsEnabled: false,
  googleSiteVerification: "",
  bingSiteVerification: "",
  customHeadCode: "",
  customBodyCode: "",
  pageSeo: DEFAULT_PAGE_SEO_CONFIGS,
};

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  isEarlyAdopter: boolean;
  createdAt: string;
  interestedInPro?: boolean;
}

export type AuthModalMode = "signin" | "signup" | "profile";

export interface GeneratedLink {
  id: string;
  url: string;
  keyword: string;
  html: string;
  bbcode: string;
  markdown: string;
}

export interface LinkGeneratorOptions {
  pairingMode: "one-to-one" | "all-combinations" | "tab-separated";
  targetBlank: boolean;
  relAttributes: {
    dofollow: boolean;
    nofollow: boolean;
    sponsored: boolean;
    ugc: boolean;
    noreferrer: boolean;
  };
  caseFormat: "original" | "title" | "lowercase" | "uppercase" | "capitalize-first";
  autoHttps: boolean;
  prefix: string;
  suffix: string;
}

export interface DuplicateCleanerResult {
  originalCount: number;
  uniqueCount: number;
  duplicateCount: number;
  uniqueUrls: string[];
  duplicateUrls: string[];
}

export interface ProtocolCleanerOptions {
  removeProtocol: boolean; // removes http://, https://
  removeWww: boolean; // removes www.
  removeTrailingSlash: boolean; // removes trailing /
  extractDomainOnly: boolean; // removes paths, query, hash
  removeQueryParams: boolean; // removes ?key=val
  removePort: boolean; // removes :8080
  addProtocolPrefix: "none" | "https" | "http" | "https-www";
  lowercase: boolean;
}

export interface DomainMetricResult {
  domain: string;
  mozDA: number;
  mozPA: number;
  mozRD: number;
  mozSpamScore: number;
  ahrefsDR: number;
  ahrefsUR: number;
  ahrefsRD: number;
  ahrefsBacklinks: number;
  semrushAS: number;
  semrushTraffic: number;
  semrushKeywords: number;
  status: string;
}

export interface KeywordDifficultyResult {
  keyword: string;
  difficulty: number;
  difficultyLabel: "Very Easy" | "Easy" | "Medium" | "Hard" | "Super Hard";
  searchVolume: number;
  cpc: number;
  intent: "Informational" | "Commercial" | "Transactional" | "Navigational";
  competitiveDensity: "Low" | "Medium" | "High";
  requiredBacklinks: number;
  serpFeatures: string[];
  analysisSummary: string;
}

export interface TrackedKeywordItem {
  id: string;
  domain: string;
  keyword: string;
  rank: number;
  previousRank: number;
  change: number;
  rankingUrl: string;
  searchEngine: string;
  country: string;
  city: string;
  device: "Desktop" | "Mobile";
  serpFeaturesFound: string[];
  lastChecked: string;
}

export interface UrlPingResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  isSecure: boolean;
  responseTimeMs: number;
  alive: boolean;
  isRedirect?: boolean;
  redirectChain?: string[];
}

export interface RedirectHopItem {
  hop: number;
  url: string;
  statusCode: number;
  statusText: string;
  location?: string;
  responseTimeMs: number;
}

export interface BulkUrlCheckItem {
  index: number;
  originalUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  statusGroup: "2xx" | "3xx" | "4xx" | "5xx" | "error";
  redirectCount: number;
  isRedirect: boolean;
  redirectChain: RedirectHopItem[];
  responseTimeMs: number;
  contentType: string;
  contentLength: string;
  server: string;
  title?: string;
  metaRobots?: string;
  canonical?: string;
  metaDescription?: string;
  headers: Record<string, string>;
  isError: boolean;
  errorMessage?: string;
  checkedAt: string;
}

export interface BulkUrlCheckSummary {
  total: number;
  success2xx: number;
  redirect3xx: number;
  clientError4xx: number;
  serverError5xx: number;
  errors: number;
  avgResponseTimeMs: number;
}

