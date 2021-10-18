// background.js
chrome.action.onClicked.addListener((tab) => {    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    fetch(message.BuildReportUrl).
    then((response)=> response.text()).
    then((text) => { sendResponse({buildreport: text}); return true; });
    return true;
  });
