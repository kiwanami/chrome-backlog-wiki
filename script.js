// Backlog Wiki
//
// LICENSE
//    Copyright (c) 2011 Masashi Sakurai. All rights reserved.
//    http://www.opensource.org/licenses/mit-license.php
// 
// Time-stamp: <2011-07-23 00:38:51 sakurai>

var url = location.href;
var projectKey = getProjectKey();

function getProjectKey() {
    var m = url.match(/\/(projects|find|file|subversion|add|wiki)\/([^?/]+)/);
    if (m) return m[2];
    m = url.match(/^(.*)\/[a-zA-Z]+.action.*projectKey=([^&]*)/);
    if (m) return m[2];
    var elm = document.getElementById("navi-home");
    if (elm) {
        m = elm.href.match(/\/projects\/(.*)$/);
        if (m) return m[1];
    }
    return "[unknown]";
}

//==================================================
// wikiのタグ表示を改善

if (url.match(/FindWiki.action/)) {
    improveTagList();
}

function addResultStyle() {
    addStyle("table.view td {line-height: 100%; padding: 2px 4px; border-bottom: 0px}");
    addStyle("table.view td a {}");
    addStyle("table.view tr.odd {background-color:#F0F0F0;}");
    addStyle("table.view tr.even {background-color:#FFF;}");
    addStyle("span.title { font-size:0.875em; }");
    addStyle("span.timestamp, span.content { color:#666666; font-size:0.75em;}");
    addStyle("#bodyRight .right_content { font-size:1em; line-height:110%; }");
}

function improveTagList() {
    $X("//table[@class='view']").forEach( function(item, index) {layoutResultTable(item);});
    addResultStyle();
}

function layoutResultTable(element) {
    function makeList(tr) {
        var td = tr.getElementsByTagName("td")[0];
        var title,time;
        for(var i=0,j=td.childNodes.length;i<j;i++) {
            var c = td.childNodes[i];
            if (c && c.className) {
                if (c.className == "title") {
                    title = c;
                } else if (c.className == "timestamp") {
                    time = c;
                }
            }
        }
        td.innerHTML = "";
        td.appendChild(title);
        var td2 = E("td");
        td2.appendChild(time);
        tr.appendChild(td2);
    }

    var trs = element.getElementsByTagName("tr");
    for(var i=0;i<trs.length;i++) {
        var tr = trs[i];
        makeList(tr);
        tr.className = (i % 2 == 1) ? "odd" : "even";
    };
}

//==================================================
// Wiki menu

if (url.match(/\/(wiki\/|FindWiki.action)/)) {
    shrinkPageList();
    addMenu();
    addIncrementalSearch();
    addResultStyle();
}

function addIncrementalSearch() {
    var submenu = 
		$X("//div[@class='subMenu']")[0] ||
		$X("//div[@class='pageNavi']")[0];
    var resultElm = E("div",{id: "searchResults"});
    submenu.parentNode.insertBefore(resultElm,submenu);
    
    var searchField = document.getElementById("wikisearch");
    var lastTextValue = searchField.value;
    var fixedTextValue = lastTextValue;
    setInterval(
        function() {
            var current = searchField.value;
            //2回同じだったら検索する（入力途中は検索させない）
            if (current != lastTextValue) {
                lastTextValue = current;
            } else if (lastTextValue != fixedTextValue) {
                fixedTextValue = lastTextValue;
                isearchWiki(current,resultElm);
            }
        },400);
}

function isearchWiki(text,resultElm) {
    if (text == "") {
        resultElm.innerHTML = "";
        return;
    }
    
    var form = document.forms[1];//FindWiki.action
    xmlhttpRequest(
        {
            method: 'get',
            url: form.action+"?projectKey="+projectKey+"&query="+encodeURIComponent(text),
            overrideMimeType: document.contentType+"; charset="+document.characterSet,
            onload: function(details){
                replaceSearchResult(details.responseText);
            }
        });
    function replaceSearchResult(responseText) {
        resultElm.innerHTML = "<h4>Search Results</h4><br class='clear'/>"+scrapingResults(responseText);
        var tables = resultElm.getElementsByTagName("table");
        if (tables) {
            layoutResultTable(tables[0]);
        }
    }
    function scrapingResults(wholeText) {
        var m = wholeText.match(/<table class="view">([\s\S]*?)<\/table>/);
        return (m) ? m[0] : "No results...";
    }
}

function shrinkPageList() {
	var titleElm = $X("//div[@id='bodyRight']/h4")[2];
    if (!titleElm) return;
    var body = $X("//div[@id='bodyRight']/div[@class='right_content']")[2];
    var showFlag = false;
    body.style.display = 'none';
    titleElm.addEventListener("click",function(ev) {
        if (!showFlag) {
            body.style.display = 'block';
        } else {
			body.style.display = 'none';
        }
        showFlag = !showFlag;
    },false);
}

function addMenu() {
    var baseUrl;
    var m = url.match(/^(.*\/wiki\/[^/]*)/);
    if (m) {
        //wikiクリック
        baseUrl = m[1];
    } else {
        //tagクリック
        m = url.match(/^(.*)\/FindWiki.action.*projectKey=([^&]*)/);
        if (!m) return;
        baseUrl = m[1]+"/wiki/"+m[2];
    }
    if (url.match(/(query|tagName)/)) {
        //FindWiki.cssにはloom.cssが無い...
        var link = E("link",{href    :"/styles/common/loom.R20080930.css",
                             rel     : "stylesheet",
                             type    : "text/css",
                             charset : "utf-8"});
        var head = document.getElementsByTagName('head')[0];
        head.appendChild(link);
    }
    retrieveDigestText(baseUrl+"/Menu");

    function retrieveDigestText(href) {
        console.log(href);
        xmlhttpRequest({
            method: 'get',
            url: href,
            overrideMimeType: document.contentType+"; charset="+document.characterSet,
            onload: function(details){
                var menuHTML = scrapingMenu(details.responseText);
                if (menuHTML) {
                    addMenuArea(menuHTML);
                }
            }
        });
    }
    function scrapingMenu(wholeText) {
        var m = wholeText.match(/<div id="loom" class="loom">([\s\S]*)<\/div><!-- End loom -->/);
        return (m) ? trim(m[1]) : null;
    }
    function trim(t) {
        return t.replace(/^\s*/,"").replace(/\s*$/,"");
    }
    function addMenuArea(html) {
        var outer = document.getElementById("bodyRight");
        if (!outer) return;
        var titleElm = outer.getElementsByTagName("span")[0];
        titleElm.innerHTML = "Menu";
        var contentElm = outer.getElementsByTagName("div")[2];
        var menuElm = document.createElement("div");
        menuElm.className = "loom";
        menuElm.innerHTML = html;
        contentElm.insertBefore(menuElm,contentElm.childNodes[2]);
    }
}

// utility

function $X(xpath, node) {
	node = node || document;
    var res = node.evaluate(xpath, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var copy = [];
    for (var i=0, j=res.snapshotLength; i<j; i++) {
        copy.push(res.snapshotItem(i));
    }
    return copy;
}

//==================================================

function xmlhttpRequest(param) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(data) {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				param.onload && param.onload(xhr);
			} else {
				param.onerror && param.onerror(xhr);
			}}};
	if (param.overrideMimeType) {
		xhr.overrideMimeType(param.overrideMimeType);
	}
	xhr.open(param.method, param.url, true);
	xhr.send();
}


function addStyle(styles) {
	var S = document.createElement('style');
	S.type = 'text/css';
	var T = ''+styles.replace(/;/g,' !important;')+'';
	T = document.createTextNode(T);
	S.appendChild(T);
	document.body.appendChild(S);
	return;
}

function E(tag,attrs,children) {
    var elm = document.createElement(tag);
    for(var i in attrs) {
        if ("id className textContent".indexOf(i) >= 0) {
            elm[i] = attrs[i];
        } else {
            elm.setAttribute(i,attrs[i]);
        }
    }
    if (children) {
        for(var i=0;i<children.length;i++) {
            elm.appendChild(children[i]);
        }
    }
    return elm;
}

function collectElements( tagName, className, /* option */ childTag ) {
    var es = document.getElementsByTagName(tagName);
    var ret = [];
    for (var i = 0; i < es.length; i++) {
        var el = es[i];
        if (el.className == className) {
            if (childTag) {
                var e = el.getElementsByTagName(childTag)[0];
                if (e) {
                    ret.push(e);
                }
            } else {
                ret.push(el);
            }
        }
    }
    return ret;
}
