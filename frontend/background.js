
chrome.runtime.onInstalled.addListener(() => {
    console.log("Research Assistant installed successfully.");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Research Assistant started.");
});

chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
}).catch((error) => {
    console.error("Unable to configure side panel:", error);
});
