// ==UserScript==
// @name       豆瓣评论 for 多看
// @namespace  
// @version    0.1
// @description  在多看的电子书页面同时显示豆瓣评论
// @match      http://www.duokan.com/book/*
// @copyright  Yang Zhaohua
// ==/UserScript==

// 封装xpath函数
function xpath(query) {
    return document.evaluate(query, document, null,
                             XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function get_previoussibling(n)
{
    x=n.previousSibling;
    while (x.nodeType!=1)
    {
        x=x.previousSibling;
    }
    return x;
}

function get_nextsibling(n)
{
    x=n.nextSibling;
    while (x.nodeType!=1)
    {
        x=x.nextSibling;
    }
    return x;
}


var bookTitle = xpath("//div[@class='desc']/h3").snapshotItem(0).innerHTML;
var book;

window.onload = function(){
    GM_xmlhttpRequest({
        method: "get",
        url: "https://api.douban.com/v2/book/search?q=" + bookTitle + "&fields=id,title,rating",
        onload: function(result) {
            var book_info = JSON.parse(result.responseText);
            if(book_info.count == "0"){
                console.log("没有该图书");
                return;
            }
            //console.log(book_info);
            //console.log(book_info.books[0].rating.average + book_info.books[0].rating.numRaters);
            book = book_info.books[0];
            setDoubanRate(book.id, book.rating.average,book.rating.numRaters);
            
            var bookId = book_info.books[0].id;
            
            setDoubanReview(bookId);
        }
    });
};



function setDoubanRate(doubanId,average,rateNumber){
    var desc = xpath("//div[@class='desc']");	
    var duokan = xpath("//div[@class='desc']/div[@class='u-stargrade']").snapshotItem(0);	
    //console.log(duokan.snapshotItem(0).innerHTML);
    
    var doubanData = document.createElement('div');
    doubanData.innerHTML = "<a  href='http://book.douban.com/subject/" + doubanId + "' target='_blank' title='去豆瓣查看该图书'>豆瓣：</a>" +
        "<em class='score' itemprop='ratingValue'> " + average + "</em>" +
        "<span class='num'> ( <span itemprop=reviewCount'>" + rateNumber + "</span>个评分 )</span>";
    //console.log(duokan);
    duokan.parentNode.insertBefore(doubanData, duokan.nextSibling);
}

var cmmlist = xpath("//div[@class='u-commlist']").snapshotItem(0);
var pager = xpath("//div[@class='m-page j-commentlist-pager']").snapshotItem(0);
var hotreview = xpath("//a[contains(.,'最热')]").snapshotItem(0);	
var newreview = xpath("//a[contains(.,'最新')]").snapshotItem(0);	
var ia,clst,article,rr,ctsh,fix;
var element1,element2,element3,element4,element5;

function setDuokanClick(){
    hotreview.onclick = function(){
        document.getElementById('doubanView').style.display='none';
        cmmlist.style.display = 'block';
        pager.style.display = 'block';
        document.getElementById('db').className = 'itm';
        //console.log('hot view click');
        _hmt.push(['_trackEvent', 'book_detail_page', 'comment_hot']);
        
        this.parentNode.className = 'itm crt';
        var clickItem = xpath("//div[@class='icn-arrow icn-arrow-top3 j-target']").snapshotItem(1);
        
        clickItem.style.left = 22 + 'px';
    };
    
    newreview.onclick = function(){
        document.getElementById('doubanView').style.display='none';
        cmmlist.style.display = 'block';
        pager.style.display = 'block';
        document.getElementById('db').className = 'itm';
        _hmt.push(['_trackEvent', 'book_detail_page', 'comment_new']);
        
        this.parentNode.className = 'itm crt';
        var clickItem = xpath("//div[@class='icn-arrow icn-arrow-top3 j-target']").snapshotItem(1);
        
        clickItem.style.left = 98 + 'px';
    };
}

function setDoubanReview(doubanId){
    setDuokanClick();
    //console.log(ul.innerHTML);
    var ul = newreview.parentNode.parentNode;
    var li = document.createElement('li');
    li.className  = 'u-sep';
    li.innerHTML = '|';
    ul.appendChild(li);
    
    var liDouban = document.createElement('li');
    liDouban.id  = 'db';
    liDouban.className  = 'itm';
    liDouban.innerHTML = "<a id='douban' href='javascript:void(0)' title='来自豆瓣'>热门评论</a>";
    ul.appendChild(liDouban);
    
    document.getElementById('douban').onclick = function(){
        cmmlist.style.display = 'none';
        pager.style.display = 'none';
        document.getElementById('doubanView').style.display='block';
        this.parentNode.className = 'itm crt';
        hotreview.parentNode.className  = 'itm';
        newreview.parentNode.className  = 'itm';
        
        var clickItem = xpath("//div[@class='icn-arrow icn-arrow-top3 j-target']").snapshotItem(1);
        
        clickItem.style.left = 168 + 'px';
    };
    
    var viewDiv = document.createElement('div');
    viewDiv.id = 'doubanView';
    viewDiv.className = 'cnt';
    viewDiv.style.display = 'none';
    cmmlist.parentNode.appendChild(viewDiv);
    
    queryDoubanReview(doubanId,viewDiv);
}



function queryFullComment(href, fullComm){
    var fullContent;
    var dom = new DOMParser();
    GM_xmlhttpRequest({
        method: "get",
        url: href,
        onload: function(result)  {
            var doc = dom.parseFromString(result.responseText,"text/html");
            
            var report = doc.getElementById('link-report');
            fullComm.innerHTML = report.innerHTML;
        }
    });
}

function queryDoubanReview(doubanId,viewDiv){
    var dom = new DOMParser();
    GM_xmlhttpRequest({
        method: "get",
        url: "http://book.douban.com/subject/" + doubanId,
        onload: function(result) {
            var doc = dom.parseFromString(result.responseText,"text/html");
            //console.log(doc.getElementById('wt_0'));
            
            var wt = doc.getElementById('wt_0');
            //console.log(wt);
            if(wt){
                //console.log(wt);
                var newView = wt.innerHTML.replace(/<h3>/g,"<h5>").replace(/<\/h3>/g,"</h5>").replace(/<br><br>/g,"<br />");
                //console.log(newView);
                viewDiv.innerHTML = newView;
                
                var title = xpath("//div[@id='doubanView']/div/div/div/h5");
                for (var h = 0; h < title.snapshotLength; h++) {
                    var element = title.snapshotItem(h);
                    var cdiv = document.createElement('div');
                    cdiv.style.float = "right";
                    element.appendChild(cdiv);
                    
                    var ca = document.createElement('a');
                    ca.className = "u-more1 j-more";
                    ca.title = "展开全文";
                    ca.innerHTML = "&nbsp;<div class='icn-arrow icn-arrow-bottom'><span class='arrow0'></span><span class='arrow1'></span></div>";
                    ca.onclick = function(){
                        this.style.display = "none";
                        this.nextSibling.style.display = "block";
                        var fullHref = get_previoussibling(this.parentNode).href;
                        
                        var lastChild = this.parentNode.parentNode.parentNode.nextSibling.nextSibling.lastChild;
                        var fullComm = get_previoussibling(lastChild);
                        var shortComm = get_previoussibling(fullComm);
                        fullComm.style.display = "block";
                        shortComm.style.display = "none";
                        
                        if(fullComm.innerHTML == ""){
                            queryFullComment(fullHref,fullComm);
                        }
                        
                        //console.log(get_previoussibling(lastChild));
                    };
                    cdiv.appendChild(ca);
                    
                    var sa = document.createElement('a');
                    sa.className = "u-more1 j-more";
                    sa.title = "缩进全文";
                    sa.style.display = "none";
                    sa.innerHTML = "&nbsp;<div class='icn-arrow icn-arrow-top'><span class='arrow0'></span><span class='arrow1'></span></div>";
                    sa.onclick = function(){
                        this.style.display = "none";
                        this.previousSibling.style.display = "block";
                        
                        var lastChild = this.parentNode.parentNode.parentNode.nextSibling.nextSibling.lastChild;
                        var fullComm = get_previoussibling(lastChild);
                        var shortComm = get_previoussibling(fullComm);
                        fullComm.style.display = "none";
                        shortComm.style.display = "block";
                    };
                    cdiv.appendChild(sa);
                    
                    //console.log(element.innerHTML);
                }
                
                //document.getElementsByClassName("ilst").remove();
                var ilist = xpath("//div[@id='doubanView']/div/div/div[@class='ilst']");
                
                for (var i = 0; i < ilist.snapshotLength; i++) {
                    var element = ilist.snapshotItem(i);
                    element.parentNode.removeChild(element);
                }
                
                ia = xpath("//a[contains(@href,'douban.com')]");
                for (var j = 0; j < ia.snapshotLength; j++) {
                    element1 = ia.snapshotItem(j);
                    element1.target = '_blank';
                }
                
                clst = xpath("//div[@class='clst']");
                for (var k = 0; k < clst.snapshotLength; k++) {
                    element2 = clst.snapshotItem(k);
                    element2.className = 'itm';
                    element2.style.paddingTop = 5 + 'px';
                }
                
                article = xpath("//div[@class='review-short']");
                for (var l = 0; l < article.snapshotLength; l++) {
                    element3 = article.snapshotItem(l);
                    element3.className = 'article';
                    element3.style.lineHeight = 24 + 'px';
                    element3.style.fontSize = 14 + 'px';
                    element3.style.color = '#666';
                    element3.style.paddingTop = 5 + 'px';
                    
                    var fullComt = get_nextsibling(element3);
                    fullComt.className = 'article';
                    fullComt.style.lineHeight = 24 + 'px';
                    fullComt.style.fontSize = 14 + 'px';
                    fullComt.style.color = '#666';
                    fullComt.style.paddingTop = 5 + 'px';
                }
                
                
                
                rr = xpath("//div[@class='rr']");
                for (var m = 0; m < rr.snapshotLength; m++) {
                    element4 = rr.snapshotItem(m);
                    element4.parentNode.removeChild(element4);
                }
                
                ctsh = xpath("//div[@class='ctsh']");
                for (var k = 0; k < ctsh.snapshotLength; k++) {
                    element5 = ctsh.snapshotItem(k);
                    element5.style.paddingTop = 20 + 'px';
                    element5.style.paddingBottom = 10 + 'px';
                    element5.style.borderBottom = "1px solid #dbd4cd";
                }
                
                fix = xpath("//div[@class='pl clearfix']");
                for (var l = 0; l < fix.snapshotLength; l++) {
                    element3 = fix.snapshotItem(l);
                    element3.style.color = '#a6978a';
                    element3.style.paddingTop = 5 + 'px';
                }
            }
            else{
                viewDiv.innerHTML ="<div class='no_comment j-comment-empty'>暂无豆瓣评论~</div>";
                
            }
            
        }
    });
}



