
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getYoutubeTitles") {
    // YouTube video titles are inside an 'a' tag with the id 'video-title'
    const titleElements = document.querySelectorAll("a#video-title");
    const titles = Array.from(titleElements).map(el => el.textContent.trim());
    sendResponse({ titles: titles });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    chrome.tabs.sendMessage(activeTab.id, { type: "getYoutubeTitles" }, (response) => {
      const titleList = document.getElementById('titleList');
      titleList.innerHTML = ''; 

      if (response && response.titles && response.titles.length > 0) {
        response.titles.forEach(title => {
          const li = document.createElement('li');
          li.textContent = title;
          titleList.appendChild(li);
        });
        analyzeAndDisplayKeywords(response.titles);
      } else {
        titleList.textContent = "Couldn't find any titles.";
        document.getElementById('keywordContainer').innerHTML = '<p>No titles to analyze.</p>';
      }
    });
  });

  // Scroll event listener to handle infinite scroll
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      fetchAndAnalyzeAdditionalTitles();
    }
  });
});

function fetchAndAnalyzeAdditionalTitles() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    chrome.tabs.sendMessage(activeTab.id, { type: "getYoutubeTitles" }, (response) => {
      if (response && response.titles && response.titles.length > 0) {
        analyzeAndDisplayKeywords(response.titles); // Update with new keywords
      }
    });
  });
}

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
  
  keywordContainer.innerHTML = ''; // Clear the "Analyzing..." text

  if (topKeywords.length === 0) {
    keywordContainer.innerHTML = '<p>Not enough data to analyze.</p>';
    return;
  }

  topKeywords.forEach(([keyword, count]) => {
    const tag = document.createElement('span'); // Create a <span> instead of an <li>
    tag.className = 'keyword-tag'; // Assign our new CSS class
    
    tag.innerHTML = `${keyword} <span class="tag-count">${count}</span>`;
    keywordContainer.appendChild(tag);
  });

  // Display keyword phrases as well
  keywordPhrases.forEach(phrase => {
    const phraseTag = document.createElement('span');
    phraseTag.className = 'keyword-tag';
    phraseTag.innerHTML = `${phrase}`;
    keywordContainer.appendChild(phraseTag);
  });
}

function extractKeyPhrases(titles) {
  const phrases = [];
  const pattern = /\b(\w+\s\w+)\b/g;  // Match any two-word combination
  titles.forEach(title => {
    let match;
    while (match = pattern.exec(title)) {
      phrases.push(match[0].toLowerCase()); // Capture key phrases
    }
  });
  return phrases;
}

