import React, { useEffect } from "react";
import { SiteCustomization } from "../types";

interface HeadScriptInjectorProps {
  siteSettings: SiteCustomization;
}

export const HeadScriptInjector: React.FC<HeadScriptInjectorProps> = ({ siteSettings }) => {
  useEffect(() => {
    const injectedElements: HTMLElement[] = [];

    // 1. Google AdSense Publisher Account Meta Tag
    if (siteSettings.adsensePublisherId) {
      let cleanPubId = siteSettings.adsensePublisherId.trim();
      if (!cleanPubId.startsWith("ca-pub-") && !cleanPubId.startsWith("pub-")) {
        cleanPubId = `ca-pub-${cleanPubId}`;
      }

      // Check or create meta tag
      let adsenseMeta = document.querySelector('meta[name="google-adsense-account"]') as HTMLMetaElement;
      if (!adsenseMeta) {
        adsenseMeta = document.createElement("meta");
        adsenseMeta.setAttribute("name", "google-adsense-account");
        document.head.appendChild(adsenseMeta);
        injectedElements.push(adsenseMeta);
      }
      adsenseMeta.setAttribute("content", cleanPubId);

      // Injected Google AdSense Auto-Ads Script if enabled or pub ID provided
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

    // 2. Google Search Console / Site Verification Meta Tag
    if (siteSettings.googleSiteVerification) {
      let code = siteSettings.googleSiteVerification.trim();
      // If user pasted full tag `<meta name="google-site-verification" content="XYZ" />`, extract content
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

    // 3. Bing Webmaster Verification Meta Tag
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

    // 4. Custom Head Code (Ad tags, verification tags, Google Tag Manager, custom HTML)
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

      // For any scripts in customHeadCode, browsers won't auto-execute innerHTML scripts, so re-create them
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

    // 5. Custom Body Code (bottom-of-page scripts, widgets, trackers)
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
      // Clean up injected dynamic head/body containers if needed on unmount
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
