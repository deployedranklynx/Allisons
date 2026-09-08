import React, { useState, useEffect } from "react";
import { BlogPost } from "../types";
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
];

export function AdminBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Form state
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
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent(
      `<h2>Executive Overview</h2>\n<p>Write your detailed guide introduction here...</p>\n\n<blockquote>"Strategic search optimization demands consistency and analytical rigor."</blockquote>\n\n<h3>Core Principles</h3>\n<ul>\n  <li><strong>Point 1:</strong> Detail key algorithmic factor</li>\n  <li><strong>Point 2:</strong> Detail execution blueprint</li>\n</ul>`
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
    });
  };

  const handleStartEdit = (post: BlogPost) => {
    setIsNewPost(false);
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
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNewPost || !slug) {
      setSlug(generateSlug(val));
    }
  };

  // Calculate estimated read time
  const plainText = (content || "").replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeEst = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

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
    };

    try {
      // Direct Firebase Cloud Firestore Save
      const success = await saveFirebaseBlogPost(postPayload);
      if (success) {
        setSaveSuccessMsg(
          status === "published"
            ? "Article published live to the website!"
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
        setSaveSuccessMsg("Article deleted successfully.");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        await loadBlogs();
      } else {
        setSaveErrorMsg("Failed to delete post.");
      }
    } catch {
      setSaveErrorMsg("Error deleting article.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus = post.status === "published" ? "draft" : "published";
    try {
      await saveFirebaseBlogPost({
        ...post,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setSaveSuccessMsg(
        nextStatus === "published"
          ? `"${post.title}" is now LIVE on the website!`
          : `"${post.title}" moved to drafts.`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      await loadBlogs();
    } catch {
      setSaveErrorMsg("Failed to update status.");
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: EDITOR VIEW (CREATE OR EDIT)
  // --------------------------------------------------------------------------
  if (editingPost) {
    return (
      <div className="space-y-6">
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
                  <span>Firebase Live</span>
                </span>
              </h2>
              <p className="text-xs text-[#64748B]">
                {status === "published"
                  ? "Saving will immediately reflect live on the public site."
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

        {/* Editor Form Layout */}
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
                    /blog/
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
                instantly appear in the public Blog section.
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

            {/* Author Profile */}
            <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Author Attribution
              </h3>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Author Role / Title
                </label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => setAuthorAvatar(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0984E3]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: ARTICLES LIST / DIRECTORY
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0984E3]" />
            <span>Classique Editorial Articles</span>
            <span className="text-xs font-normal text-gray-500">
              ({blogs.length} articles)
            </span>
          </h2>
          <p className="text-xs text-[#64748B]">
            Create and edit in-depth guides with RichText formatting and featured
            images. Articles publish directly to the live site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0984E3] hover:bg-[#0873C4] rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </button>
        </div>
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

      {/* Articles Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-200">
          <div className="w-8 h-8 border-3 border-[#0984E3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading articles from Firebase Cloud...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 p-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#0F172A]">No Articles Created Yet</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Start publishing classical SEO guides to educate readers and attract organic search traffic.
          </p>
          <button
            onClick={handleStartCreate}
            className="px-4 py-2 bg-[#0984E3] text-white text-xs font-bold rounded-lg hover:bg-[#0873C4] transition-colors"
          >
            Create Your First Article
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-xs overflow-hidden">
          <div className="divide-y divide-gray-100">
            {blogs.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0984E3]">
                        {post.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.status === "published" ? "Live" : "Draft"}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-sm text-[#0F172A] truncate">
                      {post.title}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                      <span>By {post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span>{post.views || 0} views</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleStatus(post)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      post.status === "published"
                        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                    title="Toggle Publish / Draft"
                  >
                    {post.status === "published" ? "Unpublish" : "Publish Live"}
                  </button>

                  <button
                    onClick={() => handleStartEdit(post)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-[#0984E3] hover:text-[#0984E3] text-gray-700 bg-white transition-colors cursor-pointer"
                    title="Edit with RichText Editor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeletePost(post)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-red-500 hover:text-red-600 text-gray-400 bg-white transition-colors cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
