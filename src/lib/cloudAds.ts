// Direct Firebase Cloud synchronization for Ads, Passkey & Settings
import {
  ensureFirebaseAdsInitialized,
  getFirebaseAdminSettings,
  updateFirebaseAdminSettings,
  getFirebaseAds,
  saveFirebaseAds,
  trackFirebaseAdClick,
  incrementFirebaseAdImpressions,
  ensureFirebaseSiteSettingsInitialized,
  getFirebaseSiteSettings,
  saveFirebaseSiteSettings,
  AdDoc,
} from "./firebase";
import { AdItem, AdPlacement, AdType, SiteCustomization, DEFAULT_SITE_CUSTOMIZATION } from "../types";

// Convert AdDoc to AdItem
function toAdItem(doc: AdDoc): AdItem {
  return {
    id: doc.id,
    placement: doc.placement as AdPlacement,
    type: doc.type as AdType,
    title: doc.title,
    description: doc.description,
    targetUrl: doc.targetUrl,
    imageUrl: doc.imageUrl,
    buttonText: doc.buttonText,
    badgeText: doc.badgeText,
    customHtml: doc.customHtml,
    enabled: doc.enabled,
    impressions: doc.impressions || 0,
    clicks: doc.clicks || 0,
  };
}

// Convert AdItem to AdDoc
function toAdDoc(item: AdItem): AdDoc {
  return {
    id: item.id,
    placement: item.placement,
    type: item.type,
    title: item.title,
    description: item.description || "",
    targetUrl: item.targetUrl || "",
    imageUrl: item.imageUrl,
    buttonText: item.buttonText,
    badgeText: item.badgeText,
    customHtml: item.customHtml,
    enabled: !!item.enabled,
    impressions: item.impressions || 0,
    clicks: item.clicks || 0,
  };
}

// Load public active ads from Firebase Cloud
export async function fetchCloudActiveAds(): Promise<{ globalEnabled: boolean; ads: AdItem[] }> {
  try {
    await ensureFirebaseAdsInitialized();
    const settings = await getFirebaseAdminSettings();
    if (!settings.globalEnabled) {
      return { globalEnabled: false, ads: [] };
    }
    const rawAds = await getFirebaseAds();
    const activeAds = rawAds.filter((a) => a.enabled).map(toAdItem);

    // Track impressions in background
    const adIds = activeAds.map((a) => a.id);
    if (adIds.length > 0) {
      incrementFirebaseAdImpressions(adIds);
    }

    return {
      globalEnabled: true,
      ads: activeAds,
    };
  } catch (err) {
    console.error("fetchCloudActiveAds error:", err);
    return { globalEnabled: true, ads: [] };
  }
}

// Track ad click directly to Firebase Cloud
export async function recordCloudAdClick(adId: string) {
  try {
    await trackFirebaseAdClick(adId);
  } catch (err) {
    console.error("recordCloudAdClick error:", err);
  }
}

// Verify Admin Passkey against Firebase Cloud
export async function verifyCloudAdminPasskey(passkey: string): Promise<boolean> {
  try {
    await ensureFirebaseAdsInitialized();
    const settings = await getFirebaseAdminSettings();
    const cleanKey = passkey.trim();
    // Verify against Firestore cloud passkey (or initial default admin123)
    return cleanKey === (settings.adminPasskey || "admin123");
  } catch (err) {
    console.error("verifyCloudAdminPasskey error:", err);
    // Fallback: if network or cloud initialization delay, default passkey works
    return passkey.trim() === "admin123";
  }
}

// Fetch complete ads configuration for Admin Panel from Firebase Cloud
export async function fetchCloudAdminConfig(): Promise<{
  globalEnabled: boolean;
  adminPasskey: string;
  ads: AdItem[];
}> {
  try {
    await ensureFirebaseAdsInitialized();
    const settings = await getFirebaseAdminSettings();
    const rawAds = await getFirebaseAds();
    return {
      globalEnabled: settings.globalEnabled ?? true,
      adminPasskey: settings.adminPasskey || "admin123",
      ads: rawAds.map(toAdItem),
    };
  } catch (err) {
    console.error("fetchCloudAdminConfig error:", err);
    return {
      globalEnabled: true,
      adminPasskey: "admin123",
      ads: [],
    };
  }
}

// Save complete ads configuration to Firebase Cloud
export async function saveCloudAdminConfig(params: {
  globalEnabled: boolean;
  ads: AdItem[];
  newPasskey?: string;
}): Promise<boolean> {
  try {
    await ensureFirebaseAdsInitialized();
    const docs = params.ads.map(toAdDoc);
    await saveFirebaseAds(docs);
    await updateFirebaseAdminSettings(params.newPasskey, params.globalEnabled);
    return true;
  } catch (err) {
    console.error("saveCloudAdminConfig error:", err);
    return false;
  }
}

// Fetch complete site customization & settings (Header, Footer, ads.txt, AdSense code)
export async function fetchCloudSiteSettings(): Promise<SiteCustomization> {
  try {
    await ensureFirebaseSiteSettingsInitialized();
    const settings = await getFirebaseSiteSettings();
    return settings;
  } catch (err) {
    console.error("fetchCloudSiteSettings error:", err);
    return DEFAULT_SITE_CUSTOMIZATION;
  }
}

// Save site customization & settings to Firebase Cloud
export async function saveCloudSiteSettings(
  settings: Partial<SiteCustomization>
): Promise<boolean> {
  try {
    await ensureFirebaseSiteSettingsInitialized();
    const success = await saveFirebaseSiteSettings(settings);
    // Also sync to local backend if available
    try {
      await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer cloud_admin_token",
        },
        body: JSON.stringify(settings),
      });
    } catch {
      // Non-blocking local sync
    }
    return success;
  } catch (err) {
    console.error("saveCloudSiteSettings error:", err);
    return false;
  }
}

