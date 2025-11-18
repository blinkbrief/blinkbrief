// content_script.js
(() => {
  // Extract readable/main article text (tries multiple fallbacks)
  function extractReadableText() {
    // 1) article tag
    const article = document.querySelector("article");
    if (article) {
      const t = article.innerText.trim();
      if (t.length > 120) return t;
    }

    // 2) main tag
    const main = document.querySelector("main");
    if (main) {
      const t = main.innerText.trim();
      if (t.length > 120) return t;
    }

    // 3) look for the largest continuous block of <p> text (skip nav/header/footer/aside)
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const good = paragraphs.filter(p => !p.closest("header, footer, nav, aside") && p.innerText.trim().length > 40);

    if (good.length) {
      // merge paragraphs but avoid tiny ones
      let text = good.map(p => p.innerText.trim()).join("\n\n");
      if (text.length > 120) return text;
    }

    // 4) Fallback: use body but try to remove common UI strings (short),
    //    and require a minimum length so we don't return nav-only pages.
    const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
    return bodyText.length > 120 ? bodyText : "";
  }

  function summarizeText(text, numSentences = 3) {
    if (!text) return "";

    // split to sentences
    const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/);
    if (sentences.length <= numSentences) return sentences.join(" ");

    // build word frequency (common words ignored)
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const freq = {};
    words.forEach(w => (freq[w] = (freq[w] || 0) + 1));

    // score sentences
    const scored = sentences.map((s, i) => {
      const sWords = (s.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      const score = sWords.reduce((acc, w) => acc + (freq[w] || 0), 0);
      return { index: i, sentence: s.trim(), score };
    });

    // pick top by score, then order by original position for coherence
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a, b) => a.index - b.index)
      .map(s => s.sentence);

    return top.join(" ");
  }

  // listen for popup requests
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "getSummary") {
      const text = extractReadableText();
      if (!text) {
        sendResponse({ ok: false, error: "No readable text found on this page." });
        return true;
      }
      const summary = summarizeText(text, msg.sentences || 3);
      sendResponse({ ok: true, summary });
      return true; // keep channel open if needed
    }
  });
})();
