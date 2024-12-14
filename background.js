chrome.runtime.onInstalled.addListener(() => {
  console.log('LexiLoom extension installed');
});

// Function to get selected text
function getSelectedText() {
  const selectedText = window.getSelection().toString().trim();
  console.log('Selected text:', selectedText);
  return selectedText;
}

// Execute this when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText,
    });
    
    if (result && result.result) {
      await chrome.storage.local.set({ selectedText: result.result });
    }
  } catch (err) {
    console.error('Failed to get selected text:', err);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureSelection') {
    const selectedText = request.text;
    if (selectedText) {
      chrome.storage.local.set({ selectedText: selectedText }, () => {
        sendResponse({ success: true });
      });
    }
    return true; // Required for async response
  }
}); 