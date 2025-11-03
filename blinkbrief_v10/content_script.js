(() => {
  console.log("Blink Brief content script improved.");

  function extractReadableText() {
    // Try to grab the article tag first
    let article = document.querySelector("article");
    if (article) return article.innerText.trim();

    // Try <main> as fallback
    let main = document.querySelector("main");
    if (main) return main.innerText.trim();

    // Fallback: use all <p> tags, but skip headers/footers/nav
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const cleanParagraphs = paragraphs.filter(p => {
      return !p.closest("header, footer, nav, aside") && p.innerText.length > 60;
    });
    return cleanParagraphs.map(p => p.innerText).join(" ").trim();
  }

  window.blinkBriefGetText = extractReadableText;
})();
