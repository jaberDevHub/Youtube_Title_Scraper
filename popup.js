document.addEventListener('DOMContentLoaded', () => {
  const copyAllBtn = document.getElementById('copyAllBtn');
  let currentTitles = [];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    chrome.tabs.sendMessage(activeTab.id, { type: "getYoutubeTitles" }, (response) => {
      const titleList = document.getElementById('titleList');
      titleList.innerHTML = ''; 
      if (response && response.titles && response.titles.length > 0) {
        currentTitles = response.titles;
        copyAllBtn.disabled = false;
        
        response.titles.forEach(title => {
          const li = document.createElement('li');
          li.textContent = title;
          titleList.appendChild(li);
        });
        analyzeAndDisplayKeywords(response.titles);
      } else {
        titleList.innerHTML = '<li class="loading">No titles found on this YouTube page.</li>';
        document.getElementById('keywordContainer').innerHTML = '<div class="loading">No titles to analyze.</div>';
      }
    });
  });

    // Copy all titles functionality
  copyAllBtn.addEventListener('click', async () => {
    if (currentTitles.length === 0) return;
    
    try {
      const titlesText = currentTitles.join('\n');
      await navigator.clipboard.writeText(titlesText);
      showCopySuccess();
    } catch (err) {
      console.error('Failed to copy titles: ', err);
      showCopyError();
    }
  });

   function showCopySuccess() {
    copyAllBtn.innerHTML = '<span class="copy-icon">✓</span><span>Copied!</span>';
    copyAllBtn.classList.add('copied');
    setTimeout(() => {
      copyAllBtn.innerHTML = '<span class="copy-icon">⎘</span><span>Copy All</span>';
      copyAllBtn.classList.remove('copied');
    }, 2000);
  }

   function showCopyError() {
    copyAllBtn.textContent = 'Copy Failed!';
    setTimeout(() => {
      copyAllBtn.innerHTML = '<span class="copy-icon">⎘</span><span>Copy All</span>';
    }, 2000);
  }

  // KEYWORD EXTRACTION FUNCTIONS (FULLY PRESERVED)
  function analyzeAndDisplayKeywords(titles) {
    const keywordContainer = document.getElementById('keywordContainer');
    const stopWords = new Set([
      'a', 'an', 'the', 'in', 'on', 'of', 'for', 'to', 'with', 'is', 'are', 'was', 'were',
      'and', 'or', 'but', 'vs', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'from', 'by', 'at', 'new', 'how', 'what', 'why',
      '|', '-', '2024', '2025'
    ]);

    const allText = titles.join(' ').toLowerCase();
    const words = allText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word && !stopWords.has(word));
      
      // Capture multi-word phrases like "live match", "test match"
    const keywordPhrases = extractKeyPhrases(titles);

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sortedKeywords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
    const topKeywords = sortedKeywords.slice(0, 10);
    
    keywordContainer.innerHTML = '';

    if (topKeywords.length === 0) {
      keywordContainer.innerHTML = '<p>Not enough data to analyze.</p>';
      return;
    }

    topKeywords.forEach(([keyword, count]) => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.innerHTML = `${keyword} <span class="tag-count">${count}</span>`;
      keywordContainer.appendChild(tag);
    });