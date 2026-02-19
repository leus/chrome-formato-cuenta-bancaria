// ---------------------------------------------------------------------------
// Background service worker – context menu + orchestration
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertir-cuenta",
    title: "Convertir datos bancarios del portapapeles",
    contexts: ["all"],
  });
});

// Handle context-menu click → open the converter dialog
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "convertir-cuenta") return;

  // Open the converter dialog as a small popup window
  chrome.windows.create({
    url: chrome.runtime.getURL("converter.html"),
    type: "popup",
    width: 480,
    height: 560,
    focused: true,
  });
});
