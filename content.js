async function readLocalStorageInContent (key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
        if (result[key] === undefined) {
          resolve(null);
        } else {
          resolve(result[key]);
        }
      });
    });
}

function ShowPreviewPages(Topics)
{
    var TopicsList = "";
    var OpenedPreviewPages = null;

    chrome.storage.local.get("OpenedPreviewPages",  function (ca){
        if (ca.OpenedPreviewPages != null)
            OpenedPreviewPages = ca.OpenedPreviewPages;
        else
            OpenedPreviewPages = new Array();
        
            for (var i = 0; i < Topics.length; i++)
            {
                if (Topics[i].URL != null)
                {
                    OpenedPreviewPages.push(Topics[i].URL);
                    window.open(Topics[i].URL);
                }
                TopicsList += Topics[i].Title + "<br>";
            }
            if (Topics.length > 0)
            {
                var PR = document.location.href.substring(document.location.href.lastIndexOf("/") + 1);
                var TopicsListWin = window.open("", "Topics list for PR " + PR);
                chrome.storage.local.set({"OpenedPreviewPages": OpenedPreviewPages});
                TopicsListWin.document.body.innerHTML = "<html><head><title>List of topics in PR " + PR + "</title></head><body><H1>List of topics in PR <a href='" + document.location.href + "'>" + PR + "</a></H1>" + TopicsList + "</body></html>";                
            }
    });               
}

async function BuildTopicsList(ValidatedFilesTable, IncludeAllIfNoStoredValues)
{
    var Topics = new Array();     
    var PRNum = document.location.href.substring(document.location.href.indexOf("/pull/") + "/pull/".length);
    var AllChecked = await readLocalStorageInContent("AllFiles" + PRNum);
    if (AllChecked == null) 
    {
        AllChecked = true;
        if (!IncludeAllIfNoStoredValues)
            return Topics;
    }
    for (var i = 1; i < ValidatedFilesTable.rows.length; i++)
    {
        try
        {
            var href = ValidatedFilesTable.rows[i].children[2].children[0].href;
            var file = ValidatedFilesTable.rows[i].children[0].children[0].href;
            
            var fileend = file;
            if (fileend.indexOf("/articles/") != -1)
                fileend = fileend.substring(fileend.indexOf("/articles/"));
            if (fileend.indexOf("/includes/") != -1)
                fileend = fileend.substring(fileend.indexOf("/includes/"));
            var FileChecked = await readLocalStorageInContent("PR" + PRNum + "File" + fileend);
            if (FileChecked == null) 
                FileChecked = true;

            if (FileChecked || AllChecked)
            {
                if (file.substring(file.length - 3) == ".md")
                {
                    function SendMessageWithPromise(){
                        return new Promise((resolve, reject) => {
                            chrome.runtime.sendMessage({MsgType: "ValidatedFile", URL: href}, function(res) {
                                Topics.push({URL: href, Title: res.pageTitle});
                                resolve();
                                return true;
                            });
                        });
                    }
                    await SendMessageWithPromise();
                }
                if (file.substring(file.length - 4) == ".png")
                {
                    var pngname = ValidatedFilesTable.rows[i].children[0].children[0].innerText;
                    Topics.push({URL: file, Title: file});
                }
                if (file.substring(file.length - 4) == ".yml")
                {
                    Topics.push({URL: null, Title: file})
                }
            }
        }
        catch(e)
        {
            // we might get an innocuous exception here if there is no preview URL present so we just skip that item if so
        }    
    }
    return Topics;
}

if (!document.location.href.startsWith("https://github.com/MicrosoftDocs/") 
    || !document.location.href.includes("/pull/"))
{
    alert("This extension works with Git Pull Requests to Microsoft Docs.\rPlease try again from a PR under https://github.com/MicrosoftDocs.");
}
else
{   
    ///////////////////////////////////////////////////////////////
    // BEGIN HTML PARSING OF BUILD STATUS IN PR AND BUILD REPORT //
    ///////////////////////////////////////////////////////////////

    var h3s = Array.from(document.querySelectorAll('h3'));
    var i = 0;
    for (i = h3s.length - 1; i > 0; i--)
    {
        if (h3s[i].innerText.includes('Validation status:'))
            break;
    }
    if (i > 0)
    {
        document.body.style.cursor = "progress";
        var img = document.createElement("img");
        img.id = "loadingimg";
        img.src = chrome.runtime.getURL('images/loading.gif');
        img.height = 50;
        img.width = 50;
        img.style = "position:absolute; top:48%; left: 48%; transform: translate(-50%, -50%);";
        document.body.appendChild(img);

        var curRow = h3s[i].nextElementSibling.nextElementSibling
        while (curRow.innerText.indexOf("build report") == -1)
            curRow = curRow.nextElementSibling;
        var BuildReportUrl = curRow.firstElementChild.href;
        
        chrome.runtime.sendMessage({MsgType: "BuildReport", BuildReportUrl: BuildReportUrl}, async response => {
            var buildreport = document.createElement("html");
            buildreport.innerHTML = response.buildreport;
            
            var ValidatedFilesTable = buildreport.querySelector("a[name=\"ValidatedhFiles\"]")
            var Tables = buildreport.getElementsByTagName("table");
            for (var i = 0; i < Tables.length; i++)
            {
                 if (ValidatedFilesTable.compareDocumentPosition(Tables[i]) == 4)
                 {
                     ValidatedFilesTable = Tables[i];
                     i = Tables.length;
                 }
            }
            
            var PRNum = document.location.href.substring(document.location.href.indexOf("/pull/") + "/pull/".length);
            var NoStoredPRFileSelection = await readLocalStorageInContent("AllFiles" + PRNum) == null;
            var Topics = await BuildTopicsList(ValidatedFilesTable, true);
            
            /////////////////////////////////////////////////////////////
            // END HTML PARSING OF BUILD STATUS IN PR AND BUILD REPORT //
            /////////////////////////////////////////////////////////////

            document.body.style.cursor = "default";
            document.getElementById("loadingimg").remove();

            if (Topics.length > 20 && NoStoredPRFileSelection)
            {
                chrome.runtime.sendMessage({MsgType: "MoreThan20PreviewFilesEncountered"}, async response => {
                    var Topics = await BuildTopicsList(ValidatedFilesTable, false);
                    ShowPreviewPages(Topics);
                });                
            }
            else
            {
                if (confirm("Open " + (Topics.filter(t=>t.URL != null).length) + " preview page" + (Topics.length > 1 ? "s" : "") + " for this PR?"))
                {
                    ShowPreviewPages(Topics);
                }
            }
            return true;
        });
    }
    else
    {
        alert("There are no preview URLs available yet for this PR.");
    }

    // Acrolinx

    var h2s = Array.from(document.querySelectorAll('h2'));
    
    // Loop backwards through all h2s to find Acrolinx section
    for (var h2index = h2s.length - 1; h2index; h2index--)
    {
        if (h2s[h2index].innerText.includes('Acrolinx Scorecards')) 
            break;
    }

     // If we found the Acrolinx section, loop through the table rows to find the scorecard URL
    if (h2index > 0)
    {
        var articleTable = h2s[h2index].nextElementSibling.nextElementSibling.nextElementSibling; // Get the table of acrolinx links

        // Loop through the table and get links to the Acrolinx scorecards anchor links
        const FIRST_ARTICLE_ROW = 1;
        const SCORECARD_LINK_COLUMN = 4;
        for (var row = FIRST_ARTICLE_ROW; row < articleTable.rows.length; row++)
        {
            var acrolinxLink = articleTable.rows[row].cells[SCORECARD_LINK_COLUMN].innerHTML; // Get the HTML anchor tag for the Acrolinx scorecard
            var acrolinxUrl = acrolinxLink.substring(acrolinxLink.indexOf("href=\"") + 6, acrolinxLink.indexOf("\" rel=")); // Extract the URL from hte HTML anchor tag
            console.log("acrolinxUrl is " + acrolinxUrl);
        }
    }
    else
    {
        alert("There are no Acrolinx scorecards available yet for this PR.");
    }
}