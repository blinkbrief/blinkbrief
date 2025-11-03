document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const summarizeBtn = document.getElementById("summarizeBtn");

  chrome.storage.sync.get("theme", (data) => {
    if (data.theme === "dark") body.classList.add("dark-mode");
  });

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const theme = body.classList.contains("dark-mode") ? "dark" : "light";
    chrome.storage.sync.set({ theme });
  });

  summarizeBtn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: summarizePage
    });
  });
});

function summarizePage() {
  const text = window.blinkBriefGetText ? window.blinkBriefGetText() : document.body.innerText;
  if (!text || text.length < 100) {
    alert("⚠️ Blink Brief couldn't find any readable article text on this page.");
    return;
  }

  // Create a very short pseudo-summary
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 5).join(" ");
  alert("🧠 Blink Brief Summary:\n\n" + sentences);
}
