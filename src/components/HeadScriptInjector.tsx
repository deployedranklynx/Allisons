import React, { useEffect } from "react";
import { ActiveTab, SiteCustomization, DEFAULT_PAGE_SEO_CONFIGS } from "../types";

interface HeadScriptInjectorProps {
  siteSettings: SiteCustomization;
  activeTab?: ActiveTab;
}

function setMetaTag(selector: string, attrName: string, attrVal: string, content: string) {
  if (!content) return;
  let el = document.querySelector(selector) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonicalTag(url: string) {
  if (!url) return;
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export const HeadScriptInjector: React.FC<HeadScriptInjectorProps> = ({
  siteSettings,
  activeTab = "landing",
}) => {
  // 1. Dynamic On-Page SEO per Page & Tool
  useEffect(() => {
    // Resolve current page SEO config
    const currentTabKey = activeTab === "admin-ads" ? "landing" : activeTab;
    const pageSeoMap = siteSettings.pageSeo || DEFAULT_PAGE_SEO_CONFIGS;
    const seo = pageSeoMap[currentTabKey] || DEFAULT_PAGE_SEO_CONFIGS[currentTabKey] || DEFAULT_PAGE_SEO_CONFIGS.landing;

    if (!seo) return;

    // 1A. Page Title
    if (seo.metaTitle) {
      document.title = seo.metaTitle;
    }

    // 1B. Standard SEO Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", seo.metaDescription);
    const fullKeywords = [seo.focusKeywords, seo.secondaryKeywords].filter(Boolean).join(", ");
    if (fullKeywords) {
      setMetaTag('meta[name="keywords"]', "name", "keywords", fullKeywords);
    }
    setMetaTag('meta[name="robots"]', "name", "robots", seo.robotsDirective || "index, follow");
    if (seo.author) {
      setMetaTag('meta[name="author"]', "name", "author", seo.author);
    }

    // 1C. Canonical Tag
    if (seo.canonicalUrl) {
      setCanonicalTag(seo.canonicalUrl);
    }

    // 1D. Open Graph Tags
    setMetaTag('meta[property="og:title"]', "property", "og:title", seo.metaTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", seo.metaDescription);
    setMetaTag('meta[property="og:type"]', "property", "og:type", seo.ogType || "website");
    if (seo.canonicalUrl) {
      setMetaTag('meta[property="og:url"]', "property", "og:url", seo.canonicalUrl);
    }
    if (seo.ogImageUrl) {
      setMetaTag('meta[property="og:image"]', "property", "og:image", seo.ogImageUrl);
    }
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", siteSettings.siteName || "RankLynx");

    // 1E. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", seo.twitterCard || "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", seo.metaTitle);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", seo.metaDescription);
    if (seo.ogImageUrl) {
      setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", seo.ogImageUrl);
    }

    // 1F. Structured Data / Schema Markup (application/ld+json)
    const jsonLdId = "ranklynx-dynamic-jsonld";
    let jsonLdScript = document.getElementById(jsonLdId) as HTMLScriptElement;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.id = jsonLdId;
      jsonLdScript.type = "application/ld+json";
      document.head.appendChild(jsonLdScript);
    }

    if (seo.customSchemaJson && seo.customSchemaJson.trim()) {
      jsonLdScript.textContent = seo.customSchemaJson.trim();
    } else {
      let schemaObject: any = null;
      if (seo.schemaType === "SoftwareApplication" || seo.schemaType === "WebApplication") {
        schemaObject = {
          "@context": "https://schema.org",
          "@type": seo.schemaType,
          "name": seo.metaTitle,
          "description": seo.metaDescription,
          "applicationCategory": "SEOApplication",
          "operatingSystem": "All modern browsers",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
          "url": seo.canonicalUrl,
          "image": seo.ogImageUrl,
        };
      } else if (seo.schemaType === "Article") {
        schemaObject = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": seo.metaTitle,
          "description": seo.metaDescription,
          "author": {
            "@type": "Organization",
            "name": seo.author || siteSettings.siteName || "RankLynx",
          },
          "publisher": {
            "@type": "Organization",
            "name": siteSettings.siteName || "RankLynx",
          },
          "url": seo.canonicalUrl,
          "image": seo.ogImageUrl,
        };
      } else {
        schemaObject = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteSettings.siteName || "RankLynx",
          "headline": seo.metaTitle,
          "description": seo.metaDescription,
          "url": seo.canonicalUrl,
        };
      }
      jsonLdScript.textContent = JSON.stringify(schemaObject, null, 2);
    }
  }, [activeTab, siteSettings.pageSeo, siteSettings.siteName]);

  // 2. AdSense, Search Console & Custom Scripts Injection
  useEffect(() => {
    const injectedElements: HTMLElement[] = [];

    // 2A. Google AdSense Publisher Account Meta Tag
    if (siteSettings.adsensePublisherId) {
      let cleanPubId = siteSettings.adsensePublisherId.trim();
      if (!cleanPubId.startsWith("ca-pub-") && !cleanPubId.startsWith("pub-")) {
        cleanPubId = `ca-pub-${cleanPubId}`;
      }

      let adsenseMeta = document.querySelector('meta[name="google-adsense-account"]') as HTMLMetaElement;
      if (!adsenseMeta) {
        adsenseMeta = document.createElement("meta");
        adsenseMeta.setAttribute("name", "google-adsense-account");
        document.head.appendChild(adsenseMeta);
        injectedElements.push(adsenseMeta);
      }
      adsenseMeta.setAttribute("content", cleanPubId);

      const existingScript = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
      if (!existingScript) {
        const adsenseScript = document.createElement("script");
        adsenseScript.setAttribute("async", "true");
        adsenseScript.setAttribute(
          "src",
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cleanPubId}`
        );
        adsenseScript.setAttribute("crossorigin", "anonymous");
        document.head.appendChild(adsenseScript);
        injectedElements.push(adsenseScript);
      }
    }

    // 2B. Google Search Console / Site Verification Meta Tag
    if (siteSettings.googleSiteVerification) {
      let code = siteSettings.googleSiteVerification.trim();
      const match = code.match(/content=["']([^"']+)["']/i);
      if (match) {
        code = match[1];
      }

      let googleMeta = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement;
      if (!googleMeta) {
        googleMeta = document.createElement("meta");
        googleMeta.setAttribute("name", "google-site-verification");
        document.head.appendChild(googleMeta);
        injectedElements.push(googleMeta);
      }
      googleMeta.setAttribute("content", code);
    }

    // 2C. Bing Webmaster Verification Meta Tag
    if (siteSettings.bingSiteVerification) {
      let code = siteSettings.bingSiteVerification.trim();
      const match = code.match(/content=["']([^"']+)["']/i);
      if (match) {
        code = match[1];
      }

      let bingMeta = document.querySelector('meta[name="msvalidate.01"]') as HTMLMetaElement;
      if (!bingMeta) {
        bingMeta = document.createElement("meta");
        bingMeta.setAttribute("name", "msvalidate.01");
        document.head.appendChild(bingMeta);
        injectedElements.push(bingMeta);
      }
      bingMeta.setAttribute("content", code);
    }

    // 2D. Custom Head Code
    const customHeadContainerId = "ranklynx-custom-head-container";
    let existingHeadContainer = document.getElementById(customHeadContainerId);
    if (existingHeadContainer) {
      existingHeadContainer.remove();
    }

    if (siteSettings.customHeadCode && siteSettings.customHeadCode.trim()) {
      const container = document.createElement("div");
      container.id = customHeadContainerId;
      container.style.display = "none";
      container.innerHTML = siteSettings.customHeadCode.trim();

      const scripts = container.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      document.head.appendChild(container);
      injectedElements.push(container);
    }

    // 2E. Custom Body Code
    const customBodyContainerId = "ranklynx-custom-body-container";
    let existingBodyContainer = document.getElementById(customBodyContainerId);
    if (existingBodyContainer) {
      existingBodyContainer.remove();
    }

    if (siteSettings.customBodyCode && siteSettings.customBodyCode.trim()) {
      const container = document.createElement("div");
      container.id = customBodyContainerId;
      container.style.display = "none";
      container.innerHTML = siteSettings.customBodyCode.trim();

      const scripts = container.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      document.body.appendChild(container);
      injectedElements.push(container);
    }

    return () => {
      const headC = document.getElementById(customHeadContainerId);
      if (headC) headC.remove();
      const bodyC = document.getElementById(customBodyContainerId);
      if (bodyC) bodyC.remove();
    };
  }, [
    siteSettings.adsensePublisherId,
    siteSettings.googleSiteVerification,
    siteSettings.bingSiteVerification,
    siteSettings.customHeadCode,
    siteSettings.customBodyCode,
  ]);

  return null;
};
