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

        chrome.runtime.sendMessage({BuildReportUrl: BuildReportUrl}, response => {
            var buildreport = document.createElement("html");
            buildreport.innerHTML = response.buildreport;
            
            var ValidatedFilesTable = buildreport.querySelector("a[name=\"ValidatedhFiles\"]").parentElement.parentElement.parentElement.nextElementSibling.nextElementSibling;
            if (confirm("Open " + (ValidatedFilesTable.rows.length - 1) + " preview page" + (ValidatedFilesTable.rows.length > 2 ? "s" : "") + " for this PR?"))
            {
                for (var i = 1; i < ValidatedFilesTable.rows.length; i++)
                    window.open(ValidatedFilesTable.rows[i].children[2].children[0].href);
            }

            return true;
        });
    }
    else
    {
        alert("There are no preview URLs available yet for this PR.");
    }
}