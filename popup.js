document.addEventListener('DOMContentLoaded', () => {
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyKeywordsBtn = document.getElementById('copyKeywordsBtn');
  let currentTitles = [];
  let currentKeywords = [];

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
      showCopySuccess(copyAllBtn, 'Copy All');
    } catch (err) {
      console.error('Failed to copy titles: ', err);
      showCopyError(copyAllBtn, 'Copy All');
    }
  });

  // Copy all keywords functionality
  copyKeywordsBtn.addEventListener('click', async () => {
    if (currentKeywords.length === 0) return;
    
    try {
      const keywordsText = currentKeywords.join('\n');
      await navigator.clipboard.writeText(keywordsText);
      showCopySuccess(copyKeywordsBtn, 'Copy Keywords');
    } catch (err) {
      console.error('Failed to copy keywords: ', err);
      showCopyError(copyKeywordsBtn, 'Copy Keywords');
    }
  });

   function showCopySuccess(button, originalText) {
    button.innerHTML = '<span class="copy-icon">✓</span><span>Copied!</span>';
    button.classList.add('copied');
    setTimeout(() => {
      button.innerHTML = `<span class="copy-icon">⎘</span><span>${originalText}</span>`;
      button.classList.remove('copied');
    }, 2000);
  }

   function showCopyError(button, originalText) {
    button.textContent = 'Copy Failed!';
    setTimeout(() => {
      button.innerHTML = `<span class="copy-icon">⎘</span><span>${originalText}</span>`;
    }, 2000);
  }

  // CONCEPT EXTRACTION FUNCTIONS
  function analyzeAndDisplayKeywords(titles) {
    const keywordContainer = document.getElementById('keywordContainer');
    const stopWords = new Set([
      'a', 'an', 'the', 'in', 'on', 'of', 'for', 'to', 'with', 'is', 'are', 'was', 'were',
      'and', 'or', 'but', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'from', 'by', 'at', 'new', 'how', 'what', 'why',
      '|', '-', '2024', '2025', 'vs'
    ]);

    const allPhrases = titles.flatMap(title => 
      title.toLowerCase().split(/[|,]/).map(part => part.trim())
    );

    const allNgrams = [];
    allPhrases.forEach(phrase => {
      if (phrase) {
        allNgrams.push(phrase);
        const words = phrase.split(/\s+/).filter(word => word && !stopWords.has(word));
        
        for (let i = 0; i < words.length - 1; i++) {
          allNgrams.push(words[i] + ' ' + words[i+1]);
        }

        for (let i = 0; i < words.length - 2; i++) {
          allNgrams.push(words[i] + ' ' + words[i+1] + ' ' + words[i+2]);
        }
      }
    });

    const phraseCounts = {};
    allNgrams.forEach(phrase => {
      const trimmedPhrase = phrase.trim();
      if (trimmedPhrase.length < 5) return;

      const wordsInPhrase = trimmedPhrase.split(/\s+/);
      if (wordsInPhrase.length === 1 && stopWords.has(wordsInPhrase[0])) {
        return;
      }
      
      phraseCounts[trimmedPhrase] = (phraseCounts[trimmedPhrase] || 0) + 1;
    });

    const sortedPhrases = Object.entries(phraseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    keywordContainer.innerHTML = '';
    currentKeywords = []; // Reset keywords

    if (sortedPhrases.length === 0) {
      keywordContainer.innerHTML = '<div class="loading">Not enough data to analyze.</div>';
      copyKeywordsBtn.disabled = true;
      return;
    }

    copyKeywordsBtn.disabled = false;
    sortedPhrases.forEach(([phrase, count]) => {
      if (count > 1) {
        currentKeywords.push(phrase);
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = phrase;
        keywordContainer.appendChild(tag);
      }
    });

    if (currentKeywords.length === 0) {
        keywordContainer.innerHTML = '<div class="loading">No recurring concepts found.</div>';
        copyKeywordsBtn.disabled = true;
    }
  }
});
