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
    // Clear any previously stored text first
    await chrome.storage.local.remove('selectedText');
    
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
    // Only store the selection if it's from the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0].id === sender.tab.id) {
        if (selectedText) {
          chrome.storage.local.set({ selectedText: selectedText }, () => {
            sendResponse({ success: true });
          });
        }
      }
    });
    return true; // Required for async response
  }
}); 