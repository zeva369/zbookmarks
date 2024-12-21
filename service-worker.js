const MYORIGIN = 'file:///C:/Users/usuario/Desktop/chrome/home.html';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {

/*  if (!tab.url) return;
  const url = new URL(tab.url);

  // Enables the side panel on my page
  if (url.origin === MYORIGIN) {
      					*/
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'side-panel.html',
      enabled: true
    });

/*  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });  
  }*/
});