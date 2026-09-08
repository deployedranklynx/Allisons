export type ActiveTab =
  | "landing"
  | "blog"
  | "link-generator"
  | "url-cleaner"
  | "bulk-opener"
  | "domain-metrics"
  | "keyword-difficulty"
  | "rank-tracker"
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
  updatedAt?: string;
}

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
