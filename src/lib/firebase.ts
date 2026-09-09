import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";
import { BlogPost, SiteCustomization, DEFAULT_SITE_CUSTOMIZATION, DEFAULT_PAGE_SEO_CONFIGS } from "../types";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface AdminSettingsDoc {
  adminPasskey: string;
  globalEnabled: boolean;
  updatedAt: string;
}

export interface AdDoc {
  id: string;
  placement: string;
  type: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl?: string;
  buttonText?: string;
  badgeText?: string;
  customHtml?: string;
  enabled: boolean;
  impressions: number;
  clicks: number;
}

// Default initial ads in case database is empty on first boot
export const DEFAULT_INITIAL_ADS: AdDoc[] = [
  {
    id: "ad-top-banner",
    placement: "top_banner",
    type: "native_text",
    title: "⚡ High-Performance NVMe SEO VPS Hosting",
    description: "Blazing fast cPanel servers optimized for backlink scrapers and crawling engines. 50% Off First Month.",
    targetUrl: "https://example.com/fast-hosting",
    buttonText: "Claim 50% Off",
    badgeText: "Sponsored",
    enabled: true,
    impressions: 142,
    clicks: 11,
  },
  {
    id: "ad-sidebar",
    placement: "sidebar",
    type: "image_link",
    title: "RankLynx Automated Backlink Indexer",
    description: "Submit up to 10,000 links directly to Google and Bing with real-time indexing status verification.",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
    targetUrl: "https://example.com/indexer-pro",
    buttonText: "Start Free Trial",
    badgeText: "Featured Partner",
    enabled: true,
    impressions: 389,
    clicks: 28,
  },
  {
    id: "ad-tool-banner",
    placement: "tool_banner",
    type: "image_link",
    title: "Boost Your Search Rankings with AI Anchor Text Optimization",
    description: "Analyze anchor diversity, avoid Penguin penalties, and calculate target link ratios with one click.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    targetUrl: "https://example.com/anchor-ai",
    buttonText: "Optimize Anchors",
    badgeText: "Recommended",
    enabled: true,
    impressions: 512,
    clicks: 39,
  },
  {
    id: "ad-footer-banner",
    placement: "footer_banner",
    type: "native_text",
    title: "Webmaster Global Proxy & Residential IP Network",
    description: "Over 50M+ rotating residential IPs for SERP rank tracking and scraping without captchas.",
    targetUrl: "https://example.com/residential-proxy",
    buttonText: "Get 1GB Free",
    badgeText: "Sponsor",
    enabled: false,
    impressions: 96,
    clicks: 5,
  },
];

// Helper: Seed initial Firebase collections if they don't exist
export async function ensureFirebaseAdsInitialized() {
  try {
    const settingsRef = doc(db, "adminSettings", "global");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        adminPasskey: "admin123",
        globalEnabled: true,
        updatedAt: new Date().toISOString(),
      });
      console.log("[Firebase Cloud] Initialized default admin settings.");
    }

    const adsSnap = await getDocs(collection(db, "ads"));
    if (adsSnap.empty) {
      for (const ad of DEFAULT_INITIAL_ADS) {
        await setDoc(doc(db, "ads", ad.id), ad);
      }
      console.log("[Firebase Cloud] Seeded initial ads to Firestore.");
    }
  } catch (err) {
    console.error("[Firebase Cloud] Seed error:", err);
  }
}

// 1. Get Admin Settings (passkey & global toggle)
export async function getFirebaseAdminSettings(): Promise<AdminSettingsDoc> {
  try {
    const settingsRef = doc(db, "adminSettings", "global");
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as AdminSettingsDoc;
      return {
        adminPasskey: data.adminPasskey || "admin123",
        globalEnabled: data.globalEnabled ?? true,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseAdminSettings error:", err);
  }
  return {
    adminPasskey: "admin123",
    globalEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

// 2. Update Admin Settings
export async function updateFirebaseAdminSettings(
  passkey?: string,
  globalEnabled?: boolean
) {
  try {
    const settingsRef = doc(db, "adminSettings", "global");
    const updatePayload: any = { updatedAt: new Date().toISOString() };
    if (passkey) updatePayload.adminPasskey = passkey;
    if (typeof globalEnabled === "boolean") updatePayload.globalEnabled = globalEnabled;

    await setDoc(settingsRef, updatePayload, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] updateFirebaseAdminSettings error:", err);
    return false;
  }
}

// 3. Get All Ads from Firestore
export async function getFirebaseAds(): Promise<AdDoc[]> {
  try {
    const snap = await getDocs(collection(db, "ads"));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AdDoc);
    }
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseAds error:", err);
  }
  return DEFAULT_INITIAL_ADS;
}

// 4. Save/Update All Ads to Firestore
export async function saveFirebaseAds(ads: AdDoc[]) {
  try {
    for (const ad of ads) {
      if (ad.id) {
        await setDoc(doc(db, "ads", ad.id), ad, { merge: true });
      }
    }
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] saveFirebaseAds error:", err);
    return false;
  }
}

// 5. Track ad impression and click in Firestore
export async function trackFirebaseAdClick(adId: string) {
  try {
    const adRef = doc(db, "ads", adId);
    await updateDoc(adRef, {
      clicks: increment(1),
    });
  } catch (err) {
    console.error("[Firebase Cloud] trackFirebaseAdClick error:", err);
  }
}

export async function incrementFirebaseAdImpressions(adIds: string[]) {
  try {
    for (const id of adIds) {
      const adRef = doc(db, "ads", id);
      await updateDoc(adRef, {
        impressions: increment(1),
      });
    }
  } catch {
    // Non-blocking
  }
}

// 6. Cloud Users handling in Firestore
export async function getFirebaseUserByEmail(email: string) {
  try {
    const userRef = doc(db, "users", email.toLowerCase().trim());
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseUserByEmail error:", err);
  }
  return null;
}

export async function saveFirebaseUser(userData: any) {
  try {
    const userRef = doc(db, "users", userData.email.toLowerCase().trim());
    await setDoc(userRef, userData, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] saveFirebaseUser error:", err);
    return false;
  }
}

// 7. Initial Classical Editorial Blog Posts
export const DEFAULT_INITIAL_BLOGS: BlogPost[] = [
  {
    id: "blog-backlink-playbook-2026",
    slug: "high-authority-backlink-playbook-2026",
    title: "The Anatomy of High-Authority Backlinks: A 2026 Webmaster Playbook",
    excerpt: "Discover the exact signals search engine algorithms prioritize when evaluating link equity, referral trust, and topical relevance in the era of automated content.",
    content: `<h2>The Evolution of Search Engine Link Equity</h2>
<p>For more than two decades, hyperlinks have served as the fundamental democratic currency of the World Wide Web. However, modern search algorithm updates have radically altered how equity flows between domains. Raw PageRank quantity has yielded to topical context, semantic anchor balance, and genuine user engagement signals.</p>

<blockquote>"A single contextual backlink from a deeply relevant, editorially vetted publication delivers orders of magnitude more ranking momentum than thousands of automated directory entries."</blockquote>

<h3>1. The Three Pillars of Link Trust</h3>
<p>When auditing backlink acquisitions or planning outreach campaigns, seasoned SEO directors evaluate three deterministic vectors:</p>
<ul>
  <li><strong>Topical Proximity:</strong> Does the linking domain regularly produce authoritative content within your niche, or is it an artificial general blog network?</li>
  <li><strong>Semantic Anchor Variance:</strong> Are your incoming hyperlinks distributed naturally across branded terms, partial matches, exact matches, and raw URLs?</li>
  <li><strong>Editorial Placement:</strong> Does the link reside inside the core editorial body where real readers click, or is it isolated in footers, author bios, or sidebars?</li>
</ul>

<h3>2. The Danger of Anchor Over-Optimization</h3>
<p>One of the most persistent pitfalls in technical SEO is aggressive exact-match anchor text targeting. Search engines look for organic distribution curves. A healthy profile typically exhibits:</p>
<ul>
  <li><strong>50% - 65% Branded Anchors:</strong> Domain name, brand name, and proprietary product names.</li>
  <li><strong>20% - 25% URL & Generic Anchors:</strong> Full target URL, "visit website", "source", or "learn more".</li>
  <li><strong>10% - 15% Partial Match / Topic LSI:</strong> "best link building tools", "SEO audit checklist".</li>
  <li><strong>Under 5% Exact Match:</strong> Monopolizing exact commercial terms invites algorithmic dampening.</li>
</ul>

<h3>3. Actionable Workflow for Webmasters</h3>
<p>To audit and clean your domain's incoming link equity, always combine automated bulk opening for manual visual inspection with parameter stripping to isolate clean target canonicals. Consistent hygiene protects against toxic link penalties and ensures long-term index resilience.</p>`,
    featuredImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Arthur Vance",
      role: "Principal Technical SEO",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    category: "Link Building",
    tags: ["Backlinks", "Algorithms", "Anchor Text", "SERP"],
    readTime: "7 min read",
    status: "published",
    publishedAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    views: 842,
  },
  {
    id: "blog-anchor-text-diversity",
    slug: "anchor-text-diversity-matrix",
    title: "Anchor Text Diversity: How to Balance Exact Match and Branded Links",
    excerpt: "A mathematical framework for calculating safe link ratios, avoiding algorithmic filters, and maximizing topical authority across complex subfolder architectures.",
    content: `<h2>Understanding Algorithmic Anchor Dampening</h2>
<p>Algorithmic filters such as Google Penguin and subsequent core spam updates are specifically engineered to identify non-random link creation. When a brand's referring domains suddenly spike with 80% commercial keyword anchors, statistical anomaly detectors trigger penalty dampening.</p>

<h3>The Golden Ratio of Healthy Link Profiles</h3>
<p>By studying over 100,000 top-ranking URLs across competitive finance, software, and healthcare niches, clear patterns emerge regarding sustainable anchor distributions:</p>

<p>Topical relevance must be demonstrated through the surrounding contextual sentence rather than forced keywords inside the <code>&lt;a href&gt;</code> tag itself. Search engines now parse surrounding paragraph semantics with advanced NLP models.</p>

<h3>Recommended Audit Checklist</h3>
<ol>
  <li>Export all active backlinks using your preferred crawler.</li>
  <li>Categorize anchors into Branded, URL, Generic, Compound, and Exact.</li>
  <li>If exact match exceeds 8%, immediately balance future outreach with brand and navigational citations.</li>
  <li>Verify that your target URLs use clean canonical formats without trailing session tracking tags.</li>
</ol>`,
    featuredImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Elena Rostova",
      role: "SEO Data Scientist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    category: "SEO Guides",
    tags: ["Auditing", "Link Equity", "Data Science", "Penalties"],
    readTime: "5 min read",
    status: "published",
    publishedAt: "2026-02-24T14:30:00Z",
    updatedAt: "2026-02-24T14:30:00Z",
    views: 615,
  },
  {
    id: "blog-search-intent-topical-authority",
    slug: "search-intent-and-topical-authority",
    title: "Search Intent & Topical Authority: Winning High-Difficulty SERPs",
    excerpt: "Why high Domain Rating alone fails to rank for commercial keywords without rigorous keyword difficulty analysis and intent alignment.",
    content: `<h2>Beyond Raw Domain Authority</h2>
<p>Too many SEO practitioners obsess over third-party metrics like Domain Rating (DR) or Domain Authority (DA) as if they were magical guarantees of top ranking. However, search engines evaluate topical depth on an entity level, not merely aggregate link count.</p>

<blockquote>"A site with a DR of 35 that has answered every nuanced sub-question in a specific niche will routinely outrank a DR 80 general news aggregator for high-intent queries."</blockquote>

<h3>Deconstructing Search Intent Archetypes</h3>
<p>Before writing a single line of copy or building a single outreach link, you must categorize the SERP's prevailing intent into one of four buckets:</p>
<ul>
  <li><strong>Informational:</strong> Users seeking conceptual knowledge, definitions, or step-by-step educational walk-throughs.</li>
  <li><strong>Investigational / Commercial:</strong> Users comparing tools, evaluating pros & cons, or reading curated roundups.</li>
  <li><strong>Transactional:</strong> High purchase readiness, landing pages, interactive calculators, pricing tables.</li>
  <li><strong>Navigational:</strong> Explicit brand search seeking direct portal logins.</li>
</ul>

<h3>Structuring Pillar & Cluster Hubs</h3>
<p>To dominate competitive keywords, organize your content into a clean thematic hub: one comprehensive pillar guide linking internally to targeted supporting child articles. Internal linking distributes authority efficiently and signals complete topical mastery to search crawlers.</p>`,
    featuredImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    author: {
      name: "Julian Sterling",
      role: "Chief Content Strategist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    category: "Technical SEO",
    tags: ["Search Intent", "Keyword Difficulty", "Pillar Pages", "Content Strategy"],
    readTime: "8 min read",
    status: "published",
    publishedAt: "2026-02-18T09:15:00Z",
    updatedAt: "2026-02-18T09:15:00Z",
    views: 928,
  },
];

// Ensure initial blogs exist in Firestore
export async function ensureFirebaseBlogsInitialized() {
  try {
    const blogsSnap = await getDocs(collection(db, "blogs"));
    if (blogsSnap.empty) {
      for (const blog of DEFAULT_INITIAL_BLOGS) {
        await setDoc(doc(db, "blogs", blog.id), blog);
      }
      console.log("[Firebase Cloud] Initialized default blog articles in Firestore.");
    }
  } catch (err) {
    console.error("[Firebase Cloud] ensureFirebaseBlogsInitialized error:", err);
  }
}

// Fetch all blogs from Firestore (returns defaults if offline/empty)
export async function getFirebaseBlogs(): Promise<BlogPost[]> {
  try {
    const blogsSnap = await getDocs(collection(db, "blogs"));
    if (!blogsSnap.empty) {
      const posts: BlogPost[] = [];
      blogsSnap.forEach((docSnap) => {
        posts.push(docSnap.data() as BlogPost);
      });
      // Sort newest first
      return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseBlogs error:", err);
  }
  return DEFAULT_INITIAL_BLOGS;
}

// Fetch single blog post by slug or id
export async function getFirebaseBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const all = await getFirebaseBlogs();
    return all.find((p) => p.slug === slug || p.id === slug) || null;
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseBlogBySlug error:", err);
  }
  return DEFAULT_INITIAL_BLOGS.find((p) => p.slug === slug || p.id === slug) || null;
}

// Save or Update a blog post in Firestore
export async function saveFirebaseBlogPost(post: BlogPost): Promise<boolean> {
  try {
    const docRef = doc(db, "blogs", post.id);
    await setDoc(docRef, {
      ...post,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] saveFirebaseBlogPost error:", err);
    return false;
  }
}

// Delete a blog post from Firestore
export async function deleteFirebaseBlogPost(postId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "blogs", postId));
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] deleteFirebaseBlogPost error:", err);
    return false;
  }
}

// Increment blog views count in Firestore
export async function incrementFirebaseBlogViews(postId: string) {
  try {
    const docRef = doc(db, "blogs", postId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// SITE SETTINGS, BRANDING, FOOTER & ADS.TXT / ADSENSE VERIFICATION
// ---------------------------------------------------------------------------

export async function ensureFirebaseSiteSettingsInitialized() {
  try {
    const docRef = doc(db, "siteSettings", "global");
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...DEFAULT_SITE_CUSTOMIZATION,
        updatedAt: new Date().toISOString(),
      });
      console.log("[Firebase Cloud] Initialized default site branding and settings.");
    }
  } catch (err) {
    console.error("[Firebase Cloud] ensureFirebaseSiteSettingsInitialized error:", err);
  }
}

export async function getFirebaseSiteSettings(): Promise<SiteCustomization> {
  try {
    const docRef = doc(db, "siteSettings", "global");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<SiteCustomization>;
      return {
        ...DEFAULT_SITE_CUSTOMIZATION,
        ...data,
        pageSeo: {
          ...DEFAULT_PAGE_SEO_CONFIGS,
          ...(data.pageSeo || {}),
        },
      };
    }
  } catch (err) {
    console.error("[Firebase Cloud] getFirebaseSiteSettings error:", err);
  }
  return DEFAULT_SITE_CUSTOMIZATION;
}

export async function saveFirebaseSiteSettings(
  settings: Partial<SiteCustomization>
): Promise<boolean> {
  try {
    const docRef = doc(db, "siteSettings", "global");
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error("[Firebase Cloud] saveFirebaseSiteSettings error:", err);
    return false;
  }
}


