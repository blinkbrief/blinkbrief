async function getActiveTabURL() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}

async function extractArticle(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const reader = new Readability(doc);
  const article = reader.parse();

  if (article && article.textContent) {
    return article.textContent;
  }
  return doc.body.innerText;
}

function summarise(text) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 50);

  const summary = sentences.slice(0, 5).join(". ") + ".";
  return summary || "Sorry, I couldn’t find much to summarise.";
}

document.getElementById("summariseBtn").addEventListener("click", async () => {
  const output = document.getElementById("output");
  const copyBtn = document.getElementById("copyBtn");

  output.textContent = "⏳ Summarising...";
  copyBtn.style.display = "none";

  try {
    const url = await getActiveTabURL();
    const articleText = await extractArticle(url);
    const summary = summarise(articleText);
    output.textContent = summary;
    copyBtn.style.display = "block";
  } catch (err) {
    console.error(err);
    output.textContent = "⚠️ Could not summarise this page.";
  }
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const summary = document.getElementById("output").textContent;
  try {
    await navigator.clipboard.writeText(summary);
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Summary"), 1500);
  } catch (err) {
    console.error("Copy failed", err);
  }
});
