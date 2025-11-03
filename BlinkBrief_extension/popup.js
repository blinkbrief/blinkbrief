document.getElementById("summarizeBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: summarizePage
    },
    (results) => {
      if (chrome.runtime.lastError) {
        document.getElementById("summary").innerText =
          "Error: Could not summarise this page.";
      } else if (results && results[0] && results[0].result) {
        document.getElementById("summary").innerText = results[0].result;
      } else {
        document.getElementById("summary").innerText = "No content found.";
      }
    }
  );
});

function summarizePage() {
  const bodyText = document.body.innerText;
  const sentences = bodyText.split(/[.!?]/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 5).join(". ") + ".";
  return summary;
}
