var LocalStorage = {
    ifsupport : window.localStorage ? true : false,
    setItem : function(key,value){
        try{
           window.localStorage.setItem(key,value);
        }catch(e){
        }
    },
    getItem : function(key){
      try{
         return window.localStorage.getItem(key);
      }catch(e){
         return null;
      }
    },
    removeItem : function(key){
       try{
         window.localStorage.removeItem(key);
       }catch(e){
       }
    },
    checkStorage : function(key,value){
        
    },
    appendItem :function(key,value){
        try{
         var _orgVal = window.localStorage.getItem(key);
         if(!_orgVal){
            this.setItem(key,value);
            return;
         }
         var arr = _orgVal.length > 0 ? _orgVal.split(","):[];
         if(arr.length > 2){
            for(var i = 0 ; i < arr.length-2;i++){
                var _key = arr.shift();
                if(_key !== value){
                  this.removeItem(_key+"_subtitle");
                  this.removeItem(_key+"_remainTitles");
                  this.removeItem(_key+"_SUBTITLEAXIS");
                }
            }
          }
          _orgVal = arr.join(",");
          if(_orgVal.indexOf(value) < 0){
             arr.push(value);
          }
          window.localStorage.setItem(key,arr.join(","));
        }catch(e){
        }
    }
};

var Cookie = {
     set : function(key,value,expires){
        this.remove(key);
        var expStr ="";
       if(expires){
           var time = new Date().getTime();
           time += expires;
           expStr = ";expires="+new Date(time).toGMTString();
        }
        var _domain = ";domain=yxgapp.com";
        document.cookie = key + "=" + encodeURIComponent(value) + expStr+_domain;
    },

    get : function(key){
        if(document.cookie.length > 0){
            var _cstart = document.cookie.indexOf(key+"=");
            if(_cstart > -1){
                _cstart = _cstart + key.length + 1;
                var _cend = document.cookie.indexOf(";",_cstart);
                if(_cend === -1){
                    _cend = document.cookie.length;
                }
                return  decodeURIComponent(document.cookie.substring(_cstart,_cend));
            }
        }
        return "";
    },

    remove : function(key){
        if(document.cookie.length > 0){
            var _arr = document.cookie.split(";");
            for(var i = 0 ; i < _arr.length ; i++ ){
              var _iarr = _arr[i].split("=");
              if(_iarr[0] === key){
                _arr.pop(i);
                break;
              }
            }
        }
    }
};