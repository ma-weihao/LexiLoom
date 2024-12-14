console.log('LexiLoom content script loaded');

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'captureSelection',
      text: selectedText
    }, (response) => {
      console.log('Selection captured:', selectedText);
    });
  }
}); 