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