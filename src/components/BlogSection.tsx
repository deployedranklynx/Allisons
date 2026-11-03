import React, { useState, useEffect, useMemo, useRef } from "react";
import { BlogPost, AdItem } from "../types";
import {
  getFirebaseBlogs,
  incrementFirebaseBlogViews,
  ensureFirebaseBlogsInitialized,
} from "../lib/firebase";
import { AdBanner } from "./AdBanner";
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Search,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Bookmark,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

interface BlogSectionProps {
  ads?: AdItem[];
  onOpenApp?: () => void;
  initialSlug?: string | null;
}

// Dynamic Multi-Platform Ad Container (executes AdSense, Media.net, Ezoic, Monetag, PropellerAds, or HTML)
interface MultiNetworkAdSlotProps {
  htmlCode?: string;
  provider?: string;
  fallbackAds?: AdItem[];
  placementTitle?: string;
}

const MultiNetworkAdSlot: React.FC<MultiNetworkAdSlotProps> = ({
  htmlCode,
  provider = "adsense",
  fallbackAds = [],
  placementTitle = "Advertisement",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !htmlCode || !htmlCode.trim()) return;

    // Clean container first
    containerRef.current.innerHTML = "";

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlCode.trim();

    // Extract and re-inject script tags so browser executes them
    const scripts = Array.from(wrapper.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    containerRef.current.appendChild(wrapper);

    // If AdSense adsbygoogle exists, try triggering push safely
    if (htmlCode.includes("adsbygoogle")) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // Ignored if adsbygoogle already pushed
      }
    }
  }, [htmlCode]);

  // If no custom ad code was configured, fall back to global sponsored AdBanner
  if (!htmlCode || !htmlCode.trim()) {
    return (
      <div className="my-8">
        <AdBanner placement="tool_banner" ads={fallbackAds} />
      </div>
    );
  }

  return (
    <div className="my-8 p-4 rounded-2xl bg-gray-50/70 border border-gray-200 text-center overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-emerald-600" />
          <span>{placementTitle}</span>
        </span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
          {provider?.toUpperCase() || "SPONSOR"}
        </span>
      </div>
      <div ref={containerRef} className="flex justify-center items-center overflow-x-auto min-h-[90px]" />
    </div>
  );
};

// Helper to update SEO Meta and Canonical tags
function setOrUpdateMetaTag(name: string, content: string, isProperty = false) {
  if (!content) return;
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrUpdateCanonical(url: string) {
  if (!url) return;
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export function BlogSection({
  ads = [],
  onOpenApp,
  initialSlug,
}: BlogSectionProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Helper to extract slug from current hash if formatted like #blog/slug-name
  const detectHashSlug = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash.startsWith("blog/")) {
      return hash.replace("blog/", "").trim();
    }
    return null;
  };

  // Load blog posts from Firebase Cloud
  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        await ensureFirebaseBlogsInitialized();
        const posts = await getFirebaseBlogs();
        // Only show published articles to public viewers
        const publishedOnly = posts.filter((p) => p.status === "published");
        setBlogs(publishedOnly);

        const targetSlug = initialSlug || detectHashSlug();
        if (targetSlug) {
          const matched = publishedOnly.find(
            (p) => p.slug === targetSlug || p.id === targetSlug
          );
          if (matched) {
            setSelectedPost(matched);
            incrementFirebaseBlogViews(matched.id);
          }
        }
      } catch (err) {
        console.error("Failed to load blog posts:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPosts();
  }, [initialSlug]);

  // Synchronize dynamic On-Page SEO meta tags whenever an article is selected or closed
  useEffect(() => {
    if (selectedPost) {
      const siteBaseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://retoolmaster.com";
      const targetCanonical =
        selectedPost.canonicalUrl || `${siteBaseUrl}/#blog/${selectedPost.slug}`;
      const effectiveTitle = selectedPost.seoTitle || selectedPost.title;
      const effectiveDesc = selectedPost.seoDescription || selectedPost.excerpt;
      const effectiveKeywords =
        selectedPost.focusKeyword || selectedPost.tags?.join(", ") || "seo tools";

      // 1. Title
      document.title = `${effectiveTitle} | RetoolMaster Classique Editorial`;

      // 2. Standard Meta Tags
      setOrUpdateMetaTag("description", effectiveDesc);
      setOrUpdateMetaTag("keywords", effectiveKeywords);
      setOrUpdateMetaTag(
        "robots",
        selectedPost.noIndex
          ? "noindex, nofollow"
          : selectedPost.robotsDirective || "index, follow"
      );
      if (selectedPost.author?.name) {
        setOrUpdateMetaTag("author", selectedPost.author.name);
      }

      // 3. Canonical Tag
      setOrUpdateCanonical(targetCanonical);

      // 4. OpenGraph
      setOrUpdateMetaTag("og:title", effectiveTitle, true);
      setOrUpdateMetaTag("og:description", effectiveDesc, true);
      setOrUpdateMetaTag("og:type", "article", true);
      setOrUpdateMetaTag("og:url", targetCanonical, true);
      if (selectedPost.featuredImage) {
        setOrUpdateMetaTag("og:image", selectedPost.featuredImage, true);
      }

      // 5. Twitter Card
      setOrUpdateMetaTag("twitter:card", "summary_large_image");
      setOrUpdateMetaTag("twitter:title", effectiveTitle);
      setOrUpdateMetaTag("twitter:description", effectiveDesc);
      if (selectedPost.featuredImage) {
        setOrUpdateMetaTag("twitter:image", selectedPost.featuredImage);
      }

      // 6. Schema.org Article / BlogPosting JSON-LD
      const jsonLdId = "retoolmaster-article-jsonld";
      let scriptEl = document.getElementById(jsonLdId) as HTMLScriptElement;
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = jsonLdId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }

      const articleSchema = {
        "@context": "https://schema.org",
        "@type": selectedPost.schemaType || "BlogPosting",
        headline: selectedPost.title,
        description: effectiveDesc,
        image: selectedPost.featuredImage,
        author: {
          "@type": "Person",
          name: selectedPost.author.name,
          jobTitle: selectedPost.author.role || "SEO Strategist",
        },
        publisher: {
          "@type": "Organization",
          name: "RetoolMaster",
          url: siteBaseUrl,
        },
        datePublished: selectedPost.publishedAt,
        dateModified: selectedPost.updatedAt || selectedPost.publishedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": targetCanonical,
        },
      };

      scriptEl.textContent = JSON.stringify(articleSchema, null, 2);
    } else {
      // Clean up article schema when navigating back to index
      const scriptEl = document.getElementById("retoolmaster-article-jsonld");
      if (scriptEl) scriptEl.remove();
      document.title = "Classique Editorial Articles & Guides | RetoolMaster";
    }
  }, [selectedPost]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ["All", ...Array.from(set)];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((post) => {
      const matchCat =
        selectedCategory === "All" || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    return blogs.length > 0 ? blogs[0] : null;
  }, [blogs]);

  const otherBlogs = useMemo(() => {
    if (!featuredPost) return filteredBlogs;
    return filteredBlogs.filter((p) => p.id !== featuredPost.id);
  }, [filteredBlogs, featuredPost]);

  const handleSelectArticle = (post: BlogPost) => {
    setSelectedPost(post);
    incrementFirebaseBlogViews(post.id);
    if (typeof window !== "undefined") {
      window.location.hash = `blog/${post.slug}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToIndex = () => {
    setSelectedPost(null);
    if (typeof window !== "undefined") {
      window.location.hash = "blog";
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Extract H2 headings for Table of Contents
  const tableOfContents = useMemo(() => {
    if (!selectedPost?.content) return [];
    const matches = Array.from(
      selectedPost.content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)
    );
    return matches.map((m) => m[1].replace(/<[^>]*>/g, ""));
  }, [selectedPost]);

  // Determine In-Article Ad Placements for Selected Post
  const showTopAd =
    selectedPost?.inArticleAdEnabled !== false &&
    (selectedPost?.adPlacementPosition === "top" ||
      selectedPost?.adPlacementPosition === "all" ||
      !selectedPost?.adPlacementPosition);

  const showMidAd =
    selectedPost?.inArticleAdEnabled !== false &&
    (selectedPost?.adPlacementPosition === "mid" ||
      selectedPost?.adPlacementPosition === "all" ||
      !selectedPost?.adPlacementPosition);

  const showBottomAd =
    selectedPost?.inArticleAdEnabled !== false &&
    (selectedPost?.adPlacementPosition === "bottom" ||
      selectedPost?.adPlacementPosition === "all" ||
      !selectedPost?.adPlacementPosition);

  // --------------------------------------------------------------------------
  // VIEW: SINGLE ARTICLE CLASSICAL EDITORIAL VIEW
  // --------------------------------------------------------------------------
  if (selectedPost) {
    const relatedPosts = blogs
      .filter((p) => p.id !== selectedPost.id)
      .slice(0, 3);

    return (
      <div className="min-h-screen bg-[#FCFCFD] text-[#1E293B]">
        {/* Top Sponsor Banner */}
        <AdBanner placement="top_banner" ads={ads} />

        {/* Editorial Sub-Header / Breadcrumb */}
        <div className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              onClick={handleBackToIndex}
              className="flex items-center gap-2 text-xs font-semibold text-[#475569] hover:text-[#0984E3] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Editorial Index</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>On-Page SEO Verified</span>
              </span>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                title="Copy Article Link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Article Container */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          {/* Top In-Article Ad Placement */}
          {showTopAd && (
            <MultiNetworkAdSlot
              htmlCode={selectedPost.inArticleAdHtml}
              provider={selectedPost.inArticleAdProvider || "adsense"}
              fallbackAds={ads}
              placementTitle="Header Sponsored Unit"
            />
          )}

          {/* Category & Date Metadata */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0984E3] font-bold text-xs uppercase tracking-wider border border-blue-100">
              {selectedPost.category || "SEO Guide"}
            </span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(selectedPost.publishedAt)}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedPost.readTime || "5 min read"}</span>
            </div>
          </div>

          {/* Classical Display Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.2] mb-6">
            {selectedPost.title}
          </h1>

          {/* Lead Excerpt */}
          {selectedPost.excerpt && (
            <p className="text-lg sm:text-xl text-[#475569] font-sans leading-relaxed mb-8 border-l-2 border-[#0984E3] pl-4 italic">
              {selectedPost.excerpt}
            </p>
          )}

          {/* Author Byline Bar */}
          <div className="flex items-center justify-between py-4 border-y border-[#E2E8F0] mb-10">
            <div className="flex items-center gap-3">
              <img
                src={
                  selectedPost.author.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                }
                alt={selectedPost.author.name}
                className="w-11 h-11 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  {selectedPost.author.name}
                </p>
                <p className="text-xs text-[#64748B]">
                  {selectedPost.author.role || "SEO Editorial Team"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{selectedPost.views || 1} reads</span>
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {selectedPost.featuredImage && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-xs border border-gray-200">
              <img
                src={selectedPost.featuredImage}
                alt={selectedPost.title}
                className="w-full h-auto max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* Table of Contents (if 2+ headings exist) */}
          {tableOfContents.length >= 2 && (
            <div className="mb-10 p-5 rounded-xl bg-gray-50/80 border border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-[#0984E3]" />
                Contents In This Guide
              </p>
              <ul className="space-y-2 text-xs">
                {tableOfContents.map((heading, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#334155]">
                    <span className="text-[#0984E3] font-bold">0{i + 1}.</span>
                    <span className="hover:text-[#0984E3] transition-colors">
                      {heading}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Classical Rich Text Body */}
          <div
            className="prose prose-slate max-w-none font-serif text-[17px] leading-[1.8] text-[#24292E] 
            [&>h2]:font-sans [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-[#0F172A] [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:tracking-tight
            [&>h3]:font-sans [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-[#1E293B] [&>h3]:mt-8 [&>h3]:mb-3
            [&>p]:mb-6
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>ul>li]:font-sans
            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2 [&>ol>li]:font-sans
            [&>blockquote]:border-l-4 [&>blockquote]:border-[#0984E3] [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-gray-700 [&>blockquote]:my-8 [&>blockquote]:bg-blue-50/30 [&>blockquote]:py-3 [&>blockquote]:rounded-r-lg
            [&>pre]:bg-[#0F172A] [&>pre]:text-gray-100 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-6 [&>pre]:font-mono [&>pre]:text-xs
            [&>code]:bg-gray-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-xs [&>code]:text-[#0984E3]
            [&>figure]:my-8 [&>figure>img]:rounded-xl [&>figure>img]:border [&>figure>img]:border-gray-200 [&>figure>figcaption]:text-center [&>figure>figcaption]:text-xs [&>figure>figcaption]:text-gray-500 [&>figure>figcaption]:mt-2
            "
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />

          {/* Mid-Article Multi-Network Ad Placement */}
          {showMidAd && (
            <MultiNetworkAdSlot
              htmlCode={selectedPost.inArticleAdHtml}
              provider={selectedPost.inArticleAdProvider || "adsense"}
              fallbackAds={ads}
              placementTitle="In-Article Content Sponsor"
            />
          )}

          {/* Article Tags */}
          {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mr-1">
                <Tag className="w-3.5 h-3.5" />
                Tags:
              </span>
              {selectedPost.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Bottom In-Article Ad Placement */}
          {showBottomAd && (
            <MultiNetworkAdSlot
              htmlCode={selectedPost.inArticleAdHtml}
              provider={selectedPost.inArticleAdProvider || "adsense"}
              fallbackAds={ads}
              placementTitle="Recommended Sponsor Unit"
            />
          )}

          {/* Author Box */}
          <div className="mt-10 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={
                selectedPost.author.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              }
              alt={selectedPost.author.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#0984E3]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#0F172A]">
                  Written by {selectedPost.author.name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0984E3] font-bold">
                  Verified Contributor
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Specializing in search engine architecture, high-intent anchor
                analysis, and enterprise link equity auditing.
              </p>
            </div>
          </div>
        </article>

        {/* Related Classique Articles */}
        {relatedPosts.length > 0 && (
          <section className="bg-white border-t border-[#E2E8F0] py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                    Continue Reading
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    More tactical blueprints from the editorial team.
                  </p>
                </div>
                <button
                  onClick={handleBackToIndex}
                  className="text-xs font-semibold text-[#0984E3] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Browse all articles</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectArticle(post)}
                    className="group flex flex-col bg-[#FDFDFD] rounded-xl border border-[#E2E8F0] overflow-hidden hover:border-[#0984E3] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="h-40 overflow-hidden bg-gray-100 relative">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#0984E3]">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
                          <span>{formatDate(post.publishedAt)}</span>
                          <span>•</span>
                          <span>{post.readTime}</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[#0F172A] group-hover:text-[#0984E3] transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-[#0984E3] flex items-center gap-1 mt-4">
                        <span>Read Blueprint</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW: EDITORIAL INDEX / CATALOG
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Editorial Hero Header */}
      <div className="border-b border-[#E2E8F0] bg-white pb-12 pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0984E3] mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Classique Editorial & Search Intelligence</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A]">
                The Webmaster Dispatch
              </h1>
              <p className="mt-3 text-base text-[#475569] max-w-2xl leading-relaxed">
                Analytical case studies, algorithm insights, and rigorous link-building blueprints written for modern search professionals.
              </p>
            </div>

            {onOpenApp && (
              <button
                onClick={onOpenApp}
                className="px-5 py-2.5 rounded-xl bg-[#0984E3] text-white text-xs font-bold shadow-xs hover:bg-[#0770C2] transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <span>Launch Link Suite</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#0984E3] text-white shadow-2xs"
                      : "bg-gray-100 text-[#475569] hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search editorial guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0984E3] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="py-24 text-center text-gray-400 font-serif">
            Loading classical editorial archives...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 p-8">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No articles found</h3>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Hero Article */}
            {featuredPost && selectedCategory === "All" && !searchQuery && (
              <div
                onClick={() => handleSelectArticle(featuredPost)}
                className="group grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0984E3] hover:shadow-lg transition-all cursor-pointer p-6 sm:p-8"
              >
                <div className="lg:col-span-7 flex flex-col justify-between order-2 lg:order-1">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded bg-blue-50 text-[#0984E3] text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                        Featured Blueprint
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400 font-medium">
                        {formatDate(featuredPost.publishedAt)}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors leading-tight mb-4">
                      {featuredPost.title}
                    </h2>

                    <p className="text-sm sm:text-base text-[#475569] leading-relaxed line-clamp-3 mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          featuredPost.author.avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                        }
                        alt={featuredPost.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-[#0F172A]">
                        {featuredPost.author.name}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#0984E3] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Complete Guide</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 h-64 lg:h-auto rounded-xl overflow-hidden bg-gray-100 order-1 lg:order-2">
                  <img
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            )}

            {/* Mid Banner Sponsor in Index */}
            <AdBanner placement="top_banner" ads={ads} />

            {/* Grid of Other Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(selectedCategory === "All" && !searchQuery
                ? otherBlogs
                : filteredBlogs
              ).map((post) => (
                <article
                  key={post.id}
                  onClick={() => handleSelectArticle(post)}
                  className="group flex flex-col bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0984E3] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#0984E3]">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors line-clamp-2 leading-snug mb-3">
                        {post.title}
                      </h3>

                      <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-600">
                        {post.author.name}
                      </span>
                      <span className="font-bold text-[#0984E3] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
