import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AnalysisResult } from "@/lib/schemas";
import { clearSaved, hashText, loadSaved, save, STORAGE_KEY, type SavedState } from "@/lib/storage";

/** A real in-memory implementation of the Web Storage interface. */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const RESULT: AnalysisResult = {
  summary: "A job posting.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: "Prepare a CV in PDF format",
      group: "required",
      whyItMatters: "It is required.",
      sourceExcerpt: "Please submit your CV in PDF format.",
      deadline: null,
      evidence: "found",
    },
  ],
};

function state(overrides: Partial<SavedState> = {}): SavedState {
  return {
    version: 1,
    savedAt: "2026-10-23T10:00:00.000Z",
    textHash: "abc123",
    result: RESULT,
    completedIds: ["item-1"],
    ...overrides,
  };
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe("save and loadSaved", () => {
  test("a saved state loads back unchanged", () => {
    save(state(), storage);
    expect(loadSaved(storage)).toEqual(state());
  });

  test("nothing saved loads as null", () => {
    expect(loadSaved(storage)).toBeNull();
  });

  test("corrupt JSON is discarded and removed", () => {
    storage.setItem(STORAGE_KEY, "{not json");
    expect(loadSaved(storage)).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("a saved value from another version is discarded", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state(), version: 2 }));
    expect(loadSaved(storage)).toBeNull();
  });

  test("a saved value with the wrong shape is discarded", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state(), result: { summary: 42 } }));
    expect(loadSaved(storage)).toBeNull();
  });

  test("the saved value never contains the document text, only its hash", () => {
    save(state({ textHash: "deadbeef" }), storage);
    const raw = storage.getItem(STORAGE_KEY)!;
    expect(raw).toContain("deadbeef");
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(["completedIds", "result", "savedAt", "textHash", "version"]);
  });

  test("storage that throws (private mode) is handled quietly", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(() => save(state(), broken)).not.toThrow();
    expect(loadSaved(broken)).toBeNull();
    expect(() => clearSaved(broken)).not.toThrow();
  });
});

describe("clearSaved", () => {
  test("removes the saved state", () => {
    save(state(), storage);
    clearSaved(storage);
    expect(loadSaved(storage)).toBeNull();
  });
});

describe("hashText", () => {
  test("is the SHA-256 hex digest of the text", async () => {
    expect(await hashText("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("differs for different text", async () => {
    expect(await hashText("CV in PDF")).not.toBe(await hashText("CV in Word"));
  });

  describe("on a non-secure page (http:// on a network address), where crypto.subtle is missing", () => {
    afterEach(() => vi.unstubAllGlobals());

    test("still returns the same SHA-256 digest", async () => {
      vi.stubGlobal("crypto", {});
      expect(await hashText("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    test("matches the built-in digest for longer, non-ASCII text", async () => {
      const text = `Applications close on 15 November 2026 — CV “in PDF” ✓\n${"x".repeat(1000)}`;
      const native = await hashText(text);
      vi.stubGlobal("crypto", {});
      expect(await hashText(text)).toBe(native);
    });
  });
});
