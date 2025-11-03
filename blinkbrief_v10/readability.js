function extractMainText() {
  const article = document.querySelector("article");
  if (article) return article.innerText.trim();
  const paragraphs = Array.from(document.querySelectorAll("p"));
  return paragraphs.map(p => p.innerText).join(" ").trim();
}