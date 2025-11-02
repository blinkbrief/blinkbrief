(function () {
  function extractArticle() {
    try {
      const clone = document.cloneNode(true);
      const reader = new Readability(clone);
      const article = reader.parse();
      if (article && article.textContent && article.textContent.length>50) {
        return { title: article.title || document.title, text: article.textContent };
      }
      // fallback: try common article selectors
      const selectors = ['article','main','[role=main]','.article','.post','.story','.content'];
      for(const sel of selectors){
        const el = document.querySelector(sel);
        if(el && el.innerText && el.innerText.length>100){
          return { title: document.title, text: el.innerText };
        }
      }
      // last fallback: body text
      return { title: document.title, text: document.body.innerText || '' };
    } catch (err) {
      return { title: document.title, text: document.body.innerText || '' };
    }
  }

  const extracted = extractArticle();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'getArticleText') {
      if (extracted && extracted.text && extracted.text.length > 50) {
        sendResponse({ ok: true, article: extracted });
      } else {
        sendResponse({ ok: false, error: 'Could not extract article text' });
      }
    }
  });
})();
