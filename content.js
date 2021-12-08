if (!document.location.href.startsWith("https://github.com/MicrosoftDocs/") 
    || !document.location.href.includes("/pull/"))
{
    alert("This extension works with Git Pull Requests to Microsoft Docs.\rPlease try again from a PR under https://github.com/MicrosoftDocs.");
}
else
{
    var h3s = Array.from(document.querySelectorAll('h3'));
    var i = 0;
    for (i = h3s.length - 1; i > 0; i--)
    {
        if (h3s[i].innerText.includes('Validation status:'))
            break;
    }
    if (i > 0)
    {
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
            
            var Topics = new Array();
            for (var i = 1; i < ValidatedFilesTable.rows.length; i++)
            {
                try
                {
                    var href = ValidatedFilesTable.rows[i].children[2].children[0].href;
                    var file = ValidatedFilesTable.rows[i].children[0].children[0].href
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
                    if (file.substring(file.length - 4) == ".yml")
                    {
                        Topics.push({URL: null, Title: file})
                    }
                }
                catch(e)
                {
                    // we might get an innocuous exception here if there is no preview URL present so we just skip that item if so
                }    
            }
            if (confirm("Open " + (Topics.filter(t=>t.URL != null).length) + " preview page" + (Topics.length > 1 ? "s" : "") + " for this PR?"))
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
                        var PR = document.location.href.substring(document.location.href.lastIndexOf("/") + 1);
                        var TopicsListWin = window.open("", "Topics list for PR " + PR);
                        chrome.storage.local.set({"OpenedPreviewPages": OpenedPreviewPages});
                        TopicsListWin.document.body.innerHTML = "<html><head><title>List of topics in PR " + PR + "</title></head><body><H1>List of topics in PR <a href='" + document.location.href + "'>" + PR + "</a></H1>" + TopicsList + "</body></html>";                
                });               
            }
            return true;
        });
    }
    else
    {
        alert("There are no preview URLs available yet for this PR.");
    }
}