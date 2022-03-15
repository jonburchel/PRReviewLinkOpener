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

function ShowPreviewPages(Topics, Acrolinx)
{
    var TopicsList = "";
    var OpenedPreviewPages = null;
    chrome.storage.local.get("OpenPreviewPages", (ShowPreviewPages)=>{
        chrome.storage.local.get("OpenAcrolinxPages", (ShowAcrolinxPages)=>{
            chrome.storage.local.get("OpenChanges", (ShowChanges)=>{
                chrome.storage.local.get("OpenedPreviewPages",  function (ca){
                    if (ca.OpenedPreviewPages != null)
                        OpenedPreviewPages = ca.OpenedPreviewPages;
                    else
                        OpenedPreviewPages = new Array();
                    
                        for (var i = 0; i < Topics.length; i++)
                        {
                            if (Topics[i].URL != null)
                            {
                                
                                if (ShowPreviewPages.OpenPreviewPages)
                                {
                                    OpenedPreviewPages.push(Topics[i].URL);
                                    window.open(Topics[i].URL);
                                }
                                if (ShowAcrolinxPages.OpenAcrolinxPages)
                                {
                                    var AcrolinxPage = Acrolinx.find(e => e.Title == Topics[i].DocsUrl);
                                    if (AcrolinxPage != null)
                                    {
                                        OpenedPreviewPages.push(AcrolinxPage.URL);
                                        window.open(AcrolinxPage.URL);
                                    }
                                }
                                if (ShowChanges.OpenChanges)
                                {
                                    var filetype = Topics[i].DocsUrl;
                                    filetype = filetype.substring(filetype.lastIndexOf("."));
                                    console.log(filetype);
                                    if (filetype != ".png")
                                    {
                                        var PreviewUrl = document.location + "/files#diff-" + sha256(Topics[i].DocsUrl);
                                        OpenedPreviewPages.push(PreviewUrl);
                                        window.open(PreviewUrl);  
                                    }
                                }
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
            });
        });
    });              
}

function GetAcrolinx()
{
    var AcrolinxLinks = new Array();
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
        const ARTICLE_TITLE_COLUMN = 0;
        const SCORECARD_LINK_COLUMN = 4;
        for (var row = FIRST_ARTICLE_ROW; row < articleTable.rows.length; row++)
        {
            var acrolinxLink = articleTable.rows[row].cells[SCORECARD_LINK_COLUMN].innerHTML; // Get the HTML anchor tag for the Acrolinx scorecard
            var acrolinxUrl = acrolinxLink.substring(acrolinxLink.indexOf("href=\"") + 6, acrolinxLink.indexOf("\" rel=")); // Extract the URL from hte HTML anchor tag
            var acrolinxTitle = articleTable.rows[row].cells[ARTICLE_TITLE_COLUMN].innerText;
            AcrolinxLinks.push({Title: acrolinxTitle, URL: acrolinxUrl})
        }
    }
    return AcrolinxLinks;
}

var sha256 = function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value>>>amount) | (value<<(32 - amount));
    };
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length'
    var i, j; // Used as a counter across the whole file
    var result = ''

    var words = [];
    var asciiBitLength = ascii[lengthProperty]*8;
    
    //* caching results is optional - remove/add slash from front of this line to toggle
    // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
    // (we actually calculate the first 64, but extra values are just ignored)
    var hash = sha256.h = sha256.h || [];
    // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    /*/
    var hash = [], k = [];
    var primeCounter = 0;
    //*/

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
            k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
        }
    }
    
    ascii += '\x80' // Append Ƈ' bit (plus zero padding)
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00' // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j>>8) return; // ASCII check: only accept characters in range 0-255
        words[i>>2] |= j << ((3 - i)%4)*8;
    }
    words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    words[words[lengthProperty]] = (asciiBitLength)
    
    // process each chunk
    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
        var oldHash = hash;
        // This is now the undefinedworking hash", often labelled as variables a...g
        // (we have to truncate as well, otherwise extra entries at the end accumulate
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            var i2 = i + j;
            // Expand the message into 64 words
            // Used below if 
            var w15 = w[i - 15], w2 = w[i - 2];

            // Iterate
            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                + ((e&hash[5])^((~e)&hash[6])) // ch
                + k[i]
                // Expand the message schedule if needed
                + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) // s0
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)) // s1
                    )|0
                );
            // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2])); // maj
            
            hash = [(temp1 + temp2)|0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
            hash[4] = (hash[4] + temp1)|0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i])|0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i]>>(j*8))&255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
};

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
                fileend = fileend.substring(fileend.indexOf("/articles/") + 1);
            if (fileend.indexOf("/includes/") != -1)
                fileend = fileend.substring(fileend.indexOf("/includes/") + 1);
            var FileChecked = await readLocalStorageInContent("PR" + PRNum + "File/" + fileend);
            if (FileChecked == null) 
                FileChecked = true;

            if (FileChecked || AllChecked)
            {
                if (file.substring(file.length - 3) == ".md")
                {
                    function SendMessageWithPromise(){
                        return new Promise((resolve, reject) => {
                            chrome.runtime.sendMessage({MsgType: "ValidatedFile", URL: href}, function(res) {
                                Topics.push({URL: href, Title: res.pageTitle, DocsUrl: fileend});
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
                    Topics.push({URL: file, Title: file, DocsUrl: fileend});
                }
                // if (file.substring(file.length - 4) == ".yml")
                // {
                //     Topics.push({URL: null, Title: file})
                // }
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

    document.body.style.cursor = "progress";
    var img = document.createElement("img");
    img.id = "loadingimg";
    img.src = chrome.runtime.getURL('images/loading.gif');
    img.height = 50;
    img.width = 50;
    img.style = "position:absolute; top:48%; left: 48%; transform: translate(-50%, -50%);";
    document.body.appendChild(img);

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
        {
            curRow = curRow.nextElementSibling;
            console.log(curRow);
        }
        var BuildReportUrl = curRow.getElementsByTagName("a")[0].href;
        
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

            if (Topics.length > 20 && NoStoredPRFileSelection)
            {
                chrome.runtime.sendMessage({MsgType: "MoreThan20PreviewFilesEncountered"}, async response => {
                    var Topics = await BuildTopicsList(ValidatedFilesTable, false);
                    ShowPreviewPages(Topics, GetAcrolinx());
                });                
            }
            else
            {
                if (confirm("Open " + (Topics.filter(t=>t.URL != null).length) + " preview page" + (Topics.length > 1 ? "s" : "") + " for this PR?"))
                {
                    ShowPreviewPages(Topics, GetAcrolinx());
                }
            }
            return true;
        });
    }
    else
    {
        alert("There are no preview URLs available yet for this PR.");
    }
    document.body.style.cursor = "default";
    document.getElementById("loadingimg").remove();
}