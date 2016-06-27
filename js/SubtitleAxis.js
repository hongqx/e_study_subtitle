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
                      '<div class="sub-content">',
                           '<textarea data-index="{@data-index}" name="" cols="30" rows="10" placeholder="edit...">{@content}</textarea>',
                           '<div class="txt">{@content}</div>',
                      '</div>',
                      '<div class="subspan">',
                          '<span class="js_wps">{@wps}</span>',
                          '<span class="js_alltime">{@alltime}seconds</span>',
                          '<span class="js_wordsCount">0word</span>',
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
   * @param  {[type]} _successback   成功回调
   * @param  {[type]} _errorcallback 错误回调
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
    //本地存储key
    this.localKey = this.options.videoId + "_SUBTITLEAXIS";

    //根据taskType判断基本语言类型
    if(this.options.taskType === 1){
        this.baseLanguage = "英文";
    }else{
        this.baseLanguage = "中文";
    }

    this.staicState = true; //字幕静态化状态 初始 需要获取数据
    
    //用于存储新的时间轴
    this.newSegments = [];
    this.newSubtitles = [];
    this.getServerSubTitles();
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
      this.mergeLocalItems(this.subtitles);
      //初始化时间轴
      this.initSegments();

      //初始化dom结构
      this.initDom();
      
      //更新播放器的播放时间段
      var _item = this.subtitles.subtitleItems[this.curIndex];
      this.changePlayerTime(_item.startTime, _item.endTime);

      //进行相关事件的绑定
      this.addEvent();
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
            _newItem.startTime = Math.ceil(_item.startTime / 1000);
            _newItem.endTime = Math.ceil(_item.endTime / 1000);

            _newseg.startTime = Math.ceil(_item.startTime / 1000);
            _newseg.endTime = Math.ceil(_item.endTime / 1000);
            _newseg.id = _item.id;
            _newseg.editable = true;
            _newSubtitle.segments.push(_newseg);

            _newItem.id = _item.id;
            _newItem.isDifficult =  3;
            for( ; j < _iLen ; j++){
               if(_item.data[j].language === this.baseLanguage){
                  _newItem.content = _item.data[j].content;
                  _newItem.explanation = _item.explanation;
                  _newItem.language =  _item.language;
                  _newItem.updateTime = _item.updateTime;
                  _newItem.userName  =  _item.userName;
                  _newItem.userNickname = _item.userNickname;
                  continue;
               }
            }
            _newSubtitle.subtitleItems.push(_newItem);
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
          var _duration = (_segmentObj.endTime - _segmentObj.startTime).toFixed(1);
          var _class = i=== this.curIndex ? "active" : "";
          var _content = _segmentObj.content ? _segmentObj.content : "";
          var _wps = Math.ceil(_content.length / _duration)+"WPS";
          var _liStr = limodel.replace('{@startTime}', this.getTimeModel(_segmentObj.startTime))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', _segmentObj.id)
                 .replace('{@textId}', _segmentObj.id)
                 .replace('{@textId}', _segmentObj.id)
                 .replace('{@wps}', _wps)
                 .replace('{@class}',_class)
                 .replace('{@content}',_content)
                 .replace('{@content}',_content)
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
 
  subtitleAxis.addLiDom = function(index, newSubtitle){
      var _duration = (newSubtitle.endTime - newSubtitle.startTime).toFixed(1);
      var _wps = Math.ceil(newSubtitle.content.length / _duration)+"WPS";
      var _class = "active";
      var _liStr = limodel.replace('{@startTime}', this.getTimeModel(newSubtitle.startTime))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', newSubtitle.id)
                 .replace('{@textId}', newSubtitle.id)
                 .replace('{@textId}', newSubtitle.id)
                 .replace('{@wps}', _wps)
                 .replace('{@class}',_class)
                 .replace('{@content}',newSubtitle.content)
                 .replace('{@content}',newSubtitle.content)
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
      this.changeCurrentIndex(null,index);
  },
  
  /**
   * 删除lidom节点
   * @return {[type]} [description]
   */
  subtitleAxis.deleteLiDom = function(id,index){
      var liDom = $("#"+id);
      liDom.remove();
      this.lis.splice(index,1);
      if(this.curIndex > index){
         this.curIndex--;
      }
  },


  subtitleAxis.getTimeModel = function(_time){
        var _secondNum = _time;//parseInt(_time / 1000 ) ;
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
  };
  
  /**
   * 更新本地存储数据
   * @return {[type]} [description]
   */
  subtitleAxis.updateLoacal = function(){
     
  };

  /**
   * 绑定相关事件
   */
  subtitleAxis.addEvent = function(){
      var _self = this;
      this.container.on("click","li",function(e){
          //_self.changeCurrentIndex(this);
          _self.liClick($(this), e);
      });

      this.container.delegate("textarea","blur",function(e){
          _self.enBlur($(this),e);
          return false;
      });
  };

  subtitleAxis.liClick =  function (target, e) {
       this.changeCurrentIndex(target);
       target.find("textarea").show();
       target.find(".txt").hide();
  };
  subtitleAxis.enBlur = function(target, e){
        //console.log("enBlur");
        this.edit = false;
        this.editType = null;
        val =target.val();
        target.hide();
        var txtDom = target.siblings('.txt');
        txtDom.html(val).show();
        //包含中文 不做更新
        // if(/.*[\u4e00-\u9fa5]+.*$/.test(val)){
        //    //target.val(target.siblings('.en-txt').val());
        //    target.siblings('.en-txt').addClass("en-error");
        //    return;
        // }
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
            //this.saveSubtitle(_basesubtitle,_index);
        }
  };
  /**
   * 添加一个时间轴对象
   * @param {int} index 本次添加的时间轴插入的位置
   * @param {[type]} segs  时间轴对象
   */
	subtitleAxis.addSubtitle = function() {
      var i = 0 , _len =  this.subtitles.segments.length;
      var _orderSeg = orderedSegments;
      var lastIndex = 0, insertIndex = 0;
		  for(; i < _len; i++){
        if(this.subtitles.segments[i].startime < _orderSeg[i].startime){
            insertIndex =  i;
            break;
        }else{
           continue;
        }
      }
      if(insertIndex === 0){
           insertIndex = _orderSeg.length - 1;
      }

      var _newSeg = _orderSeg[insertIndex];
      _newSeg.id = "b_" + new Date().getTime();
      _newSeg.action  = 2;
      console.log(_newSeg);
      this.subtitles.segments.splice(insertIndex, 0 ,_newSeg);
      this.newSegments.push(_newSeg);
      
      var _newSubtitle = {
                          content : "",
                          endTime : Math.ceil(_newSeg.endTime),
                          explanation : undefined,
                          id : _newSeg.id,
                          isDifficult : 3,
                          language : this.baseLanguage,
                          startTime : Math.ceil(_newSeg.startTime),
                          updateTime : new Date().getTime(),
                          userName : this.options.userName,
                          userNickname : this.options.userNickname
                        }
      this.subtitles.subtitleItems.splice(insertIndex, 0 ,_newSubtitle);
      this.newSubtitles.push(_newSubtitle);
      this.addLiDom(insertIndex,_newSubtitle);
	};

  /**
   * 移除某一条字幕
   * @param  {[type]} seg [description]
   * @return {[type]}     [description]
   */
	subtitleAxis.removeSubtitle = function(index){
      var _startTime = this.subtitles.subtitleItems[index].startTime,
          _endTime = this.subtitles.subtitleItems[index].endTime;

      this.peaksInstance.segments.removeByTime(_startTime,_endTime);
      var subtitleItem  = this.subtitles.subtitleItems.splice(index,1);
      subtitleItem.action = 1;
      this.newSubtitles.push(subtitleItems);
      var delSeg = this.subtitles.segments.splice(index,1);
      delSeg.action = 1;
      this.newSegments.push(delSeg);
      this.deleteLiDom(delSeg.id, index);
	};


  /**
   * 更新时间轴
   * @param  {segments} segs  [segments]
   * @return {[type]}       [description]
   */
	subtitleAxis.updateSubtitle = function(seg){
     var _li = $("#"+seg.id);//js_alltime
     var _index = parseInt(_li.attr("data-index"));
     
     var _newSubtitle = this.subtitles.subtitleItems[_index];
     var _newSeg =  this.subtitles.segments[_index];
     _newSubtitle.startTime = seg.startTime;
     _newSubtitle.endTime = seg.endTime;

     _newSeg.startTime = seg.startTime;
     _newSeg.endTime = seg.endTime;
     _newSeg.action = 0;
     this.newSegments.push(_newSeg);

     _li.find(".start-time").html(this.getTimeModel(Math.ceil(seg.startTime)));
     var _duration = Math.ceil(seg.endTime - seg.startTime);
     _li.find(".js_alltime").html(_duration+"seconds");

     var _content = this.subtitles.subtitleItems[_index].content || "";
     var _wps = Math.ceil(_content.length / _duration)+"WPS";
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
           $(this.lis[this.curIndex]).removeClass("active");
       }
       if(dom){
          $(dom).addClass("active");
          this.curIndex = $(dom).attr("data-index");
       }else if(_index){
           $(this.lis[_index]).addClass("active");
           this.curIndex = _index;
       }
       
       //更新播放器播放时间
       var _item = this.subtitles.subtitleItems[this.curIndex];
       this.changePlayerTime(_item.startTime, _item.endTime);

       this.scrollTo(this.curIndex);
  };

  /**
   * 上传字幕
   * @return {[type]} [description]
   */
	subtitleAxis.saveSubtitle = function(){

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
      Control.course.changePlayerTime(startTime, endTime);
  }
  return subtitleAxis;
});
