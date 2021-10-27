// background.js
chrome.action.onClicked.addListener((tab) => {    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    if (message.MsgType == "BuildReport")
    {
      fetch(message.BuildReportUrl).
      then((response)=> response.text()).
      then((text) => { sendResponse({buildreport: text}); return true; });
      return true;
    }
    if (message.MsgType == "ValidatedFile")
    {
      fetch(message.URL).then(res => res.text()).then(html => {
        var title = html.substring(html.indexOf("<title>") + "<title>".length);
        title = title.substring(0, title.indexOf("</title>"));
        sendResponse({pageTitle: title});
        
      });
      return true;
    }
  });
