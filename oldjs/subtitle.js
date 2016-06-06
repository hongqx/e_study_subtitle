/**
 * subtitle处理字幕信息
 * @type {Object}
 */
var subtitle = {
    init:function(containerId,options){
        this.container =  $("#"+containerId);
        this.videoId = options.videoId;
        this.dataOk = false;
        this.options = options;
        this.userInfo = options.userInfo;
        this.storeKey = this.videoId+"_subtitle";
        this.remainKey = this.videoId+"_remainTitles";
        this.requestTime = 0;
        this.showNum = 5;
        if(videoPlayer){
          this.player = videoPlayer;
        }
        this.params = {
            videoId:this.videoId,
            token:this.userInfo.token,
            username:this.userInfo.username
        };
        var _key = this.storeKey;
        /*先获取本地存储中的数据 初始化出来*/
        if(LocalStorage.getItem(_key)){
            var _subtitle = JSON.parse(LocalStorage.getItem(_key));
            if(_subtitle){
               this.version =  _subtitle.version;
               this.data = _subtitle;
            }else{
               this.version = -1;
            }
            //this.initData(_subtitle);
        }else{
            this.version = -1;
        }
        this.initRemainTitle();
        LocalStorage.appendItem("videos",this.videoId);
        this.getData();
    },
    getData:function(){
        //if(this.dataOk) return;
        this.requestTime++;
        var _url = "http://m.yxgapp.com/d/mooc/SyncSubtitle.json",
            _self = this;
        var _params = this.params;
        _params.version = this.version;
        $.ajax({
            url:_url,
            data:_params,
            dataType:"json",
            success:function(data){
              _self.getCallback(data);
            },
            error:function(){
                if(_self.requestTime < 3){
                  setTimeout(function(){
                     _self.getData();
                   },2000);
                }
            }
        });
    },
    getCallback : function(data){
      if(!data.result.result){
        //console.log("the subtitleList is Run||"+data.result.reason);
        if(this.options && this.options.errorFun){
           this.options.errorFun(data.result);
        }else{
           alert("登录失效，请重新登录");
        }
      }else{
        //如果存在缓存 已缓存数据为标准，仅仅改变缓存数据的version
        if(this.version === -1){
           //缓存中没有数据 先讲数据进行排列处理
           data.subtitle.subtitleItems = this.queueItems(data.subtitle.subtitleItems);
           this.data = data.subtitle;
           this.version = data.subtitle.version;
           this.dataOk = true;
           this.initData();
        }else{
           //如果之前存在缓存 将获取到的数据和现在缓存中数据做比较
           this.checkLocalData(data.subtitle);
           this.initData();
        }
        LocalStorage.setItem(this.storeKey,JSON.stringify(this.data));
      }
    },
    initData : function(){
           if(this.options.onDataok){
               //数据到位之后的回调
               this.options.onDataok(this.data);
           }
           this.totalNum = this.data.subtitleItems.length;
           this.curIndex  = this.data.subtitleItems[0] ? 0 : this.getNextIndex(0);
           this.pIndex = 0;//标记位置的
           this.unComplateIndex = 0;
           this.curEndTime = this.data.subtitleItems[this.curIndex].endTime / 1000;
           this.createSubtitle(this.data.subtitleItems);
           this.setCheckTimer();//缓存定时提交计时器
           this.totalDom = this.liDomList.length;
           this.addEvent();
           this.setPositionParams();
           this.scrollToUncomplete();
    },
    initRemainTitle : function(){
        if(LocalStorage.getItem(this.remainKey)){
            var _remainSubtitle = JSON.parse(LocalStorage.getItem(this.remainKey));
            if(_remainSubtitle){
               this.remainSubtitles =  _remainSubtitle;
            }else{
               this.remainSubtitles = [];
            }
        }else{
           this.remainSubtitles = [];
        }
    },
    setPositionParams : function(){
        this.lineHeight = $(this.liDomList[0]).outerHeight();
        this.showNum =  parseInt(this.container.height() / this.lineHeight);
    },
    queueItems : function(items){
        var _len = items.length;
        var _newItems = new Array(_len);
        for(var i = 0 ; i < _len ; i++){
          var _item = this.checkItem(items[i]);
          _newItems[_item.index-1] = _item;
        }
        return _newItems;
    },
    //检查每一个新的item
    checkItem : function(_item){
      _item.sTime = this.getTimeModel(_item.startTime);
      _item.eTime = this.getTimeModel(_item.endTime);
      /*当字幕为空的时候 补充相关的信息*/
      if(!_item.baseSubtitleItem){
         _item.baseSubtitleItem = {
            subtitleItemId: _item.id,
            historyType : 1,
            content:"",
            isDifficult : 3,
            autoCaption : 0,
        };
      }
      if(!_item.extSubtitleItem){
        _item.extSubtitleItem = {
            subtitleItemId: _item.id,
            historyType : 2,
            content:"",
            isDifficult : 3,
            autoCaption : 0
        };
      }
      return _item;
    },
    scrollToUncomplete : function(){
        var _index = $(this.liDomList[this.unComplateIndex]).attr("data-index");
        var _startTime = this.data.subtitleItems[parseInt(_index)].startTime / 1000;
        videoPlayer.setStartTime(_startTime);
        this.changeCurItem(this.unComplateIndex);
        $(this.liDomList[this.unComplateIndex]).find(".ch-area").focus();
    },
    /*获取线上数据之后和本地数据进行对比*/
    checkLocalData : function(newSubtitle){
        var _subTitleItems  = newSubtitle.subtitleItems,
            _len = _subTitleItems.length;
        for(var i = 0 ; i < _len ; i++){
           var _item = _subTitleItems[i];
           var _index = _item.index - 1;
           if(_item.version > this.data.subtitleItems[_index].version){
               _item = this.checkItem(_item);
               this.data.subtitleItems[_index] = _item;
           }
        }
        if(newSubtitle.version > this.data.version){
           this.data.version = newSubtitle.version;
           this.version = newSubtitle.version;
        }
    },
    getNextIndex : function(lastIndex){
       var tag = false,
          _nextindex = lastIndex+1;
       while(!tag && _nextindex < this.totalNum){
          if(!this.data.subtitleItems[_nextindex]){
            _nextindex++;
          }else{
            tag =  true;
          }
       }
       return _nextindex;
    },
    addEvent : function(){
        //如果已经绑定过事件  不在做绑定
        if(this.eventOk){
           return;
        }
        this.eventOk =  true;
        var _self = this;
        this.container.delegate("li","click",function(e){
            //console.log("liClick");
            _self.changeIndex($(this),e);
            return false;
        });
        this.container.delegate(".ch-area","click",function(e){
           //console.log("ch-area click");
           //$(this).focus();
           _self.chClick($(this),e);
           return false;
        });
        this.container.delegate(".ch-area","focus",function(e){
           //console.log("ch-area focus");
           _self.edit = true;
           _self.editType = "ch";
           return false;
        });
        this.container.delegate(".ch-area","blur",function(e){
           //console.log("ch-area blur");
           _self.chBlur($(this),e);
           return false;
        });

        //英文显示部分交互
        this.container.delegate(".en-txt","dblclick",function(e){
          _self.enClick($(this),e);
          return false;
        });
        this.container.delegate('.en-area','blur',function(e){
          _self.enBlur($(this),e);
          return false;
        });
        this.addKeyDownEvent();

    },
    /*添加键盘tab事件的处理*/
    addKeyDownEvent : function(){
        var _self = this;
        document.onkeydown = function(event){
            var e = event || window.event || arguments.callee.caller.arguments[0];
            if(e.shiftKey && e.keyCode == 9 ){
                _self.tabClick(event,false);
            }else if(e && e.keyCode == 9){ // 按 Tab 
                _self.tabClick(event,true);
            }
            
        };
    },
    tabClick : function(event,type){
        var _pindex = 0;
        if(type){
            _pindex = (this.pIndex+1 < this.totalDom) ? (this.pIndex+1) : this.pIndex;
        }else{
            _pindex = (this.pIndex-1 >= 0) ? (this.pIndex-1) : this.pIndex;
        }
        var _target = $(this.liDomList[_pindex]);
        var _textArea = _target.find(".ch-area");
        if(_pindex === this.pIndex){
          _textArea.focus();
          return;
        }
        _textArea.click();
    },
    changeIndex : function(target, e){
        //console.log("changeIndex:"+target.attr("data-index"));
        var _isPause = this.player.isPause();
        if(_isPause){
            this.seekVideo(target.attr("data-index"));
        }
        this.changeCurItem(target.attr("data-pindex"),e);
        return false;
    },
    chClick : function(target, e){
        this.edit = true;
        this.editType = "ch";
        this.changeIndex(target,e);
        return false;
    },
    chBlur : function(target, e){
        //console.log("chBlur");
        this.edit = false;
        this.editType = null;
        var _index = parseInt(target.attr("data-index"));//this.curIndex;
        var _subtitle = this.data.subtitleItems[_index];
        var val = this.fillStr(target.val());
        target.val(val);
        if(_subtitle.extSubtitleItem.content !== val){
            _subtitle.extSubtitleItem.content = val;
            _subtitle.extSubtitleItem.updateTime = parseInt(new Date().getTime()/1000);
            _subtitle.extSubtitleItem.username = this.userInfo.username;
            _subtitle.extSubtitleItem.userNickname = this.userInfo.nickname;
            _subtitle.extSubtitleItem.autoCaption = 0;
            _subtitle.extSubtitleItem.isDifficult = 3;
            this.saveSubtitle(_subtitle.extSubtitleItem,_index);
        }
    },
    enClick : function(target, e){
        //console.log("enClick");
        this.edit = true;
        //var _this = $(this),
        this.editType = "en";
        val = target.text();
        target.hide();
        target.siblings(".en-area").val(val).show().focus();
        this.changeIndex(target,e);
        return false;
    },
    enBlur : function(target, e){
        //console.log("enBlur");
        this.edit = false;
        this.editType = null;
        val = this.fillStr(target.val());
        target.hide();
        target.siblings('.en-txt').text(val).show();
        //包含中文 不做更新
        if(/.*[\u4e00-\u9fa5]+.*$/.test(val)){
           //target.val(target.siblings('.en-txt').val());
           target.siblings('.en-txt').addClass("en-error");
           return;
        }
        target.siblings('.en-txt').removeClass("en-error");
        var _index = parseInt(target.attr("data-index"));
        var _basesubtitle = this.data.subtitleItems[_index].baseSubtitleItem;
        if(_basesubtitle.content !== val && val !== ""){
            _basesubtitle.content = val;
            _basesubtitle.updateTime =  parseInt(new Date().getTime()/1000);
            _basesubtitle.autoCaption = 0;
            _basesubtitle.username = this.userInfo.username;
            _basesubtitle.userNickname = this.userInfo.nickname;
            _basesubtitle.isDifficult = 3;
            this.saveSubtitle(_basesubtitle,_index);
        }
    },
    changByTime : function(_time){
        if(this.edit && this.curEndTime < _time){
           this.player.pause();
        }
        if(!this.edit && this.curEndTime < _time && (this.pIndex+1) < this.totalDom){
           var _nextpindex = this.pIndex+1;
           this.changeCurItem(_nextpindex);   
        }
    },
    changeCurItem : function(_pindex,e){
        _pindex = parseInt(_pindex);
       $(this.liDomList[this.pIndex]).removeClass("active");
       var _dom = $(this.liDomList[_pindex]);
       _dom.addClass("active");
       var _index = parseInt(_dom.attr("data-index"));
       this.curEndTime = this.data.subtitleItems[_index].endTime /1000;
       this.scroll(_pindex);
       e ? this.seekVideo(_index) : "";
       this.curIndex = _index;
       this.pIndex = _pindex;
    },
    scroll : function(_index){
        var _top = _index === 0 ? 0 : (_index - 1) * this.lineHeight;
        this.container.mCustomScrollbar("scrollTo",_top);
    },
    seekVideo : function(_index){
        var _time = this.data.subtitleItems[_index].startTime;
        this.player.seek(_time/1000);
    },
    getTimeModel : function(_time){
        var _secondNum = parseInt(_time / 1000 ) ;
        var _minutes = parseInt(_secondNum / 60 );
        var _hours = parseInt(_minutes / 60 );
        _minutes = _minutes > 9 ? _minutes : ("0"+_minutes);
        _secondNum = _secondNum % 60;
        _secondStr = _secondNum > 9 ? _secondNum  : ("0"+_secondNum);
        if(_hours > 0){
          return  _hours+":"+_minutes+":"+_secondStr;
        }else{
          return _minutes+":"+_secondStr;
        }
    },
    fillStr : function(str){
       str = str.replace(/^\s+|\s+$/g,'');
       str = str.replace(/^\n+|\n+$/g,'');
       return str;
    },
    createSubtitle : function(subtitleItems){
       var _len = subtitleItems.length;
       this.ulDom = this.container.find("ul").length === 0 ? $(document.createElement("ul")) : $(this.container.find("ul")[0]);
       this.ulDom.css({positon:"relative",top:0,left:0});
       var _pindex = 0;//标识位置的参数
       for(var i = 0 ; i < _len ; i++){
        var _liDom = document.createElement("li"),
            _domArr = [],
            _item = subtitleItems[i];
        if(!_item){
           continue;
        }
        var _index = _item.index;
        $(_liDom).attr("data-pindex",_pindex);
        $(_liDom).attr("data-index",(_index-1));
        if(i === this.curIndex){
           $(_liDom).addClass("active");
        }
        _domArr.push('<div class="trans-en">');
        _domArr.push('<div class="sign clearfix">');
        _domArr.push('<div class="gather circle fl"></div>');
        _domArr.push('<span class="dur-time fl">'+_item.sTime+'</span>');
        if(_item.baseSubtitleItem){
          _item.baseSubtitleItem.autoCaption === 1 ? _domArr.push('<div class="gather auto fl"></div>') : _domArr.push("");
          _domArr.push('</div>');
          _domArr.push('<div data-index="'+(_index-1)+'" data-pindex = "'+_pindex+'" class="en-txt">'+_item.baseSubtitleItem.content+'</div>');
          _domArr.push('<textarea class="en-area" data-index="'+(_index-1)+'"data-pindex = "'+_pindex+'"></textarea>');
          _domArr.push('</div>');
        }
        _domArr.push('<div class="trans-ch"><div class="sign clearfix">');
        _domArr.push('<div class="gather circle fl"></div>');
        if(_item.extSubtitleItem) {
          _item.extSubtitleItem.isDifficult === 2 ? _domArr.push('<div class="gather square fl"></div>') : _domArr.push("");
          _domArr.push('</div>');
          _domArr.push('<textarea data-index = "' + (_index-1) + '" data-pindex = "'+_pindex+'" class="ch-area"');
          //_item.extSubtitleItem.content === "" ? _domArr.push(' autofocus="autofocus">') : _domArr.push('>');
          _domArr.push('>');
          _domArr.push(_item.extSubtitleItem.content + '</textarea>');
          _domArr.push("</div>");
        }

        $(_liDom).html(_domArr.join(""));
        if(_item.extSubtitleItem.content === "" && this.unComplateIndex === 0 ){
           //$(_liDom).find(".ch-area").attr("autofocus","autofocus");
           this.unComplateIndex = _pindex;
        }
        this.ulDom.append(_liDom);
         _pindex++;
       }
        this.container.html(this.ulDom);
        this.liDomList = this.container.find("li");
        this.container.mCustomScrollbar({
          theme:"my-theme",
          mouseWheel:{scrollAmount:131},
        });
    },
    postData : function(version,newSubtitle){
        if(!version || !newSubtitle || newSubtitle.length === 0){
            return;
        }
        var url = "";
        var _params = {};
        _params.token = this.params.token;
        _params.username = this.params.username;
        _params.videoId = this.params.videoId;
        _params.version = version;
        _params.newSubtitle = JSON.stringify(newSubtitle);
        var _self = this;
        $.ajax({
         url:'http://m.yxgapp.com/d/mooc/SyncSubtitle.json',
         data:_params,
         type:"POST",
         dataType:"json",
         success:function(data){
           //console.log("提交成功："+data);
           if(data.result.result){
               //提交成功重置数据
               _self.resetSubTitleItems(data);
           }else{
              //存储编辑过的字幕信息
              _self.setRemainSubTitles(newSubtitle);
              if(_self.options && _self.options.errorFun){
                 _self.options.errorFun(data.result);
              }else{
                 alert("登录失效，请重新扫码登录");
              }
           }
         },
         error:function(data){
           //存入缓存
           _self.setRemainSubTitles(newSubtitle);
         }
       });
    },
    //定时检查当前缓存中是否存在未提交的数据
    setCheckTimer : function(){
        //console.log("定时提交遗留数据");
        var _self = this;
        if(this.remainSubtitles.length > 0){
           //console.log("提交遗留的数据"+this.remainSubtitles);
           this.postData(this.version, this.remainSubtitles);
           this.remainSubtitles = [];
           LocalStorage.removeItem(this.remainKey);
        }
        this.timer = setTimeout(function(){
            _self.setCheckTimer();
        },1000*120);
    },
    /*用于更新未提交的数据*/
    setRemainSubTitles : function(subtitles){
        var _len = this.remainSubtitles.length,
            _slen = subtitles.length;
        for(var i = 0 ; i <_slen ; i++){
           var id =  subtitles[i].id;
           var _ifsame = false;
           for(var j= 0; j < _len ; j++){
              if(this.remainSubtitles[j].id === subtitles[i].id){
                 this.remainSubtitles[j] = subtitles[i];
                 _ifsame = true;
                 break;
              }
           }
           if(!_ifsame){
              this.remainSubtitles.push(subtitles[i]);
           }
        }
        //this.remainSubtitles = this.remainSubtitles.concat(subtitles);
        LocalStorage.setItem(this.remainKey , JSON.stringify(this.remainSubtitles));
    },
    saveSubtitle : function(subtitle,_index){
       if(parseInt(subtitle.historyType) === 1){
          this.data.subtitleItems[_index].baseSubtitleItem = subtitle;
       }else{
          this.data.subtitleItems[_index].extSubtitleItem =  subtitle;
       }
       this.data.subtitleItems[_index].version = this.data.version;
       LocalStorage.setItem(this.storeKey,JSON.stringify(this.data));
       var _version = this.data.version;
       var _newSubtitle = [];
       _newSubtitle.push(subtitle);
       this.postData(_version,_newSubtitle);
    },
    //用户提交成功之后，重置信息
    resetSubTitleItems : function(data){
       this.data.version = data.subtitle.version;
       this.version = this.data.version;
       if(data.subtitle.subtitleItems.length > 0){
          var _subtitleItems = data.subtitle.subtitleItems;
          this.checkLocalData(data.subtitle);
        }
        LocalStorage.setItem(this.storeKey,JSON.stringify(this.data));
    },
    resetOption : function(){
       this.changeCurItem(0);
    }
};