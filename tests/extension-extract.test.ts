// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { extractMainText } from "../extension/src/extract";

function page(html: string) {
  document.documentElement.innerHTML = `<head><title>Job</title><style>.x{}</style></head><body>${html}</body>`;
}

beforeEach(() => page(""));

describe("extractMainText", () => {
  test("keeps the main content and drops navigation, sidebars, footers, and scripts", () => {
    page(`
      <header><nav><a>Home</a><a>Jobs</a></nav></header>
      <main>
        <article>
          <header><h1>Senior IT Officer</h1></header>
          <p>Applicants must hold a degree in IT.</p>
          <script>trackVisitor()</script>
        </article>
      </main>
      <aside>Related jobs you may like</aside>
      <footer>© 2026 Example Jobs. Privacy. Terms.</footer>`);
    const text = extractMainText(document);
    expect(text).toContain("Senior IT Officer");
    expect(text).toContain("Applicants must hold a degree in IT.");
    for (const noise of ["Home", "Related jobs", "© 2026", "trackVisitor"]) expect(text).not.toContain(noise);
  });

  test("drops cookie banners, ads, share bars, hidden and aria-hidden elements", () => {
    page(`
      <div id="cookie-consent">We use cookies. Accept all?</div>
      <main>
        <p>Please submit your CV in PDF format.</p>
        <div class="ad-slot ads">Buy cheap flights now</div>
        <div class="share-buttons">Share on Facebook</div>
        <p hidden>Hidden internal note</p>
        <p aria-hidden="true">Decorative text</p>
        <p style="display: none">Invisible text</p>
        <p class="uploads-info">Uploads must be under 5 MB.</p>
      </main>`);
    const text = extractMainText(document);
    expect(text).toContain("Please submit your CV in PDF format.");
    expect(text).toContain("Uploads must be under 5 MB.");
    for (const noise of ["cookies", "cheap flights", "Facebook", "Hidden internal", "Decorative", "Invisible"]) {
      expect(text).not.toContain(noise);
    }
  });

  test("puts blocks and list items on their own lines and joins inline text with spaces", () => {
    page(`<main><h2>Requirements</h2><ul><li>A <b>valid</b> right to work</li><li>Two references</li></ul><p>Apply   by
      15 November 2026.</p></main>`);
    expect(extractMainText(document)).toBe(
      "Requirements\n- A valid right to work\n- Two references\nApply by 15 November 2026.",
    );
  });

  test("falls back to the whole page body when there is no main content element", () => {
    page(`<nav>Menu</nav><div class="content"><p>Course requirements: a laptop and a student ID.</p></div>`);
    const text = extractMainText(document);
    expect(text).toBe("Course requirements: a laptop and a student ID.");
  });

  test("drops link-heavy lists and blocks (site menus outside <nav>), but keeps prose that contains links", () => {
    page(`
      <main>
        <h1>Payroll Officer</h1>
        <p>You must have two years of payroll experience. Read our <a href="/faq">application FAQ</a> before you apply.</p>
        <div class="browse">
          <h2>Jobs by city</h2>
          <ul><li><a href="/a">Hobart</a></li><li><a href="/b">Darwin</a></li><li><a href="/c">Canberra</a></li></ul>
        </div>
        <ul><li><a href="/d">All Jobs</a></li><li><a href="/e">FIFO Jobs</a></li><li><a href="/f">Salary Calculator</a></li></ul>
        <p>Please submit a cover letter and two references.</p>
      </main>`);
    const text = extractMainText(document);
    expect(text).toContain("You must have two years of payroll experience. Read our application FAQ before you apply.");
    expect(text).toContain("Please submit a cover letter and two references.");
    for (const menu of ["Hobart", "Darwin", "Canberra", "All Jobs", "FIFO Jobs", "Salary Calculator"]) {
      expect(text).not.toContain(menu);
    }
  });

  test("returns an empty string for a page without readable text", () => {
    page(`<nav>Menu</nav><img src="x.png" alt="" /><script>1</script>`);
    expect(extractMainText(document)).toBe("");
  });
});
