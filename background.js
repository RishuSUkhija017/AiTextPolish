const API_KEY = '<YOUR_API_KEY>'; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "correctGrammar",
    title: "Correct Grammar and Spelling",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "changeTone",
    title: "Change Tone to Formal",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "rephrase",
    title: "Rephrase Text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "correctGrammar" || info.menuItemId === "changeTone" || info.menuItemId === "rephrase") {
    chrome.tabs.sendMessage(tab.id, { action: info.menuItemId, text: info.selectionText });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callGeminiAPI") {
    let prompt;
    switch (request.type) {
      case "correctGrammar":
        prompt = `Provide exactly 3 suggestions to correct any grammar or spelling mistakes in the following text. Only provide the corrected versions, no explanations: "${request.text}"`;
        break;
      case "changeTone":
        prompt = `Provide exactly 3 suggestions to rewrite the following text in a formal tone. Only provide the rewritten versions, no explanations: "${request.text}"`;
        break;
      case "rephrase":
        prompt = `Provide exactly 3 suggestions to rephrase the following text while maintaining its meaning. Only provide the rephrased versions, no explanations: "${request.text}"`;
        break;
    }

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
        const suggestionsText = data.candidates[0].content.parts[0].text;
        const suggestions = suggestionsText.split('\n')
          .filter(s => s.trim() !== '')
          .map(s => s.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3);  // Ensure we only get 3 suggestions
        sendResponse({ suggestions: suggestions });
      } else {
        throw new Error('Unexpected API response structure');
      }
    })
    .catch(error => {
      console.error('Error details:', error);
      sendResponse({ error: error.message || 'API call failed' });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});
