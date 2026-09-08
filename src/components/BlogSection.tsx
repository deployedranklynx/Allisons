import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

interface BlogSectionProps {
  ads?: AdItem[];
  onOpenApp?: () => void;
  initialSlug?: string | null;
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

        if (initialSlug) {
          const matched = publishedOnly.find(
            (p) => p.slug === initialSlug || p.id === initialSlug
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // SINGLE ARTICLE CLASSICAL EDITORIAL VIEW
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
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-xs font-semibold text-[#475569] hover:text-[#0984E3] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Editorial Index</span>
            </button>

            <div className="flex items-center gap-2">
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

          {/* Mid-Article Ad Placement */}
          <div className="my-12">
            <AdBanner placement="tool_banner" ads={ads} />
          </div>

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
                    More tactical blueprints from the RankLynx editorial team.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-xs font-semibold text-[#0984E3] hover:underline flex items-center gap-1"
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

  // DIRECTORY / CLASSICAL EDITORIAL INDEX VIEW
  return (
    <div className="min-h-screen bg-[#FCFCFD] text-[#1E293B]">
      {/* Top Sponsor Announcement */}
      <AdBanner placement="top_banner" ads={ads} />

      {/* Editorial Classic Hero Banner */}
      <div className="bg-white border-b border-[#E2E8F0] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0984E3] text-xs font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>RankLynx Editorial Journal</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] max-w-2xl mx-auto leading-tight">
            The Masterclass Library of Advanced Search Engine Engineering
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#475569] max-w-xl mx-auto leading-relaxed">
            In-depth architectural breakdowns, anchor balance mathematics, and
            topical authority strategies crafted for technical webmasters.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search articles by keyword, anchor text, algorithm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-[#CBD5E1] rounded-xl focus:bg-white focus:outline-none focus:border-[#0984E3] focus:ring-2 focus:ring-[#0984E3]/15 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#0984E3] text-white shadow-xs"
                      : "bg-white border border-[#E2E8F0] text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#0984E3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">Loading classical journal entries...</p>
          </div>
        )}

        {!isLoading && filteredBlogs.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md mx-auto">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-[#0F172A]">No Articles Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No published articles matched your search query or selected category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Featured Hero Article Spotlight (When viewing All and no search) */}
        {!isLoading &&
          selectedCategory === "All" &&
          !searchQuery &&
          featuredPost && (
            <div className="mb-14">
              <div
                onClick={() => handleSelectArticle(featuredPost)}
                className="group relative bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0984E3] hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 cursor-pointer"
              >
                <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto overflow-hidden relative">
                  <img
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#0984E3] font-bold text-xs uppercase tracking-wider shadow-xs border border-white/50">
                      ★ Featured Masterclass
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
                      <span className="font-semibold text-[#0984E3]">
                        {featuredPost.category}
                      </span>
                      <span>•</span>
                      <span>{featuredPost.readTime}</span>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors leading-tight mb-4">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed line-clamp-3 mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          featuredPost.author.avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                        }
                        alt={featuredPost.author.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {featuredPost.author.name}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#0984E3] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Guide</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Article Grid */}
        {!isLoading && otherBlogs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <span>Recent Publications</span>
                <span className="text-xs font-sans font-normal text-gray-400">
                  ({otherBlogs.length} articles)
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherBlogs.map((post) => (
                <article
                  key={post.id}
                  onClick={() => handleSelectArticle(post)}
                  className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0984E3] hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer"
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-[#0984E3] shadow-2xs border border-white/60">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-[#0F172A] group-hover:text-[#0984E3] transition-colors leading-snug line-clamp-2 mb-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            post.author.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                          }
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                        <span className="text-[11px] font-medium text-gray-700 truncate max-w-[110px]">
                          {post.author.name}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#0984E3] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
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

        {/* In-Directory Sponsor Banner */}
        <div className="mt-16">
          <AdBanner placement="tool_banner" ads={ads} />
        </div>
      </div>
    </div>
  );
}
