console.log('LexiLoom content script loaded');

// Listen for text selection
document.addEventListener('mouseup', () => {
  // Check if this tab is active before sending the selection
  chrome.runtime.sendMessage({
    action: 'captureSelection',
    text: window.getSelection().toString().trim()
  }, (response) => {
    if (response && response.success) {
      console.log('Selection captured:', window.getSelection().toString().trim());
    }
  });
});

// Clear selection when tab becomes inactive
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    try {
      // Check if chrome API is still available
      if (chrome.runtime && chrome.runtime.id) {
        chrome.storage.local.remove('selectedText');
      }
    } catch (error) {
      console.log('Extension context invalidated or chrome API not available');
    }
  }
}); 