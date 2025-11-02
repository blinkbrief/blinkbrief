const addBtn = document.getElementById('addBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const list = document.getElementById('sourcesList');
const input = document.getElementById('newsUrl');
const summaryCard = document.getElementById('summaryCard');
const summaryTitle = document.getElementById('summaryTitle');
const summaryBody = document.getElementById('summaryBody');

async function loadSources(){
  const { sources } = await chrome.storage.local.get('sources');
  list.innerHTML = '';
  (sources || []).forEach((url,idx)=>{
    const el = document.createElement('div');
    el.className = 'source';
    el.innerHTML = `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">${url}</div>
                    <div><button class="btn-small" data-idx="${idx}" title="Remove">Remove</button></div>`;
    list.appendChild(el);
  });

  // wire remove
  document.querySelectorAll('.btn-small').forEach(b=>{
    b.addEventListener('click', async (e)=>{
      const idx = Number(e.currentTarget.dataset.idx);
      const { sources } = await chrome.storage.local.get('sources');
      sources.splice(idx,1);
      await chrome.storage.local.set({ sources });
      loadSources();
    });
  });
}

addBtn.addEventListener('click', async ()=>{
  const url = input.value.trim();
  if(!url) return;
  const { sources } = await chrome.storage.local.get('sources');
  const arr = sources || [];
  arr.push(url);
  await chrome.storage.local.set({ sources: arr });
  input.value = '';
  loadSources();
});

summarizeBtn.addEventListener('click', async ()=>{
  summaryCard.style.display = 'block';
  summaryTitle.textContent = 'Working...';
  summaryBody.textContent = 'Fetching article from active tab or using saved sources...';

  // First try active tab article
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if(tab){
    // ask content script in active tab
    chrome.tabs.sendMessage(tab.id, { action: 'getArticleText' }, async (response) => {
      if (chrome.runtime.lastError || !response || !response.ok) {
        // fallback: if user saved sources, open first source in a new tab and summarize that
        const { sources } = await chrome.storage.local.get('sources');
        if (sources && sources.length){
          // open first source in new tab and request extraction there
          const newTab = await chrome.tabs.create({ url: sources[0] });
          // wait a bit for content script to load
          setTimeout(async ()=>{
            chrome.tabs.sendMessage(newTab.id, { action: 'getArticleText' }, (resp2)=>{
              if (resp2 && resp2.ok){
                showSummary(resp2.article);
              } else {
                summaryTitle.textContent = 'Could not extract article';
                summaryBody.textContent = 'Try opening an article tab directly and press Fetch & Summarize.';
              }
            });
          }, 1200);
        } else {
          summaryTitle.textContent = 'No article found';
          summaryBody.textContent = 'Open an article tab, or add a source URL above.';
        }
      } else {
        showSummary(response.article);
      }
    });
  } else {
    summaryTitle.textContent = 'No active tab';
    summaryBody.textContent = 'Open an article tab and try again.';
  }
});

function summarizeText(text, sentenceCount = 3){
  if (!text || text.length < 80) return 'No readable article text found.';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const stopwords = new Set(['the','and','a','to','in','of','for','on','that','this','with','as','are','was','be','by','an','or','from']);
  const freq = {};
  sentences.forEach(s=>{
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);
    words.forEach(w=>{ if (!stopwords.has(w) && w.length>2) freq[w]=(freq[w]||0)+1; });
  });
  const scored = sentences.map(s=>{
    const words = s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);
    let score=0; words.forEach(w=>{ if(freq[w]) score+=freq[w]; });
    return { s: s.trim(), score };
  });
  scored.sort((a,b)=>b.score-a.score);
  const top = scored.slice(0,sentenceCount).map(x=>x.s);
  const ordered = sentences.filter(s=>top.includes(s.trim())).slice(0,sentenceCount);
  return ordered.join(' ');
}

function showSummary(article){
  summaryTitle.textContent = article.title || 'Untitled';
  const summary = summarizeText(article.text,3);
  summaryBody.textContent = summary;
}

loadSources();
