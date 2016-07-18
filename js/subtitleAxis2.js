define(['jquery','peaks','utility','segmentPart','mCustomScrollbar'], function ($, Peaks, utility, segmentPart,mCustomScrollbar){
  var subtitleAxis = {};
  window.subtitleAxis = subtitleAxis;
  //相关接口数据
  subtitleAxis.urls = {
      updateS : "​http://m.yxgapp.com/d/mooc/UpdateSubtitleAxis.json",         //时间轴上传
      update : "​http://m.yxgapp.com/d/mooc/UpdateSubtitle.json",              //字幕上传
      doload : "http://m.yxgapp.com/mooc/{@videoId}/DownloadSubtitle.json"  ,             //已合成的字幕下载
      getState :"http://m.yxgapp.com/mooc/GetStaticSubtitleState.json"        //字幕静态化状态获取
  };

  /************私有方法和参数*******************/
  //dom结构模板
  var limodel = [
            '<li class="{@class}" id="{@textId}" data-index={@data-index} data-id={@textId}>',
                  '<div class="subtitle">',
                      '<div class="subspan">',
                            '<span class="start-time">{@startTime}</span>',
                      '</div>',
                      '<div class="sub-content" data-index={@data-index}>',
                           '<textarea data-index="{@data-index}" name="" cols="30" rows="10" placeholder="edit...">{@content}</textarea>',
                           '<div class="txt">{@content}</div>',
                      '</div>',
                      '<div class="subspan">',
                          '<span class="js_wps">{@wps}</span>',
                          '<span class="js_alltime">{@alltime}seconds</span>',
                          '<span class="js_wordsCount">{@word}word</span>',
                          '<span class="delete-icon" data-id={@textId}>——</span>',
                      '</div>',
                  '</div>',
                  '<div class="buttomline"></div>',
            '</li>'
    ].join('');

  /**
   * 显示提示信息
   * @param  {[type]} msg 提示内容文本
   * @return {[type]}     null
   */
  var showNote = function(msg){
      $("#js_mask").show();
      if(msg){
         $("#js_note .layui-layer-content").html(msg);
      }
      $("#js_note .layui-layer-btn").hide();
      $("#js_note").show();
  };
  
  /**
   * 隐藏提示信息
   * @return {[type]} [description]
   */
  var hideNote = function(){
         $("#js_mask").hide();
         $("#js_note").hide();
  };

  /**
   * 房发起ajax请求
   * @param  {[type]} _url           接口链接
   * @param  {[type]} _params        参数
   * @param  {[type]} _successback   成功函数的名字
   * @param  {[type]} _errorcallback 错误回调函数的名字
   * @param  {[type]} _getType       请求类型 POST/GET
   * @return {[type]}                null
   */
  var getAjax = function(_url, _params ,_successback , _errorcallback,_getType){
      var _type = _getType==1 ? "POST" : "GET";
      var _self = subtitleAxis;
      $.ajax({
        url : _url,
        data: _params,
        type:_type,
        dataType:"json",
        success : function(data){
            console.log("getData success | "+_url+" | "+_params);
            _successback ? _self[_successback](data) : console.log(data);
        },
        error : function(data){
           console.error("getData error | "+_url+" | "+_params);
           _errorcallback ? _self[_errorcallback](data) : console.log(data);
        }
      });
  };
  //
  subtitleAxis.init = function(options,containerId){
    this.options = options;
    this.containerId = containerId;
    this.container = $(containerId);

    //本地存储key 整体数据存储
    this.localKey = this.options.videoId + "_SUBTITLEAXIS";

    //提交字幕失败的时候的数据存储key
    this.remainKey =  "REMAIN_SUBTITL";

    //提交时间轴数据失败的时候的本地存储key
    this.remainSKey = "REMAIN_SUBTITLEAXIS";
    this.baseLanguage = options.language;

    this.staicState = true; //字幕静态化状态 初始 需要获取数据
    
    //用于存储新的时间轴
    this.newSegments = [];  //存储未提交的时间轴信息
    this.newSubtitles = [];   //存储未提交的字幕数据
    this.getServerSubTitles();    //获取服务端数据
    return this;
  };
  
  /**
   * 获取服务端已经合成的字幕数据
   * @return {[type]} [description]
   */
  subtitleAxis.getServerSubTitles =  function(){
      //如果检测到当前的本地存储中没有字幕时间轴信息 直接获取
      if(!LocalStorage.getItem(this.localKey) || this.staicState){
          var params = {
              videoId : this.options.videoId,
              userName : this.options.userName,
              token : this.options
          };
          var _url  = this.urls.doload;
          _url = _url.replace("{@videoId}",this.options.videoId);
          getAjax(_url, {}, "downLoadSubTitlesCallBack");
      //检测到本地有存储的字幕数据，先判断线上的字幕是否有更新
      }else{
          this.getStaticState();
      }

      //启动时间轴数据检测提交轮循
      //this.startPostInterval();
      //this.saveSubtitle();

      //启动字幕更新数据检测提交轮循
      
  };
  /**
   * 下载视频相关的字幕数据处理回调
   * @return {[type]} [description]
   */
  subtitleAxis.downLoadSubTitlesCallBack = function(data){
      var _subtitle = null;
      if(data.result && data.subtitle){
           //this.mergeLocalItems(data.subtitle);
          _subtitle = data.subtitle;
      }
      //处理规范下载的字幕数据
      this.subtitles =  this.dealLoadSubTitle(_subtitle);
      //var _newSubtitle  = this.dealLoadSubTitle(_subtitle);
      //与本地存储的数据合并
      //this.mergeLocalItems(this.subtitles);
      //初始化时间轴
      this.initSegments();

      //初始化dom结构
      this.initDom();
      
      //更新播放器的播放时间段
      var _item = this.subtitles.subtitleItems[this.curIndex];
      this.changePlayerTime(_item.startTime, _item.endTime);

      //进行相关事件的绑定
      this.addEvent();
      //快捷键绑定
      this.addKeyDownEvent();
      //启动提交检查机制
      this.startPostInterval();
  };
  
  /**
   * 重构从数据接口下载下来的字幕数据
   * @param  {[type]} subtitle [Object]
   * @return {[type]}          [Object]  返回处理好格式的字幕
   */
  subtitleAxis.dealLoadSubTitle = function(subtitle){
      var _newSubtitle = {
      };
      if(!subtitle){
         _newSubtitle.timeStamp = Math.ceil(new Date().getTime()/1000);
         _newSubtitle.baseLanguage = this.baseLanguage;
         _newSubtitle.subtitleItems  = [];
         _newSubtitle.segments = [];
      }else{
         _newSubtitle.timeStamp = subtitle.subtitleTimestamp;
         _newSubtitle.baseLanguage = this.baseLanguage;
         _newSubtitle.subtitleItems = [];
         _newSubtitle.segments = [];
         var i = 0,
             _len =  subtitle.subtitleItems.length;
         for(; i < _len ;i++){
            var _item  = subtitle.subtitleItems[i],
                j = 0,
                _iLen = _item.data.length;
            var _newItem = {},
                _newseg = {};
            _newItem.startTime = _item.startTime ;
            _newItem.endTime = _item.endTime ;

            _newseg.startTime = _item.startTime / 1000;
            _newseg.endTime = _item.endTime / 1000;
            //_newseg.id = _item.id;
            _newseg.editable = true;
            _newseg.id = _item.id;
            _newseg.segmentId = _item.id;
            _newItem.subtitleItemId = _item.id;
            _newItem.isDifficult =  3;
            if(_iLen === 0){
                 _newItem.content = "";
                 _newItem.language = this.baseLanguage;
            }else{
                for( ; j < _iLen ; j++){
                   if(_item.data[j].language === this.baseLanguage){
                      _newItem.content = _item.data[j].content;
                      _newItem.explanation = _item.data[j].explanation;
                      _newItem.language =  _item.data[j].language;
                      _newItem.updateTime = _item.data[j].updateTime;
                      _newItem.username  =  _item.data[j].username;
                      _newItem.userNickname = _item.data[j].userNickname;
                      continue;
                   }
                }
            }
            
            _newSubtitle.subtitleItems.push(_newItem);
            _newSubtitle.segments.push(_newseg);
         }
      }
      return _newSubtitle;
  };
    
  /**
   * 获取字幕静态化状态
   * @return {[type]} [description]
   */
  subtitleAxis.getStaticState = function(){
    var params = {
      videoId : this.options.videoId,
      userName : this.options.userName,
      token : this.options
    };
    getAjax(this.urls.getState, params, "staticStateCallBack");
  };
  
  /**
   * 获取字幕静态化状态回调函数
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.staticStateCallBack = function(data,type){
      if(type === 'error'){
          
      }else{
         if(data.result && !data.result.result){
            this.options.errorCallBack ? this.options.errorCallBack("登陆凭证过期，请重新登陆") : this.showNote("字幕静态化数据获取失败");
         }else{
            this.staicState = data.subtitleResult;
            this.getServerSubTitles();
         }
      }
  };
  
  /**
   * 合并本地存储的字幕数据   如何合并待定
   * @return {[type]} [description]
   */
  subtitleAxis.mergeLocalItems = function(subtitle){
      
  };
  
  /**
   * 初始化时间轴
   * @return {[type]} [description]
   */
  subtitleAxis.initSegments = function(){
     // TODO 再看是否有必要留着
    window.globalSegments = {};
    // 储存根据starttime排序的片段，数值为{id: '', startime: ''}
    window.orderedSegments = [];
    var options = {
      container: document.getElementById('peaks-container'),
      mediaElement: document.querySelector('video'),
      dataUri: {
        arraybuffer: 'http://cdn.yxgapp.com/wave_map_file/'+this.options.videoId+'.dat',
        json: 'http://cdn.yxgapp.com/wave_map_file/'+this.options.videoId+'.json'
      },
      keyboard: false,
      height: 150,
      // Colour for the overview waveform rectangle that shows what the zoom view shows
      overviewHighlightRectangleColor: 'red',
      // Colour for the zoomed in waveform
      zoomWaveformColor: 'rgba(0, 225, 128, 1)',
      // Colour for the overview waveform
      overviewWaveformColor: '#F7F3F3',
      // Colour of the play head(move line)
      playheadColor: 'rgba(0, 0, 0, 1)',
      // Colour of the axis gridlines
      axisGridlineColor: '#ccc',
      // Colour of the axis labels
      axisLabelColor: '#aaa',
      // 覆盖在总体波形图上面的矩形宽度
      zoomLevels: [512, 1024, 2048, 4096],
      pointMarkerColor:     'red', //Color for the point marker
      /**
       * Colour for the in marker of segments
       */
      //inMarkerColor:         'black',
      /**
       * Colour for the out marker of segments
       */
      segments : this.subtitles.segments,
      outMarkerColor:        'red',
    };
    this.peaksInstance = Peaks.init(options);
    this.peaksInstance.zoom.zoomOut();
     var _self = subtitleAxis;
    this.peaksInstance.on('segments.dragged', function (segment) {
      console.log("-------"+segment);
      segmentPart.draggSegment(_self.peaksInstance, segment);
      //peaksInstance.waveform.segments.updateSegments();
    });
    this.peaksInstance.on('dbclickAddSegment', function () {
        segmentPart.addSegment(_self.peaksInstance);
    });
      /**************使用segments和peakURLs 初始化时间轴**************/
      //初始化时间轴
  };


  /**********************************************************************
   *   DOM 操作部分
   **********************************************************************/

  /**
   * 初始化整个结构
   * @return {[type]} [description]
   */
  subtitleAxis.initDom = function(){
      this.curIndex  = 0;
      var _subtitleItems = this.subtitles.subtitleItems,
          i = 0,
          _len = _subtitleItems.length;
      this.liList = [];
      this.ulDom = this.container.find("ul").length === 0 ? $(document.createElement("ul")) : $(this.container.find("ul")[0]);
      this.ulDom.css({positon:"relative",top:0,left:0});

      for(; i < _len ;  i++){
          var _segmentObj = _subtitleItems[i];
          var _duration = ((_segmentObj.endTime - _segmentObj.startTime)/1000).toFixed(1);
          var _class = i=== this.curIndex ? "active" : "";
          var _content = _segmentObj.content ? _segmentObj.content : "";
          var _wps = Math.ceil(_content.length / _duration)+"WPS";
          var _liStr = limodel.replace('{@startTime}', this.getTimeModel(Math.ceil(_segmentObj.startTime/1000)))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@wps}', _wps)
                 .replace('{@word}',_content.length)
                 .replace('{@class}',_class)
                 .replace('{@content}',_content)
                 .replace('{@content}',_content)
                 .replace('{@data-index}', i)
                 .replace('{@data-index}', i)
                 .replace('{@data-index}', i);
          //this.liList.push(_liStr);
          $(this.ulDom).append(_liStr);
      }
      this.container.html(this.ulDom);
      this.lis = $(this.container).find("li");
      this.container.mCustomScrollbar({
          theme:"my-theme",
          mouseWheel:{scrollAmount:131},
      });
  };
 
  /**
   * 根据字幕插入索引和字幕数据，在dom中插入一条数据
   * @param {Int} index       字幕需要插入的索引位置
   * @param {Object} newSubtitle 要插入的新字幕数据
   */
  subtitleAxis.addLiDom = function(index, newSubtitle){
      var _duration = ((newSubtitle.endTime - newSubtitle.startTime)/1000).toFixed(1);
      var _wps = Math.ceil(newSubtitle.content.length / _duration)+"WPS";
      var _class = "active";
      var _liStr = limodel.replace('{@startTime}', this.getTimeModel( Math.ceil(newSubtitle.startTime/1000 )))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', newSubtitle.subtitleItemId)
                 .replace('{@textId}', newSubtitle.subtitleItemId)
                 .replace('{@textId}', newSubtitle.subtitleItemId)
                 .replace('{@wps}', _wps)
                 .replace('{@word}',0)
                 .replace('{@class}',_class)
                 .replace('{@content}',newSubtitle.content)
                 .replace('{@content}',newSubtitle.content)
                 .replace('{@data-index}', index)
                 .replace('{@data-index}', index)
                 .replace('{@data-index}', index);
      var liDom = $(_liStr);
      console.log(liDom);
      if(index > 0){
          var lastDom = $(this.lis[index-1]);
          liDom.insertAfter(lastDom);
      }else if(index === 0){
          var nextDom = $(this.lis[index]);
          liDom.insertBefore(nextDom);
      }
      this.lis = $(this.container).find("li");
      this.updateDomIndex();
      this.changeCurrentIndex(null,index);
  };
  
  /**
   * 根据id删除一条字幕dom
   * @param  {Int} id    要删除的字幕的id
   * @param  {Int} index 该条字幕所在的索引位置
   * @return {[type]}       [description]
   */
  subtitleAxis.deleteLiDom = function(id,index){
      var liDom = $("#"+id);
      liDom.remove();
      this.lis.splice(index,1);
      if(this.curIndex > index){
         this.curIndex--;
      }
      this.lis = $(this.container).find("li");
      this.updateDomIndex();
  };

  /**
   * 格式化时间  以second为单位
   * @param  {Int} _time 时间轴
   * @return {String}       拼接好的时间轴数据
   */
  subtitleAxis.getTimeModel = function(_time){
        var _secondNum = _time > 1000 ? parseInt(_time / 1000 ) : _time;
        var _minutes = parseInt(_secondNum / 60);
        var _hours = parseInt(_minutes / 60);
        _minutes = _minutes > 9 ? _minutes : ("0"+_minutes);
        _secondNum = _secondNum % 60;
        _secondStr = _secondNum > 9 ? _secondNum  : ("0"+_secondNum);
        if(_hours > 0){
          return  _hours+":"+_minutes+":"+_secondStr;
        }
        return _minutes+":"+_secondStr;
  };
  
  /**
   * 更新dom中的data-index
   * @type {[type]}
   */
  subtitleAxis.updateDomIndex = function(index){
      var i = 0 , len = this.lis.length;
      for( ; i < len ; i++){
         $(this.lis[i]).attr("data-index",i);
         $(this.lis[i]).find(".sub-content").attr("data-index",i);
         $(this.lis[i]).find("textarea").attr("data-index",i);
      }
  };

  /***************本地存储数据的操作*****************/
  /**
   * 更新本地存储数据
   * @return {[type]} [description]
   */
  subtitleAxis.updateLoacal = function(type){
      switch(type){
          case 1:
            LocalStorage.setItem(this.localKey, JSON.stringify(this.subtitles));
            break;
          case 2:
             var _newSubtitles = LocalStorage.getItem( this.remainKey ) ? JSON.parse(LocalStorage.getItem( this.remainKey )) : [];
             this.newSubtitles = this.newSubtitles.concat(_newSubtitles);
             LocalStorage.setItem(this.remainKey, JSON.stringify(this.newSubtitles));
             this.newSubtitles = [];
             break;
          case 3:
             var _newSegs = LocalStorage.getItem( this.remainSKey ) ? JSON.parse(LocalStorage.getItem( this.remainSKey )) : [];
             this.newSegments = this.newSegments.concat(_newSegs);
             LocalStorage.setItem(this.remainSKey, JSON.stringify(this.newSegments));
             this.newSegments = [];
             break
          default :
            //....
      }
  };
  
  /**
   * 清空相关的本地缓存
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.clearLocal = function(type){
    switch(type){
        case 1:
            LocalStorage.setItem(this.localKey, "");
            break;
        case 2:
            LocalStorage.setItem(this.remainKey, "");
            break;
        case 3:
            LocalStorage.setItem(this.remainSKey,"");
            break;
        default :
            //....
    }
  }

  
  /***************事件处理函数 绑定相关数据*****************/
  /**
   * 绑定相关事件
   */
  subtitleAxis.addEvent = function(){
      var _self = this;
      //添加li标签的点击事件
      this.container.delegate(".sub-content","click",function(e){
          //_self.changeCurrentIndex(this);
          _self.subconClick($(this), e);
      });

      //添加编辑框失去焦点事件
      this.container.delegate("textarea","blur",function(e){
          _self.enBlur($(this),e);
          return false;
      });

      //添加删除字幕事件
      this.container.delegate(".delete-icon", "click",function(e){
          var _segmentId = $(this).attr("data-id"),
              _index = $(this).parent().prev().attr("data-index");
          _self.showDeleteNote(_segmentId, parseInt(_index), 2);
      });
     
      /*删除警告层提示按钮事件绑定*/
      $("#js_ok").on("click",function(){
          var dom = $("#js_delete"),
              _segmentId =  dom.attr("data-id"),
              _index = parseInt( dom.attr("data-index"));
          _self.deleteSubtitleById(_segmentId, _index);
          dom.attr("data-index","");
          dom.attr("data-id","");
          dom.hide();
          $("#js_mask").hide();
      });
      $("#js_cancel").on("click",function(){
          var dom = $("#js_delete");
          dom.attr("data-index","");
          dom.attr("data-id","");
          dom.hide();
          $("#js_mask").hide();
      });
      
  };

  /**
   * 添加快捷键事件
   */
  subtitleAxis.addKeyDownEvent  = function(){
        var _self = this;
        document.onkeydown = function(event){
            var e = event || window.event || arguments.callee.caller.arguments[0];
            console.log("e.ctrlKey:"+e.ctrlKey+"  e.shiftKey:"+e.shiftKey+" keycode:"+e.keyCode);
            if(e.shiftKey && e.keyCode == 9 ){
                //_self.tabClick(event,false);
            }else if(e && e.keyCode == 9){ // 按 Tab 
                //_self.tabClick(event,true);
            }else if(e.ctrlKey){
               var keycode =  e.keyCode ;
               switch(keycode){
                  case 65:
                     _self.addSubtitleAxis();
                     break;
                  case 82:
                     _self.playCurrent();
                     break;
                  case 68:
                      _self.deleteSubtitleByCurrentTime();
                      break;
                  case 83:
                      _self.pauseVideo();
                      break;
                  default:
                     //
               }
            }
        };
  };
  
  /**
   * 点击编辑区域的时候的处理
   * @param  {[type]} target [description]
   * @param  {[type]} e      [description]
   * @return {[type]}        [description]
   */
  subtitleAxis.subconClick =  function (target, e) {
       var _index = parseInt(target.attr("data-index"));
       this.changeCurrentIndex(null, _index);
       target.find("textarea").show();
       target.find(".txt").hide();
  };
  
  /**
   * 当前编辑框失去焦点的事件
   * @param  {dom} target   失去焦点的dom节点
   * @param  {event} e      事件
   * @return {[type]}        null
   */
  subtitleAxis.enBlur = function(target, e){
        //console.log("enBlur");
        this.edit = false;
        this.editType = null;
        val =target.val();
        target.hide();
        var txtDom = target.siblings('.txt');
        txtDom.html(val).show();
        //target.siblings('.en-txt').removeClass("en-error");
        var _index = parseInt(target.attr("data-index"));
        var _basesubtitle = this.subtitles.subtitleItems[_index];//this.data.subtitleItems[_index].baseSubtitleItem;
        if(_basesubtitle.content !== val && val !== ""){
            _basesubtitle.content = val;
            _basesubtitle.updateTime =  parseInt(new Date().getTime()/1000);
            //_basesubtitle.autoCaption = 0;
            _basesubtitle.username = this.options.username;
            _basesubtitle.userNickname = this.options.nickname;
            _basesubtitle.isDifficult = 3;
            _basesubtitle.action = 0;
            this.newSubtitles.push(_basesubtitle);
            //this.updateLoacal(2);

            //this.saveSubtitle(_basesubtitle,_index);
            this.updateLoacal();
            this.updateWps(target.parent(), _index);
        }
  };
  
  /**
   * 更新字幕下方的wps和总单词数量
   * @param  {[type]} parentDom [description]
   * @param  {[type]} index     [description]
   * @return {[type]}           [description]
   */
  subtitleAxis.updateWps = function (parentDom, index) {
       var _subtitle = this.subtitles.subtitleItems[index],
           _duration = ((_subtitle.endTime - _subtitle.startTime)/1000).toFixed(1),
           _wps = Math.ceil(_subtitle.content.length / _duration)+"WPS";
      var _next = $(parentDom).next();
      _next.find(".js_wps").html(_wps);
      _next.find(".js_wordsCount").html(_subtitle.content.length+"word");
  };
  
  /**
   * 显示删除提示层
   * @param  {[type]} id     当前时间轴或者是字幕的segmentId
   * @param  {[type]} _index 当前时间轴或者是字幕所在的位置
   * @param  {[type]} type   删除的类型 1是时间轴，非1是字幕
   * @return {[type]}        [description]
   */
  subtitleAxis.showDeleteNote = function(id,_index,type){
      var dom = $("#js_delete");
      var subtitleItem = this.subtitles.segments[_index];
      var _typeStr = type == 1 ? "时间轴" : "字幕";
      dom.find(".layui-layer-content").html("确定要删除开始时间为："+this.getTimeModel(Math.ceil(subtitleItem.startTime))+"的"+_typeStr+"?");
      dom.show();
      dom.attr("data-index",_index);
      dom.attr("data-id",id);
      $("#js_mask").show();
  };
  
  /**
   * 根据当前的id和序号删除时间轴和字幕
   * @param  {[type]} segmentId [description]
   * @param  {[type]} _index    [description]
   * @return {[type]}           [description]
   */
  subtitleAxis.deleteSubtitleById = function(segmentId,_index){
      //移除时间轴上的数据
      segmentPart.deleteSegment(this.peaksInstance,segmentId);

      //移除字幕条
      this.removeSubtitle(_index);
  };
  
  /**
   * 根据时间轴当前时间找到当前的时间轴的索引
   * @return {[type]} [description]
   */
  subtitleAxis.findCurrentIndexByCurrentTime = function(){
      var _currentTime = this.peaksInstance.time.getCurrentTime(),
          i = 0 ,_len = this.subtitles.segments.length;
      var _segment = null,_index = -1;
      for(; i < _len ;i++){
          if(_currentTime > this.subtitles.segments[i].startTime && _currentTime < this.subtitles.segments[i].endTime){
              _segment = this.subtitles.segments[i];
              _index = i;
              break;
          }
      }
      return _index;
  };
  
  subtitleAxis.deleteSubtitleByCurrentTime = function(){
      var index = this.findCurrentIndexByCurrentTime();
     
      if(index >= 0){
          var segmentId = this.subtitles.segments[index].segmentId;
          this.showDeleteNote(segmentId,index,1);
      }
  };
  
  subtitleAxis.addSubtitleAxis = function(){
      segmentPart.addSegment(this.peaksInstance);
  };
  /**
   * 添加一个时间轴对象之后的回调
   * @param {int} index 本次添加的时间轴插入的位置
   * @param {[type]} segs  时间轴对象
   */
  subtitleAxis.addSubtitle = function() {
      var i = 0 , _len =  this.subtitles.segments.length;
      var _orderSeg = orderedSegments;
      var insertIndex = -1;

      for(; i < _len; i++){
        if(this.subtitles.segments[i].id != _orderSeg[i].segmentId){
            insertIndex =  i;
            break;
        }else{
           continue;
        }
      }
      if(insertIndex === -1){
           insertIndex = _orderSeg.length - 1;
      }
      

      var _newSeg = {};
      _newSeg.id = _orderSeg[insertIndex].segmentId;//"b_" + new Date().getTime();
      _newSeg.action  = 1;
      _newSeg.startTime = (_orderSeg[insertIndex].startTime * 1000).toFixed(0);
      _newSeg.endTime = (_orderSeg[insertIndex].endTime * 1000).toFixed(0);

      console.log(_newSeg);
      this.subtitles.segments.splice(insertIndex, 0 ,_orderSeg[insertIndex]);
      

      this.newSegments.push(_newSeg);
      //this.updateLoacal(3);
      
      //构造新增的空字幕
      var _newSubtitle = {
                          content : "",
                          endTime : _newSeg.endTime,
                          explanation : null,
                          subtitleItemId : _newSeg.id,
                          isDifficult : 3,
                          language : this.baseLanguage,
                          startTime : _newSeg.startTime ,
                          updateTime : new Date().getTime(),
                          userName : this.options.userName,
                          userNickname : this.options.userNickname
                        };
      this.subtitles.subtitleItems.splice(insertIndex, 0 ,_newSubtitle);
      
      //插入一条dom结构
      this.addLiDom(insertIndex,_newSubtitle);

      //更新整日数据本地存储
      this.updateLoacal(1);
  };

  /**
   * 移除某一条字幕
   * @param  {[type]} seg [description]
   * @return {[type]}     [description]
   */
  subtitleAxis.removeSubtitle = function(index){

      //移除字幕数据
      var subtitleItem  = this.subtitles.subtitleItems.splice(index,1)[0];
      
      //移除时间轴数据
      var delSeg = this.subtitles.segments.splice(index,1)[0];
      delSeg.action = 3;
      delSeg.startTime = delSeg.startTime * 1000;
      delSeg.endTime = delSeg.endTime * 1000;
      this.newSegments.push(delSeg);
      //this.updateLoacal(3);
      
      //移除dom结构
      this.deleteLiDom(delSeg.segmentId, index);

      //更新本地存储数据
      this.updateLoacal(1);
  };


  /**
   * 更新时间轴
   * @param  {segments} segs  [segments]
   * @return {[type]}       [description]
   */
  subtitleAxis.updateSubtitle = function(seg){
     var _li = $("#"+seg.segmentId);//js_alltime
     var _index = parseInt(_li.attr("data-index"));
     var _oldseg = this.subtitles.segments[_index];
     if(Math.abs(seg.startTime * 1000 - _oldseg.startTime < 500) && Math.abs(seg.endTime * 1000 -_oldseg.endTime) < 500){
        return;
     }

     var _newSeg = {};
         _newSubtitle = this.subtitles.subtitleItems[_index];

     this.subtitles.segments[_index].startTime = seg.startTime;
     this.subtitles.segments[_index].endTime = seg.endTime;

     _newSeg.startTime = _newSubtitle.startTime = (seg.startTime * 1000).toFixed(0);
     _newSeg.endTime = _newSubtitle.endTime = (seg.endTime * 1000).toFixed(0);

     _newSeg.id = this.subtitles.segments[_index].id;

     //和最近的一条重复且都是action=0编辑，则舍弃上一条，以当前这条为标准
     var _flag = this.findUpdateItem(2,_newSeg);
     if(_flag  < 0){
          _newSeg.action = 2;
          this.newSegments.push(_newSeg);
     }
     //this.updateLoacal(3);

     _li.find(".start-time").html(this.getTimeModel(Math.ceil(_newSeg.startTime / 1000)));
     var _duration = ((_newSeg.endTime - _newSeg.startTime)/1000).toFixed(1);
     _li.find(".js_alltime").html(_duration+"seconds");

     var _content = this.subtitles.subtitleItems[_index].content || "";
     var _wps = Math.ceil(_content.length / _duration)+"WPS";
     _li.find(".js_wps").html(_wps);

     this.updateLoacal();
  };
  
  subtitleAxis.findUpdateItem = function(type, obj){
    var list , id, key;
    if(type == 1){
       list = this.newSubtitles;
       key = "subtitleItemId"
    }else{
       list = this.newSegments;
       key = "id";
    }
    var id = obj[key];
    var i  = list.length - 1;
    for(; i > -1 ; i--){
        if(id == list[i][key]){
           //break;
           return i;
        }
    }
    return -1;
  };

  /**
   * 滚动字幕
   * @return {[type]} [description]
   */
  subtitleAxis.scrollTo = function(_index){
      var _top = _index === 0 ? 0 : (_index - 1) * 150;
      this.container.mCustomScrollbar("scrollTo",_top);
  };

  /**
   * 改变当前需要编辑的字幕
   * @return {[type]} [description]
   */
  subtitleAxis.changeCurrentIndex = function(dom,_index){
       if(this.curIndex >= 0){
           var _li = $(this.lis[this.curIndex]);
           _li.removeClass("active");
           _li.find("textarea").hide();
           _li.find(".txt").show();
       }
       if(dom){
          $(dom).addClass("active");
          this.curIndex = parseInt($(dom).attr("data-index"));
       }else if(_index){
           $(this.lis[_index]).addClass("active");
           this.curIndex = _index;
       }
       
       //更新播放器播放时间
       var _item = this.subtitles.subtitleItems[this.curIndex];
       this.changePlayerTime(_item.startTime/1000, _item.endTime/1000);
       this.peaksInstance.time.setCurrentTime(_item.startTime/1000);
       this.scrollTo(this.curIndex);
  };

  /**
   * 启动上传数据计时器
   * @return {[type]} [description]
   */
  subtitleAxis.startPostInterval = function(){
      var _self = this;
      var _newSubtitles = LocalStorage.getItem( this.remainKey ) ? JSON.parse( LocalStorage.getItem( this.remainKey )) : [];
      var _newsegs = LocalStorage.getItem( this.remainSKey ) ? JSON.parse( LocalStorage.getItem( this.remainSKey )) : [];
      //提交更新的字幕数据
      _newSubtitles =  _newSubtitles.concat(this.newSubtitles);
      if(_newSubtitles.length > 0){
          console.log("字幕数据有更新|||||有更新数据，提交"+_newSubtitles.length);
          var _params = {
                token : _self.options.token,
                username : _self.options.username,
                videoId : _self.options.videoId,
                from : 3,
                newSubtitle : JSON.stringify(_newSubtitles)
          };
          //LocalStorage.setItem( this.remainKey, JSON.stringify([]) );
          //更新本地缓存，提交成功之后，清空
          this.updateLoacal(2);
          getAjax('http://m.yxgapp.com/d/mooc/UpdateSubtitle.json', _params ,"sendSubtitleSuccessBack","sendSubtitleErrorBack","POST");
      }else{
          console.log("字幕数据没有更新");
      }

      //提交有新增或者是更新的时间轴数据
      _newsegs = _newsegs.concat(this.newSegments);
      if(_newsegs.length > 0){
          console.log("时间轴数据有更新|||||有更新数据，提交"+_newsegs.length);
          var _params = {
                token : _self.options.token,
                username : _self.options.username,
                videoId : _self.options.videoId,
                from : 3,
                subtitleAxises : JSON.stringify(this.newSegments)
          };
          //更新本地缓存 提交成功之后清空
          this.updateLoacal(3);
          getAjax("http://m.yxgapp.com/d/mooc/UpdateSubtitleAxis.json", _params ,"sendSubtitleSuccessBack","sendSubtitleErrorBack","POST");
          //LocalStorage.setItem( this.remainSKey, JSON.stringify([]) );

      }else{
          console.log("时间轴数据没有更新");
      }
      
      // if( !this.interval1 ){
      //     var _self = this;
      //     this.interval1 = setInterval(function(){
      //         _self.startPostInterval();
      //     },3000);
      // }
    
      // this.interval1 = setInterval(function(){
      //        //var _self = subtitleAxis;
      //       if(_self.newSubtitles.length > 0){
      //         console.log("时间轴|||||有更新数据，提交"+_self.newSubtitles.length);
      //         var _params = {
      //           token : _self.options.token,
      //           username : _self.options.username,
      //           videoId : _self.options.videoId,
      //           newSubtitle : _self.newSubtitles
      //         };
      //         //清空当前缓存的数据
      //         _self.newSubtitles.splice(0,_self.newSubtitles.length);
      //         getAjax(_self.update, _params , _successback ,_errorcallback,"POST");
      //       }else{
      //           console.log("时间轴|||||没有数据提交");
      //       }
      // },3000);
  };
  
  /**
   * 提交字幕数据成功之后回调函数
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.sendSubtitleSuccessBack =  function(data){
      console.log("subtitle success");
      if(data.result.resule){
          this.clearLocal(2);
      }
      console.log(data);
  };

  /**
   * 提交字幕数据失败之后回调
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.sendSubtitleErrorBack = function(data){
      console.error(data);
  };

  /**
   * 提交时间轴数据成功之后回调
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.sendAxisSuccessBack = function(data){
    console.log("Axis-success");
    console.log(data);
    if(data.result.result){
          this.clearLocal(3);
    }
  };
  
  /**
   * 提交时间轴数据失败之后回调
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.sendAxisErrorBack = function(data){

  };
  /**
   * 上传时间轴数据
   * @return {[type]} [description]
   */
  subtitleAxis.saveSegments = function(action,segs){
     
  };

  /**
   * 更新播放器的播放时间段  ps:该方法耦合严重 要解耦的话需要重新设计
   * @param  {Int} startTime 开始时间 s
   * @param  {Int} endTime   播放暂停时间 s
   * @return {[type]}           [description]
   */
  subtitleAxis.changePlayerTime = function(startTime,endTime){
      Control.course.changePlayerTime(startTime, null);
  };

  subtitleAxis.playCurrent = function(){
      var _index = this.findCurrentIndexByCurrentTime();
      this.curSIndex = _index;
      if(_index >=0 ){
          var _startTime =  this.subtitles.segments[_index].startTime;
          this.peaksInstance.time.setCurrentTime(_startTime);
          Control.course.player.play();
          this.changeCurrentIndex(null, _index);
      }
  }

  subtitleAxis.pauseVideo = function(){
      Control.course.player.pause();
  }
  return subtitleAxis;
});
