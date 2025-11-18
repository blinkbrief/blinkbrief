
// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("summariseBtn");
  const out = document.getElementById("summary");

  async function requestSummary(tabId, tryInject=false) {
    out.textContent = "Summarising…";
    chrome.tabs.sendMessage(tabId, { action: "getSummary", sentences: 3 }, (resp) => {
      if (chrome.runtime.lastError || !resp) {
        // content script not present — attempt to inject once
        if (!tryInject) {
          chrome.scripting.executeScript(
            { target: { tabId }, files: ["content_script.js"] },
            () => {
              // wait a tick then request again
              setTimeout(() => requestSummary(tabId, true), 300);
            }
          );
        } else {
          out.textContent = "Unable to summarise this page (content script not available).";
        }
        return;
      }

      if (!resp.ok) {
        out.textContent = "No readable article found on this page.";
      } else {
        out.textContent = resp.summary;
      }
    });
  }

  btn.addEventListener("click", async () => {
    out.textContent = "";
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      out.textContent = "No active tab found.";
      return;
    }
    requestSummary(tab.id);
  });
});
