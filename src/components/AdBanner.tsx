import React, { useEffect } from "react";
import { AdItem, AdPlacement } from "../types";
import { ExternalLink, Sparkles, X } from "lucide-react";

interface AdBannerProps {
  placement: AdPlacement;
  ads: AdItem[];
  onDismiss?: (adId: string) => void;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  placement,
  ads,
  onDismiss,
  className = "",
}) => {
  const [dismissedIds, setDismissedIds] = React.useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("dismissed_ads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const matchingAds = ads.filter(
    (a) => a.placement === placement && a.enabled && !dismissedIds.includes(a.id)
  );

  const ad = matchingAds[0];

  useEffect(() => {
    if (ad?.type === "custom_html" && ad.customHtml) {
      // Execute any script tags inside custom html safely
      try {
        const container = document.getElementById(`custom-ad-${ad.id}`);
        if (container) {
          const scripts = container.getElementsByTagName("script");
          for (let i = 0; i < scripts.length; i++) {
            const script = document.createElement("script");
            if (scripts[i].src) {
              script.src = scripts[i].src;
            } else {
              script.textContent = scripts[i].textContent;
            }
            document.head.appendChild(script);
          }
        }
      } catch (e) {
        console.warn("Could not execute ad script:", e);
      }
    }
  }, [ad]);

  if (!ad) return null;

  const handleAdClick = () => {
    // Fire click tracking beacon
    try {
      fetch("/api/ads/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id }),
      }).catch(() => {});
    } catch {
      // Ignore network failure
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, ad.id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem("dismissed_ads", JSON.stringify(updated));
    } catch {}
    if (onDismiss) onDismiss(ad.id);
  };

  // 1. TOP BANNER PLACEMENT
  if (placement === "top_banner") {
    if (ad.type === "custom_html" && ad.customHtml) {
      return (
        <div className={`w-full bg-[#F8F9FA] border-b border-[#E9ECEF] py-2 px-4 ${className}`}>
          <div
            id={`custom-ad-${ad.id}`}
            dangerouslySetInnerHTML={{ __html: ad.customHtml }}
            className="flex justify-center items-center"
          />
        </div>
      );
    }

    return (
      <div
        className={`w-full bg-gradient-to-r from-[#0984E3] to-[#0873C4] text-white py-2 px-4 shadow-sm relative z-20 flex items-center justify-between transition-all ${className}`}
      >
        <div className="flex-1 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium flex-wrap text-center">
          {ad.badgeText && (
            <span className="px-2 py-0.5 rounded bg-white/20 text-white font-semibold text-[11px] uppercase tracking-wider">
              {ad.badgeText}
            </span>
          )}
          <span>{ad.title}</span>
          {ad.description && (
            <span className="hidden md:inline text-white/80 font-normal">
              — {ad.description}
            </span>
          )}
          {ad.targetUrl && (
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleAdClick}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white text-[#0984E3] hover:bg-white/90 text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <span>{ad.buttonText || "Learn More"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white p-1 rounded transition-colors ml-2 cursor-pointer"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. SIDEBAR AD PLACEMENT
  if (placement === "sidebar") {
    if (ad.type === "custom_html" && ad.customHtml) {
      return (
        <div
          id={`custom-ad-${ad.id}`}
          dangerouslySetInnerHTML={{ __html: ad.customHtml }}
          className={`p-3 bg-white border border-[#E9ECEF] rounded-lg ${className}`}
        />
      );
    }

    return (
      <div
        className={`p-3 bg-gradient-to-b from-white to-[#F8F9FA] border border-[#E9ECEF] rounded-lg text-left shadow-xs transition-all hover:border-[#0984E3]/40 ${className}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#636E72] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            {ad.badgeText || "Sponsor"}
          </span>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {ad.imageUrl && (
          <a
            href={ad.targetUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleAdClick}
            className="block mb-2 overflow-hidden rounded border border-[#E9ECEF] bg-gray-100"
          >
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </a>
        )}

        <h4 className="text-xs font-semibold text-[#2D3436] line-clamp-2 mb-1">
          {ad.title}
        </h4>
        {ad.description && (
          <p className="text-[11px] text-[#636E72] line-clamp-2 mb-2 leading-relaxed">
            {ad.description}
          </p>
        )}

        {ad.targetUrl && (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleAdClick}
            className="w-full py-1.5 px-2.5 bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span>{ad.buttonText || "Visit Sponsor"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  // 3. TOOL / WORKSPACE BOTTOM BANNER PLACEMENT
  if (placement === "tool_banner") {
    if (ad.type === "custom_html" && ad.customHtml) {
      return (
        <div
          id={`custom-ad-${ad.id}`}
          dangerouslySetInnerHTML={{ __html: ad.customHtml }}
          className={`w-full my-6 p-4 bg-white border border-[#E9ECEF] rounded-xl flex justify-center ${className}`}
        />
      );
    }

    return (
      <div
        className={`w-full my-6 bg-white border border-[#E9ECEF] rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all hover:border-[#0984E3]/30 ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {ad.imageUrl && (
            <div className="w-full sm:w-44 h-24 shrink-0 rounded-lg overflow-hidden border border-[#E9ECEF] bg-gray-50">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                {ad.badgeText || "Recommended Partner"}
              </span>
              <span className="text-[11px] text-[#636E72]">Verified SEO Resource</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#2D3436] mb-1">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-xs text-[#636E72] leading-relaxed max-w-2xl">
                {ad.description}
              </p>
            )}
          </div>
          {ad.targetUrl && (
            <div className="shrink-0 w-full sm:w-auto">
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={handleAdClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0984E3] hover:bg-[#0873C4] text-white text-xs font-semibold transition-all shadow-xs"
              >
                <span>{ad.buttonText || "Learn More"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. FOOTER BANNER
  if (placement === "footer_banner") {
    return (
      <div className={`w-full bg-[#F8F9FA] border-t border-[#E9ECEF] py-3 px-4 text-center text-xs text-[#636E72] ${className}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">
              {ad.badgeText || "AD"}
            </span>
            <span className="font-medium text-[#2D3436]">{ad.title}</span>
            {ad.description && <span className="hidden sm:inline text-[#636E72]">— {ad.description}</span>}
          </div>
          {ad.targetUrl && (
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleAdClick}
              className="text-[#0984E3] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>{ad.buttonText || "Visit"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return null;
};
