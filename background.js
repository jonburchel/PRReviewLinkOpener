// background.js
chrome.action.onClicked.addListener((tab) => {    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  });


chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({
    title:"Close all opened preview tabs. (Ctrl+Shift+C)",
    contexts:["all"],
    id: "PRReviewLinkOpenerCloseOpenedTabs",
  });
});

chrome.contextMenus.onClicked.addListener(async function(info, tab){
  if (info.menuItemId == "PRReviewLinkOpenerCloseOpenedTabs") 
  {
    chrome.storage.local.get("OpenedPreviewPages",  function (ca){
      if (ca.OpenedPreviewPages != null)
      {
        for(var i = 0; i < ca.OpenedPreviewPages.length; i++)
        {
          var url = ca.OpenedPreviewPages[i];
          chrome.tabs.query({url:url}, function(tab){
            if (tab != null && tab.length > 0)
              chrome.tabs.remove(tab[0].id);
          });          
        }
      }
      chrome.storage.local.set({"OpenedPreviewPages": null});
    });    
  }
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
