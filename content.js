let popupElement = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "correctGrammar" || request.action === "changeTone" || request.action === "rephrase") {
    chrome.runtime.sendMessage({ action: "callGeminiAPI", type: request.action, text: request.text }, response => {
      if (response.suggestions) {
        showSuggestions(response.suggestions);
      } else if (response.error) {
        console.error('API Error:', response.error);
        alert(`Error: ${response.error}. Please check the console for more details.`);
      } else {
        console.error('Unexpected response:', response);
        alert('An unexpected error occurred. Please check the console for more details.');
      }
    });
  }
});

function showSuggestions(suggestions) {
  removeExistingPopup();

  popupElement = document.createElement('div');
  popupElement.className = 'text-enhancer-popup';
  
  const title = document.createElement('h3');
  title.textContent = 'Suggestions';
  popupElement.appendChild(title);

  suggestions.forEach((suggestion, index) => {
    const button = document.createElement('button');
    button.textContent = `Suggestion ${index + 1}`;
    button.onclick = () => {
      replaceSelectedText(suggestion);
      removeExistingPopup();
    };
    popupElement.appendChild(button);

    const p = document.createElement('p');
    p.textContent = suggestion;
    popupElement.appendChild(p);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = removeExistingPopup;
  popupElement.appendChild(closeButton);

  document.body.appendChild(popupElement);

  // Position the popup near the selected text
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popupElement.style.position = 'absolute';
    popupElement.style.left = `${rect.left + window.scrollX}px`;
    popupElement.style.top = `${rect.bottom + window.scrollY}px`;
  }
}

function removeExistingPopup() {
  if (popupElement && popupElement.parentNode) {
    popupElement.parentNode.removeChild(popupElement);
    popupElement = null;
  }
}

function replaceSelectedText(replacementText) {
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(replacementText));
  }
}