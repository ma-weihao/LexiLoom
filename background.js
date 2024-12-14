chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getSelectedText,
    },
    (selection) => {
      if (selection && selection[0] && selection[0].result) {
        chrome.storage.local.set({ selectedText: selection[0].result });
      }
    }
  );
});

function getSelectedText() {
  return window.getSelection().toString();
} 