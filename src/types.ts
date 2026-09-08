export type ActiveTab =
  | "landing"
  | "link-generator"
  | "url-cleaner"
  | "bulk-opener"
  | "domain-metrics"
  | "keyword-difficulty"
  | "rank-tracker"
  | "admin-ads";

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
