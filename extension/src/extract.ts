/**
 * Runs inside the web page (injected by chrome.scripting.executeScript only after the user clicks
 * "Analyze this page"). Chrome serializes this function's source, so it must be completely
 * self-contained: no imports and no references to anything outside its own body.
 *
 * It returns the page's main readable text, skipping navigation, sidebars, footers, cookie banners,
 * ads, share bars, scripts, and anything hidden. Cleanup of whitespace happens later in the popup.
 */
// `doc` defaults to the page's own document: executeScript can only pass JSON arguments, so the
// default is evaluated inside the page. Tests pass a document explicitly.
export function extractMainText(doc: Document = document): string {
  const ELEMENT = 1;
  const TEXT = 3;
  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "SVG", "CANVAS", "VIDEO", "AUDIO", "OBJECT",
    "NAV", "ASIDE", "FORM", "BUTTON", "SELECT", "INPUT", "TEXTAREA", "DIALOG", "IMG",
  ]);
  const SKIP_ROLES = new Set(["navigation", "complementary", "contentinfo", "search", "dialog", "alertdialog", "menu", "menubar"]);
  const NOISE_WORDS = new Set([
    "nav", "navbar", "navigation", "menu", "breadcrumb", "breadcrumbs", "footer", "sidebar", "cookie", "cookies",
    "consent", "gdpr", "ad", "ads", "advert", "advertisement", "sponsored", "promo", "social", "share", "sharing",
    "newsletter", "subscribe", "related", "comments", "popup", "modal",
  ]);
  const BLOCK_TAGS = new Set([
    "P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "UL", "OL", "LI", "DL", "DT", "DD",
    "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "TR", "BLOCKQUOTE", "PRE", "FIGURE", "FIGCAPTION", "ADDRESS", "HR",
  ]);

  const isNoise = (el: Element): boolean => {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return true;
    const role = el.getAttribute("role");
    if (role && SKIP_ROLES.has(role)) return true;
    // A page-level header/footer is chrome; one inside the main content (an article's title) is content.
    if ((el.tagName === "HEADER" || el.tagName === "FOOTER" || role === "banner") && !el.parentElement?.closest("main, article, [role='main']")) {
      return true;
    }
    const words = `${el.id} ${typeof el.className === "string" ? el.className : ""}`.toLowerCase().split(/[\s_-]+/);
    return words.some((word) => NOISE_WORDS.has(word));
  };

  const isVisible = (el: Element): boolean => {
    const style = doc.defaultView?.getComputedStyle(el);
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    const check = (el as Element & { checkVisibility?: () => boolean }).checkVisibility;
    return typeof check === "function" ? check.call(el) : true;
  };

  const textLength = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim().length;

  // The largest main-content candidate wins; tiny or missing ones fall back to the whole body.
  const candidates = Array.from(doc.querySelectorAll("main, article, [role='main']"));
  const best = candidates.sort((a, b) => textLength(b) - textLength(a))[0] ?? null;
  const root = best && textLength(best) >= 200 ? best : doc.body;
  if (!root) return "";

  const parts: string[] = [];
  const walk = (node: Node, inPre: boolean): void => {
    if (node.nodeType === TEXT) {
      const value = node.nodeValue ?? "";
      parts.push(inPre ? value : value.replace(/\s+/g, " "));
      return;
    }
    if (node.nodeType !== ELEMENT) return;
    const el = node as Element;
    if (el !== root && (isNoise(el) || !isVisible(el))) return;
    if (el.tagName === "BR") {
      parts.push("\n");
      return;
    }
    const block = BLOCK_TAGS.has(el.tagName);
    if (block) parts.push("\n");
    if (el.tagName === "LI") parts.push("- ");
    if (el.tagName === "TD" || el.tagName === "TH") parts.push(" ");
    for (const child of Array.from(el.childNodes)) walk(child, inPre || el.tagName === "PRE");
    if (block) parts.push("\n");
  };
  walk(root, false);

  return parts
    .join("")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line !== "")
    .join("\n")
    .trim();
}
