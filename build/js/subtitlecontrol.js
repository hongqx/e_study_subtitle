/*! estudysubtitle version1.1.0 2016-07-20  04:23:14*/
var LocalStorage={ifsupport:!!window.localStorage,setItem:function(a,b){try{window.localStorage.setItem(a,b)}catch(c){}},getItem:function(a){try{return window.localStorage.getItem(a)}catch(b){return null}},removeItem:function(a){try{window.localStorage.removeItem(a)}catch(b){}},checkStorage:function(a,b){},appendItem:function(a,b){try{var c=window.localStorage.getItem(a);if(!c)return void this.setItem(a,b);var d=c.length>0?c.split(","):[];if(d.length>2)for(var e=0;e<d.length-2;e++){var f=d.shift();f!==b&&(this.removeItem(f+"_subtitle"),this.removeItem(f+"_remainTitles"),this.removeItem(f+"_SUBTITLEAXIS"),this.removeItem(f+"_SUBTITLEAXIS_REMAIN"))}c=d.join(","),c.indexOf(b)<0&&d.push(b),window.localStorage.setItem(a,d.join(","))}catch(g){}}},Cookie={set:function(a,b,c){this.remove(a);var d="";if(c){var e=(new Date).getTime();e+=c,d=";expires="+new Date(e).toGMTString()}var f=";domain=yxgapp.com";document.cookie=a+"="+encodeURIComponent(b)+d+f},get:function(a){if(document.cookie.length>0){var b=document.cookie.indexOf(a+"=");if(b>-1){b=b+a.length+1;var c=document.cookie.indexOf(";",b);return c===-1&&(c=document.cookie.length),decodeURIComponent(document.cookie.substring(b,c))}}return""},remove:function(a){if(document.cookie.length>0)for(var b=document.cookie.split(";"),c=0;c<b.length;c++){var d=b[c].split("=");if(d[0]===a){b.pop(c);break}}}};