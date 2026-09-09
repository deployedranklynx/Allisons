// IndexedDB Storage Manager for PDF Editor Projects
export interface SavedPdfProject {
  id: string;
  name: string;
  savedAt: string;
  pageCount: number;
  pdfDataUrl: string; // Base64 representation of original PDF
  pagesData: {
    pageIndex: number;
    rotation: number;
    textOverlays: Array<{
      id: string;
      text: string;
      x: number; // percentage (0-100) or pt
      y: number; // percentage (0-100) or pt
      fontSize: number;
      fontFamily: string;
      color: string;
      bgColor?: string;
      bold?: boolean;
      italic?: boolean;
    }>;
    whiteouts: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
    }>;
    drawings: Array<{
      id: string;
      points: Array<{ x: number; y: number }>;
      color: string;
      width: number;
    }>;
    stamps: Array<{
      id: string;
      imageUrl: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }[];
}

const DB_NAME = "RankLynx_PdfEditor_DB";
const STORE_NAME = "saved_pdf_projects";
const DB_VERSION = 1;

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open PDF database"));
    };
  });
}

export async function savePdfProjectToDb(project: SavedPdfProject): Promise<boolean> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(project);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Falling back to localStorage for PDF draft:", err);
    try {
      // Fallback: store lightweight summary in localStorage
      const minimal = {
        ...project,
        pdfDataUrl: project.pdfDataUrl.length < 2000000 ? project.pdfDataUrl : "",
      };
      localStorage.setItem(`ranklynx_pdf_${project.id}`, JSON.stringify(minimal));
      return true;
    } catch {
      return false;
    }
  }
}

export async function getAllSavedPdfProjects(): Promise<SavedPdfProject[]> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result || []) as SavedPdfProject[];
        results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to load PDF projects from IndexedDB:", err);
    // Fallback: check localStorage
    const list: SavedPdfProject[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ranklynx_pdf_")) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          if (item?.id) list.push(item);
        } catch {}
      }
    }
    return list;
  }
}

export async function getSavedPdfProjectById(id: string): Promise<SavedPdfProject | null> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as SavedPdfProject) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem(`ranklynx_pdf_${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function deleteSavedPdfProject(id: string): Promise<boolean> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        localStorage.removeItem(`ranklynx_pdf_${id}`);
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(`ranklynx_pdf_${id}`);
    return true;
  }
}
