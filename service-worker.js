
// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {

    await chrome.sidePanel.setOptions({
      tabId,
      path: 'side-panel.html',
      enabled: true
    });

});


