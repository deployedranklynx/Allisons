import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

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
