import React, { useState, useEffect, useMemo } from "react";
import { BlogPost, RobotsDirective } from "../types";
import {
  getFirebaseBlogs,
  saveFirebaseBlogPost,
  deleteFirebaseBlogPost,
  ensureFirebaseBlogsInitialized,
} from "../lib/firebase";
import { RichTextEditor } from "./RichTextEditor";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  Image as ImageIcon,
  Tag,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Search,
  DollarSign,
  Globe,
  Code2,
  Layers,
  FileText,
  Sliders,
  Copy,
  Info,
  Smartphone,
  Monitor,
} from "lucide-react";

// Curated high quality SEO featured images for fast 1-click picking
const PRESET_FEATURED_IMAGES = [
  {
    label: "Analytics & Growth",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Search & Code",
    url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Data & Authority",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Technical Architecture",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
];

const PRESET_CATEGORIES = [
  "SEO Guides",
  "Link Building",
  "Technical SEO",
  "Keyword Research",
  "Algorithm Updates",
  "Case Studies",
  "Monetization & AdSense",
];

// Ready-to-use Ad Templates for Multi-Ad Networks
const AD_NETWORK_TEMPLATES: Record<
  string,
  { name: string; description: string; sampleCode: string }
> = {
  adsense: {
    name: "Google AdSense",
    description: "Responsive auto-ad banner code for Google AdSense",
    sampleCode: `<!-- Google AdSense In-Article Responsive Slot -->
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-0000000000000000"
     data-ad-slot="1234567890"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
  },
  medianet: {
    name: "Media.net / Yahoo Bing",
    description: "Contextual native banner for Media.net",
    sampleCode: `<!-- Media.net In-Article Unit -->
<div id="123456789">
  <script type="text/javascript">
    try {
      window._mNHandle.queue.push(function () {
        window._mNDetails.loadTag("123456789", "728x90", "123456789");
      });
    } catch (error) {}
  </script>
</div>`,
  },
  ezoic: {
    name: "Ezoic AI Monetization",
    description: "Native placeholder unit for automated Ezoic ad testing",
    sampleCode: `<!-- Ezoic - in_content_1 - incontent_1 -->
<div id="ezoic-pub-ad-placeholder-101"></div>
<!-- End Ezoic - in_content_1 - incontent_1 -->`,
  },
  monetag: {
    name: "Monetag / PropellerAds",
    description: "Direct banner or in-page native tag",
    sampleCode: `<!-- Monetag / Propeller Native Banner Script -->
<script>(function(d,z,s){s.src='https://alwingulla.com/alw.js?z='+z;d.body.appendChild(s)})(document,1234567,document.createElement('script'))</script>`,
  },
  adsterra: {
    name: "Adsterra Native / Display",
    description: "Responsive banner script container",
    sampleCode: `<!-- Adsterra 728x90 Banner Slot -->
<script type="text/javascript">
  atOptions = {
    'key' : '00000000000000000000000000000000',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/00000000000000000000000000000000/invoke.js"></script>`,
  },
  custom: {
    name: "Custom HTML / Affiliate Banner",
    description: "Raw HTML affiliate banner with custom target link",
    sampleCode: `<!-- Custom Sponsor / Affiliate Hero Banner -->
<div class="my-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 text-center">
  <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Sponsored Recommendation</span>
  <h4 class="text-sm font-bold text-gray-800 mb-1">Boost Your Domain Authority with Ranked Outreach</h4>
  <p class="text-xs text-gray-600 mb-3">Get 20% discount on high-tier editorial backlinks today.</p>
  <a href="https://retoolmaster.com/" target="_blank" rel="noopener sponsored" class="inline-block px-4 py-1.5 rounded-lg bg-[#0984E3] text-white text-xs font-bold hover:opacity-95">Claim Offer →</a>
</div>`,
  },
};

export function AdminBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Editor Sub-tabs: content, seo, monetization
  const [editorSubTab, setEditorSubTab] = useState<"content" | "seo" | "monetization">("content");
  const [serpPreviewMode, setSerpPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Core Form state
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("SEO Master");
  const [authorRole, setAuthorRole] = useState<string>("Senior SEO Strategist");
  const [authorAvatar, setAuthorAvatar] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  );
  const [category, setCategory] = useState<string>("SEO Guides");
  const [tagsInput, setTagsInput] = useState<string>("SEO, Link Building");
  const [status, setStatus] = useState<"published" | "draft">("published");

  // On-Page SEO Form state for fast Google indexing
  const [seoTitle, setSeoTitle] = useState<string>("");
  const [seoDescription, setSeoDescription] = useState<string>("");
  const [focusKeyword, setFocusKeyword] = useState<string>("seo tools");
  const [canonicalUrl, setCanonicalUrl] = useState<string>("");
  const [robotsDirective, setRobotsDirective] = useState<RobotsDirective>("index, follow");
  const [schemaType, setSchemaType] = useState<"BlogPosting" | "Article" | "NewsArticle" | "TechArticle">("BlogPosting");
  const [noIndex, setNoIndex] = useState<boolean>(false);

  // Multi-Platform In-Article Ad Monetization Form state
  const [inArticleAdEnabled, setInArticleAdEnabled] = useState<boolean>(true);
  const [inArticleAdProvider, setInArticleAdProvider] = useState<
    "adsense" | "medianet" | "ezoic" | "propeller" | "monetag" | "adsterra" | "custom"
  >("adsense");
  const [inArticleAdHtml, setInArticleAdHtml] = useState<string>("");
  const [adPlacementPosition, setAdPlacementPosition] = useState<"top" | "mid" | "bottom" | "all">("all");

  // Load all blogs from Firebase Cloud Firestore
  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      await ensureFirebaseBlogsInitialized();
      const posts = await getFirebaseBlogs();
      setBlogs(posts);
    } catch (err) {
      console.error("Error loading blogs for admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // Helper to generate a clean URL slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleStartCreate = () => {
    setIsNewPost(true);
    setEditorSubTab("content");
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent(
      `<h2>Executive Overview</h2>\n<p>Write your detailed guide introduction here with your focus keyword...</p>\n\n<blockquote>"Strategic search optimization demands consistency and analytical rigor."</blockquote>\n\n<h3>Core Principles</h3>\n<ul>\n  <li><strong>Point 1:</strong> Detail key algorithmic factor</li>\n  <li><strong>Point 2:</strong> Detail execution blueprint</li>\n</ul>\n\n<h3>Conclusion & Strategic Implementation</h3>\n<p>Wrap up actionable recommendations for webmasters and digital marketers.</p>`
    );
    setFeaturedImage(PRESET_FEATURED_IMAGES[0].url);
    setAuthorName("SEO Master");
    setAuthorRole("Senior Technical Director");
    setAuthorAvatar(
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    );
    setCategory("SEO Guides");
    setTagsInput("Backlinks, SERP, Technical SEO");
    setStatus("published");

    // SEO defaults
    setSeoTitle("");
    setSeoDescription("");
    setFocusKeyword("seo tools");
    setCanonicalUrl("");
    setRobotsDirective("index, follow");
    setSchemaType("BlogPosting");
    setNoIndex(false);

    // Multi-ad monetization defaults
    setInArticleAdEnabled(true);
    setInArticleAdProvider("adsense");
    setInArticleAdHtml(AD_NETWORK_TEMPLATES.adsense.sampleCode);
    setAdPlacementPosition("all");

    setEditingPost({
      id: "blog-" + Date.now(),
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      featuredImage: PRESET_FEATURED_IMAGES[0].url,
      author: {
        name: "SEO Master",
        role: "Senior Technical Director",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      },
      category: "SEO Guides",
      tags: ["Backlinks", "SERP"],
      readTime: "5 min read",
      status: "published",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      focusKeyword: "seo tools",
      robotsDirective: "index, follow",
      schemaType: "BlogPosting",
      inArticleAdEnabled: true,
      inArticleAdProvider: "adsense",
      inArticleAdHtml: AD_NETWORK_TEMPLATES.adsense.sampleCode,
      adPlacementPosition: "all",
    });
  };

  const handleStartEdit = (post: BlogPost) => {
    setIsNewPost(false);
    setEditorSubTab("content");
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setFeaturedImage(post.featuredImage);
    setAuthorName(post.author.name);
    setAuthorRole(post.author.role || "SEO Contributor");
    setAuthorAvatar(
      post.author.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    );
    setCategory(post.category);
    setTagsInput(post.tags.join(", "));
    setStatus(post.status);

    // Load SEO states
    setSeoTitle(post.seoTitle || "");
    setSeoDescription(post.seoDescription || "");
    setFocusKeyword(post.focusKeyword || post.tags[0] || "seo");
    setCanonicalUrl(post.canonicalUrl || "");
    setRobotsDirective(post.robotsDirective || "index, follow");
    setSchemaType(post.schemaType || "BlogPosting");
    setNoIndex(!!post.noIndex);

    // Load Multi-Ad Monetization states
    setInArticleAdEnabled(post.inArticleAdEnabled !== false);
    setInArticleAdProvider(post.inArticleAdProvider || "adsense");
    setInArticleAdHtml(post.inArticleAdHtml || AD_NETWORK_TEMPLATES[post.inArticleAdProvider || "adsense"]?.sampleCode || "");
    setAdPlacementPosition(post.adPlacementPosition || "all");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNewPost || !slug) {
      setSlug(generateSlug(val));
    }
    if (!seoTitle) {
      // Auto-suggest canonical or keep clean
    }
  };

  // Real-time On-Page SEO Analysis
  const seoAudit = useMemo(() => {
    const kw = (focusKeyword || "").trim().toLowerCase();
    const effectiveTitle = (seoTitle || title || "").toLowerCase();
    const effectiveDesc = (seoDescription || excerpt || "").toLowerCase();
    const effectiveSlug = (slug || "").toLowerCase();
    const plainText = (content || "").replace(/<[^>]*>/g, " ").toLowerCase();

    if (!kw) {
      return {
        score: 50,
        checks: [],
        wordCount: plainText.trim().split(/\s+/).length,
        kwCount: 0,
        kwDensity: "0%",
      };
    }

    const inTitle = effectiveTitle.includes(kw);
    const inDesc = effectiveDesc.includes(kw);
    const inSlug = effectiveSlug.includes(kw.replace(/\s+/g, "-")) || effectiveSlug.includes(kw);
    
    // Check first 150 words
    const first150Words = plainText.split(/\s+/).slice(0, 150).join(" ");
    const inFirstParagraph = first150Words.includes(kw);

    // Check headings
    const headingsMatch = (content || "").match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
    const inHeadings = headingsMatch.some((h) => h.toLowerCase().includes(kw));

    // Word count & density
    const words = plainText.trim() ? plainText.trim().split(/\s+/) : [];
    const wordCount = words.length;
    
    // Count occurrences of focus keyword
    const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedKw}\\b`, "gi");
    const matches = plainText.match(regex);
    const kwCount = matches ? matches.length : 0;
    const kwDensity = wordCount > 0 ? ((kwCount / wordCount) * 100).toFixed(2) + "%" : "0%";

    const checks = [
      {
        id: "kw-title",
        title: "Focus Keyword in SEO Title",
        passed: inTitle,
        desc: inTitle ? "Keyword present in meta title" : "Add focus keyword to your SEO Title tag for Google ranking",
      },
      {
        id: "kw-desc",
        title: "Focus Keyword in Meta Description",
        passed: inDesc,
        desc: inDesc ? "Keyword found in snippet description" : "Include keyword in meta description to increase click-through rate (CTR)",
      },
      {
        id: "kw-slug",
        title: "Focus Keyword in URL Slug",
        passed: inSlug,
        desc: inSlug ? "URL slug includes target entity keyword" : "Add keyword to URL slug (e.g. /#blog/your-keyword-guide)",
      },
      {
        id: "kw-intro",
        title: "Focus Keyword in First 150 Words",
        passed: inFirstParagraph,
        desc: inFirstParagraph ? "Keyword appears in opening executive summary" : "Mention your focus keyword early in the first paragraph",
      },
      {
        id: "kw-headings",
        title: "Focus Keyword in H2/H3 Subheadings",
        passed: inHeadings,
        desc: inHeadings ? "Keyword present in subheadings" : "Include focus keyword in at least one H2 or H3 section",
      },
      {
        id: "word-count",
        title: "Editorial Depth & Word Count",
        passed: wordCount >= 300,
        desc: wordCount >= 300 ? `Excellent depth (${wordCount} words)` : `Article has ${wordCount} words (recommend 400+ words for indexing)`,
      },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return {
      score,
      checks,
      wordCount,
      kwCount,
      kwDensity,
    };
  }, [focusKeyword, seoTitle, title, seoDescription, excerpt, slug, content]);

  // Calculate estimated read time
  const plainText = (content || "").replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeEst = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  // 1-Click select ad network template
  const handleSelectAdNetwork = (providerKey: string) => {
    setInArticleAdProvider(providerKey as any);
    if (AD_NETWORK_TEMPLATES[providerKey]) {
      setInArticleAdHtml(AD_NETWORK_TEMPLATES[providerKey].sampleCode);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSaveErrorMsg("Please enter an article title.");
      return;
    }
    if (!content.trim()) {
      setSaveErrorMsg("Please provide article body content.");
      return;
    }

    setIsLoading(true);
    setSaveErrorMsg(null);

    const cleanSlug = (slug || generateSlug(title)).trim();
    const cleanTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const postPayload: BlogPost = {
      id: editingPost?.id || "blog-" + Date.now(),
      slug: cleanSlug,
      title: title.trim(),
      excerpt: excerpt.trim() || title.trim(),
      content: content.trim(),
      featuredImage:
        featuredImage.trim() ||
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      author: {
        name: authorName.trim() || "Editorial Team",
        role: authorRole.trim() || "SEO Strategist",
        avatar:
          authorAvatar.trim() ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      },
      category: category.trim() || "SEO Guides",
      tags: cleanTags.length > 0 ? cleanTags : ["SEO", "Webmaster"],
      readTime: readTimeEst,
      status,
      publishedAt: editingPost?.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: editingPost?.views || 0,

      // On-Page SEO fields
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || excerpt.trim() || title.trim(),
      focusKeyword: focusKeyword.trim() || (cleanTags[0] ?? "seo"),
      canonicalUrl:
        canonicalUrl.trim() || `https://retoolmaster.com/#blog/${cleanSlug}`,
      robotsDirective: noIndex ? "noindex, follow" : robotsDirective,
      schemaType,
      noIndex,

      // Multi-Platform In-Article Ad Monetization
      inArticleAdEnabled,
      inArticleAdProvider,
      inArticleAdHtml: inArticleAdHtml.trim(),
      adPlacementPosition,
    };

    try {
      // Direct Firebase Cloud Firestore Save
      const success = await saveFirebaseBlogPost(postPayload);
      if (success) {
        setSaveSuccessMsg(
          status === "published"
            ? "Article published live with On-Page SEO & Ad Monetization to Firebase Cloud!"
            : "Draft saved in Firebase Cloud!"
        );
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        setEditingPost(null);
        await loadBlogs();
      } else {
        setSaveErrorMsg("Failed to save article to Firebase Cloud.");
      }
    } catch {
      setSaveErrorMsg("Network error saving article.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${post.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const ok = await deleteFirebaseBlogPost(post.id);
      if (ok) {
        setBlogs((prev) => prev.filter((p) => p.id !== post.id));
        setSaveSuccessMsg("Article deleted from Firebase Cloud.");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch {
      setSaveErrorMsg("Failed to delete article.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // VIEW: EDITING OR CREATING AN ARTICLE
  // --------------------------------------------------------------------------
  if (editingPost) {
    const currentMetaTitle = seoTitle.trim() || title.trim() || "Article Title Preview";
    const currentMetaDesc =
      seoDescription.trim() ||
      excerpt.trim() ||
      "Provide a compelling meta description to rank higher in Google search results and attract high-converting organic clicks.";
    const currentCanonicalUrl =
      canonicalUrl.trim() || `https://retoolmaster.com/#blog/${slug || "article-slug"}`;

    return (
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Editor Top Navigation & Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              title="Return to Articles List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span>{isNewPost ? "Create New Article" : "Edit Article"}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0984E3] border border-blue-200 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[#0984E3]" />
                  <span>Firebase Cloud</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    seoAudit.score >= 80
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  SEO Score: {seoAudit.score}/100
                </span>
              </h2>
              <p className="text-xs text-[#64748B]">
                {status === "published"
                  ? "Changes will immediately update live across Google indexing meta tags and public readers."
                  : "Saved as an internal draft."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePost}
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0873C4] rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isLoading
                  ? "Saving to Cloud..."
                  : status === "published"
                  ? "Publish Live to Site"
                  : "Save Draft"}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-2 flex items-center gap-2 overflow-x-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setEditorSubTab("content")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              editorSubTab === "content"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Article Content & Body</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorSubTab("seo")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              editorSubTab === "seo"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>2. On-Page SEO & Google Indexing</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                editorSubTab === "seo"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {seoAudit.score}% Score
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEditorSubTab("monetization")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              editorSubTab === "monetization"
                ? "bg-[#0984E3] text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Multi-Platform Ad Monetization</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                editorSubTab === "monetization"
                  ? "bg-white/20 text-white"
                  : inArticleAdEnabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {inArticleAdEnabled ? inArticleAdProvider.toUpperCase() : "DISABLED"}
            </span>
          </button>
        </div>

        {/* Notifications */}
        {saveSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
        {saveErrorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 1: CONTENT & BODY */}
        {/* ========================================================================= */}
        {editorSubTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Writing Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Title & Slug */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masterclass: Technical Anchor Text Distribution in 2026"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm sm:text-base font-serif font-bold text-[#0F172A] border border-gray-300 rounded-xl focus:outline-none focus:border-[#0984E3] focus:ring-2 focus:ring-[#0984E3]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    URL Slug (auto-generated or custom)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 text-xs font-mono bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                      /#blog/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      placeholder="article-url-slug"
                      className="flex-1 px-3 py-2 text-xs font-mono text-gray-800 border border-gray-300 rounded-r-lg focus:outline-none focus:border-[#0984E3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Lead Excerpt (short summary for cards and search previews)
                  </label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Summarize the core takeaways of this guide..."
                    className="w-full px-3 py-2 text-xs text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>

              {/* RichText Article Content Area */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Article Body (Easy RichText Editor)
                  </label>
                  <span className="text-[11px] text-gray-500">
                    Formatting, Headings, Lists, Quotes & In-article Images
                  </span>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Compose your classical guide with headings, bullet points, pull quotes, and links..."
                  minHeight="420px"
                />
              </div>
            </div>

            {/* Sidebar Settings Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Publishing Status Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Publication Status
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("published")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === "published"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Published Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === "draft"
                        ? "bg-gray-800 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Draft Only</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  When set to <strong>Published Live</strong>, the article will
                  instantly appear in the public Blog section and dynamic /sitemap.xml.
                </p>
              </div>

              {/* Featured Image Selector */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0984E3]" />
                  Featured Header Image
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Custom Image Web URL
                  </label>
                  <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                {/* Quick Pick Presets */}
                <div>
                  <span className="block text-[11px] font-semibold text-gray-500 mb-2">
                    Or 1-Click Pick Curated SEO Image:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_FEATURED_IMAGES.map((img, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setFeaturedImage(img.url)}
                        className={`relative rounded-lg overflow-hidden border-2 text-left transition-all ${
                          featuredImage === img.url
                            ? "border-[#0984E3] ring-2 ring-[#0984E3]/20"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-14 object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Preview */}
                {featuredImage && (
                  <div className="mt-3">
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Live Preview
                    </span>
                    <div className="rounded-xl overflow-hidden border border-gray-200 h-32 bg-gray-100">
                      <img
                        src={featuredImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            PRESET_FEATURED_IMAGES[0].url;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Tags */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#0984E3]" />
                  Taxonomy & Topics
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3] bg-white"
                  >
                    {PRESET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Backlinks, Algorithms, Anchor Text"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>

              {/* Author Byline */}
              <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0984E3]" />
                  Author Byline
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. SEO Master"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Role / Subtitle
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="e.g. Technical Director"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 2: ON-PAGE SEO & GOOGLE INDEXING SECTION */}
        {/* ========================================================================= */}
        {editorSubTab === "seo" && (
          <div className="space-y-6">
            {/* Header explanation banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-5 h-5 text-white" />
                  <h3 className="text-base sm:text-lg font-bold">
                    Per-Article On-Page SEO Engine
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
                  Har article ke liye Meta Title, Meta Description, Focus Keyword aur Schema Markup customize karein taake Google bot article ko jaldi index kare aur search results mein top par laye.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-center">
                  <div className="text-2xl font-black">{seoAudit.score}/100</div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">SEO Index Score</div>
                </div>
              </div>
            </div>

            {/* Google SERP Snippet Preview */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0984E3]" />
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    Google SERP Snippet Live Preview
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setSerpPreviewMode("desktop")}
                    className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      serpPreviewMode === "desktop"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSerpPreviewMode("mobile")}
                    className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      serpPreviewMode === "mobile"
                        ? "bg-white text-gray-900 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Realistic Google Snippet Box */}
              <div
                className={`p-4 rounded-xl border border-gray-200 bg-white font-sans ${
                  serpPreviewMode === "mobile" ? "max-w-md mx-auto" : "max-w-2xl"
                }`}
              >
                {/* Site Identity Line */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#0984E3] text-white flex items-center justify-center text-[10px] font-bold">
                    R
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#202124] font-medium leading-none">
                      RetoolMaster
                    </span>
                    <span className="text-[11px] text-[#5f6368] font-mono leading-none truncate mt-0.5">
                      {currentCanonicalUrl}
                    </span>
                  </div>
                </div>

                {/* Google Search Title */}
                <h3 className="text-base sm:text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug mt-1">
                  {currentMetaTitle}
                </h3>

                {/* Google Snippet Description */}
                <p className="text-xs sm:text-[13px] text-[#4d5156] leading-relaxed mt-1">
                  <span className="text-[#70757a] mr-1">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} —
                  </span>
                  {currentMetaDesc}
                </p>
              </div>
            </div>

            {/* Keyword & Score Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Focus Keyword Input & Meta Tags Fields */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0984E3]" />
                      Focus Target Keyword *
                    </label>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Density: {seoAudit.kwDensity} ({seoAudit.kwCount} matches)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="e.g. anchor text generator, keyword difficulty, backlinks guide"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:border-[#0984E3] focus:ring-2 focus:ring-[#0984E3]/15"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    The primary search query you want this article to rank for on Google.
                  </p>
                </div>

                {/* Custom SEO Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      SEO Title (Meta Title)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        (seoTitle || title).length > 60
                          ? "text-amber-600"
                          : (seoTitle || title).length < 30
                          ? "text-gray-400"
                          : "text-emerald-600"
                      }`}
                    >
                      {(seoTitle || title).length} / 60 chars (Recommended: 50-60)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "SEO Meta Title Tag..."}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Leave blank to automatically use the main article title.
                  </p>
                </div>

                {/* Custom SEO Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      SEO Meta Description
                    </label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        (seoDescription || excerpt).length > 160
                          ? "text-amber-600"
                          : (seoDescription || excerpt).length < 70
                          ? "text-gray-400"
                          : "text-emerald-600"
                      }`}
                    >
                      {(seoDescription || excerpt).length} / 160 chars (Recommended: 150-160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={excerpt || "Summarize this article for search engine results..."}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Shows in Google search results snippet under the blue title.
                  </p>
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Canonical URL (rel="canonical")
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`https://retoolmaster.com/#blog/${slug || "article-slug"}`}
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Prevents duplicate content issues by explicitly telling Google the original URL authority source.
                  </p>
                </div>

                {/* Schema Markup Type & Robots Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Schema.org Structured Data
                    </label>
                    <select
                      value={schemaType}
                      onChange={(e) => setSchemaType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3] bg-white font-medium"
                    >
                      <option value="BlogPosting">BlogPosting (Recommended)</option>
                      <option value="Article">Article (Standard)</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="TechArticle">TechArticle (Technical Guide)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Search Engine Robots Tag
                    </label>
                    <select
                      value={noIndex ? "noindex, follow" : robotsDirective}
                      onChange={(e) => {
                        const val = e.target.value as RobotsDirective;
                        setRobotsDirective(val);
                        setNoIndex(val.includes("noindex"));
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3] bg-white font-medium"
                    >
                      <option value="index, follow">index, follow (Allow Indexing & Links)</option>
                      <option value="noindex, follow">noindex, follow (Do Not Index)</option>
                      <option value="index, nofollow">index, nofollow</option>
                      <option value="noindex, nofollow">noindex, nofollow</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* On-Page SEO Checklist Column */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>SEO Audit Checklist</span>
                  </h4>
                  <span className="text-xs font-bold text-[#0984E3]">
                    {seoAudit.checks.filter((c) => c.passed).length}/{seoAudit.checks.length} Pass
                  </span>
                </div>

                <div className="space-y-3">
                  {seoAudit.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        chk.passed
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {chk.passed ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              chk.passed ? "text-emerald-900" : "text-amber-900"
                            }`}
                          >
                            {chk.title}
                          </div>
                          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                            {chk.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Schema JSON-LD Preview Accordion */}
                <div className="pt-3 border-t border-gray-100">
                  <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                    Auto-Injected JSON-LD Schema
                  </span>
                  <pre className="p-2.5 rounded-lg bg-gray-900 text-gray-200 text-[10px] font-mono overflow-x-auto max-h-36">
{`{
  "@context": "https://schema.org",
  "@type": "${schemaType}",
  "headline": "${currentMetaTitle.replace(/"/g, '\\"')}",
  "description": "${currentMetaDesc.replace(/"/g, '\\"')}",
  "image": "${featuredImage}",
  "author": { "@type": "Person", "name": "${authorName}" },
  "datePublished": "${editingPost.publishedAt}",
  "mainEntityOfPage": "${currentCanonicalUrl}"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 3: MULTI-PLATFORM AD MONETIZATION */}
        {/* ========================================================================= */}
        {editorSubTab === "monetization" && (
          <div className="space-y-6">
            {/* Monetization Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-white" />
                  <h3 className="text-base sm:text-lg font-bold">
                    Multi-Platform Ad Monetization Studio
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
                  Google AdSense ke sth sth Media.net, Ezoic, Monetag, PropellerAds ya custom native ad codes is article mein live integrate karein.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setInArticleAdEnabled(!inArticleAdEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inArticleAdEnabled
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {inArticleAdEnabled ? "✓ Monetization Active" : "✕ Monetization Disabled"}
                </button>
              </div>
            </div>

            {/* Quick 1-Click Ad Network Selector */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Choose Ad Network / Platform Preset
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click any network to auto-fill standard verified responsive code snippets.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0984E3] border border-blue-100">
                  Multi-Network Support
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(AD_NETWORK_TEMPLATES).map(([key, item]) => {
                  const isSelected = inArticleAdProvider === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectAdNetwork(key)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#0984E3] bg-blue-50/50 shadow-2xs ring-2 ring-[#0984E3]/20"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-900">{item.name}</div>
                      <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-[#0984E3]">
                        {isSelected ? "● Selected" : "Use Template"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Input & Placement Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ad Code Box */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#0984E3]" />
                    <span>In-Article Ad HTML / Script Code</span>
                  </label>
                  <span className="text-[11px] text-gray-500">
                    Supports &lt;ins&gt;, &lt;script&gt;, &lt;div&gt;, &lt;img&gt;, or banners
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={inArticleAdHtml}
                  onChange={(e) => setInArticleAdHtml(e.target.value)}
                  placeholder="Paste your ad unit code snippet here..."
                  className="w-full p-3 font-mono text-xs text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0984E3] focus:bg-white"
                />

                <p className="text-[11px] text-gray-500">
                  Tip: For Google AdSense, paste the complete <code>&lt;ins class="adsbygoogle" ...&gt;</code> snippet provided in your AdSense console.
                </p>
              </div>

              {/* Placement & Rules Column */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-xs space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    In-Article Ad Position
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "all", label: "All Positions (Top, Mid & Bottom)", desc: "Maximum revenue & impressions" },
                      { id: "top", label: "Top of Article", desc: "Above headline/introduction" },
                      { id: "mid", label: "Middle of Content", desc: "After paragraph 2-3" },
                      { id: "bottom", label: "Bottom of Article", desc: "After conclusion" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAdPlacementPosition(p.id as any)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          adPlacementPosition === p.id
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <div className="text-xs">{p.label}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ad Server Status</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    When visitors read this article at <code>/#blog/{slug || "..."}</code>, the ad slots will render automatically according to your position rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW: ARTICLES DASHBOARD & TABLE
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-white" />
            <h2 className="text-lg sm:text-xl font-bold">Classique Editorial & Articles Manager</h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Google On-Page SEO, Meta tags, Google SERP previews aur AdSense / multi-network ad slots ke sath articles manage karein.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-5 py-2.5 rounded-lg bg-white text-[#0984E3] hover:bg-blue-50 text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{saveErrorMsg}</span>
        </div>
      )}

      {/* Articles List / Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0F172A]">All Published & Draft Guides</h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0984E3] font-bold text-xs">
              {blogs.length} Total
            </span>
          </div>

          <div className="text-xs text-gray-500 font-mono">
            Firestore Database Connected
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading articles...</div>
        ) : blogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <p>No articles found. Click "Write New Article" to start!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {blogs.map((post) => (
              <div
                key={post.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          post.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0984E3] border border-blue-100">
                        {post.category}
                      </span>
                      {post.focusKeyword && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          KW: {post.focusKeyword}
                        </span>
                      )}
                      {post.inArticleAdEnabled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                          Ads: {post.inArticleAdProvider?.toUpperCase() || "ADSENSE"}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A] truncate">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                      <span>By {post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{post.views || 0} views</span>
                      <span>•</span>
                      <span className="font-mono text-gray-400">/#blog/{post.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <a
                    href={`/#blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-500 hover:text-[#0984E3] hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Live Article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleStartEdit(post)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit On-Page SEO & Content"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
