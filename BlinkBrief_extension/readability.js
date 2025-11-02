// Minimal Readability fallback for the extension (not the full Mozilla version).
// This provides basic parsing for many article pages; for best results, replace
// this with the official Readability.js from Mozilla (github.com/mozilla/readability).

class Readability {
  constructor(doc) {
    this.doc = doc;
  }
  parse() {
    // Try to find <article> first
    const article = this.doc.querySelector('article');
    if (article && article.innerText && article.innerText.length > 100) {
      return { title: this.doc.title || '', textContent: article.innerText };
    }
    // Otherwise try main or role=main
    const main = this.doc.querySelector('main') || this.doc.querySelector('[role=main]');
    if (main && main.innerText && main.innerText.length > 100) {
      return { title: this.doc.title || '', textContent: main.innerText };
    }
    // fallback: use body text
    return { title: this.doc.title || '', textContent: this.doc.body ? this.doc.body.innerText : '' };
  }
}
