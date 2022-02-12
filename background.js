// background.js
chrome.action.onClicked.addListener((tab) => {    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  });

chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({
    title:"Close all opened preview tabs. (Alt+C)",
    contexts:["all"],
    id: "PRReviewHelperCloseOpenedTabs",
  });

  chrome.contextMenus.create({
    title:"Choose specific files from this PR to preview. (Alt+S)",
    contexts:["all"],
    id:"PRReviewHelperShowPageSelector"
  });

  chrome.contextMenus.create({
    type:"checkbox",
    checked:true,
    title:"Open article Acrolinx results from the PR",
    contexts:["all"],
    id:"PRReviewLinkOpenerOpenAcrolinx"
  });

  chrome.contextMenus.create({
    type:"checkbox",
    checked:true,
    title:"Open changes for each article from the PR",
    contexts:["all"],
    id:"PRReviewLinkOpenerOpenChanges"
  });

  chrome.contextMenus.create({
    type:"checkbox",
    checked:true,
    title:"Open article Preview pages from the PR",
    contexts:["all"],
    id:"PRReviewLinkOpenerOpenPreviewPages"
  });
});

function CloseTabs()
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

chrome.commands.onCommand.addListener((c, tab)=>{
  if (c=="CloseOpenedTabs")
    CloseTabs();
});

function ShowPreviewPagesSelector()
{
  return new Promise((resolve, reject)=> {
    var popupUrl = chrome.runtime.getURL('IncludeDocsList.html');
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs =>{
      let url = tabs[0].url;
      var qryUrl = popupUrl + 
          '?PR=' + url;
      chrome.tabs.create({ url: qryUrl, active: false}, function(tab, qryUrl) {
        win = chrome.windows.create({ tabId: tab.id, type: 'popup', focused: true, top: 100, left: 100, height: 645, width: 720}, (win, qryUrl)=>{
          var timer = setInterval((win, qryUrl)=>{            
            chrome.tabs.query({windowId: win.id, url: qryUrl}, tabs=>{
              if (tabs.length == 0)
              {
                clearInterval(timer);
                resolve();
                return true;
              }  
            })
          }, 500, win, qryUrl);
        });
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener(async function(info, tab){
  if (info.menuItemId == "PRReviewHelperCloseOpenedTabs") 
    CloseTabs();
  if (info.menuItemId == "PRReviewHelperShowPageSelector")
      ShowPreviewPagesSelector();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
  if (message.MsgType == "BuildReport")
  {
    fetch(message.BuildReportUrl).
    then((response)=> response.text()).
    then((text) => { sendResponse({buildreport: text}); return true; });
    return true;
  }
  if (message.MsgType == "LoadPRPage")
  {
    fetch(message.PRPageURL).
    then((response)=> response.text()).
    then((text) => { sendResponse({PRPage: text}); return true; });
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
  if (message.MsgType == "MoreThan20PreviewFilesEncountered")
  {
    async function ShowPreviewPagesSelectorAsync()
    {
      await ShowPreviewPagesSelector().then(res => {sendResponse("finishedbitch")});
    }
    ShowPreviewPagesSelectorAsync();
    return true;
  }
});
