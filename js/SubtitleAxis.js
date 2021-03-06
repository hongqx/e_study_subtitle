//'jquery','mCustomScrollbar',$, mCustomScrollbar,
define(['peaks'], function ( Peaks){
  var segmentPart = {};
  window.segmentPart = segmentPart;
  segmentPart.init = function(options,events){
      this.segments = [];

      this.peaksInstance = Peaks.init(options);
      this.segsNum = options.segments.length;
      this.peaksInstance.zoom.zoomOut();
      var _self = segmentPart;

      //时间轴拖拽结束开始更新当前的时间轴数据
      this.peaksInstance.on('segments.dragend', function (segment) {
          _self.updateSegment(segment);
      });

      //开始调整时间轴的时候，暂停视频播放
      this.peaksInstance.on('segments.dragstart', function (segment) {
          _self.dragStartCallBack(segment);
      });
      this.peaksInstance.on("segment.click",function(segment){
        _self.changeSegment(segment);
      });
      //绑定时间轴绘制完成之后的一些初始化事件 隐藏提示层，设置时间轴的开始时间  标识当前时间轴是否是空白
      this.peaksInstance.on("segments.ready",function(){
          hideNote();
          //_self.segments = _self.getSegments();
          if(_self.segsNum > 0){
              _self.curIndex = 0;//当前的index
              _self.ifBlank = true;//当前时间轴是否空白
          }else{
              _self.curIndex = -1;//当前的index
              _self.ifBlank = false;//当前时间轴是否空白
          }
          _self.segments = _self.getSegments()||[];
          _self.time(0);
      });
      
      //绑定用户手动触发时间轴时间变化以便更新之后的时间轴
      this.peaksInstance.on("user_seek.zoomview",function(_time){
         _self.userSeek(_time);
      });

      //绑定播放时间更新的时候的回调
      this.peaksInstance.on('player_time_update',function(_time){
          _self.timeUpdate(_time);
      });
  };
  /**
  * 根据当前时间获取时间轴的索引
  * @param  {Object} peaksInstance [description]
  * @return {int}               -1 当前位置没有是时间轴   大于等于0 时间轴的索引位置
  */
  segmentPart.getIndexByCurrentTime = function(_time){
        var _currentTime = _time ? _time : this.peaksInstance.time.getCurrentTime(),
            segments = this.peaksInstance.segments.getSegments(), i = 0,_len = segments.length;
        if(_len === 0 || _currentTime > segments[_len-1].endTime){
           return -1;
        }
        while(i < _len-1){
          if(_currentTime >= segments[i].startTime && _currentTime <= segments[i].endTime){
             return i;
          }else if((i+1) < _len && _currentTime > segments[i].endTime && _currentTime < segments[i+1].startTime){
             return -1;
          }
          i++;
        }
        return -1;
  };
  
  /**
   * 用户手动seek,即点击时间轴的时候触发
   * @param  {[type]} _time [description]
   * @return {[type]}       [description]
   */
  segmentPart.userSeek = function(_time){
      console.log("segmentPart.userSeek");
      if(this.segments.length < 1){
       return;
      }
      if(this.curIndex > -1){
        var _seg = this.segments[this.curIndex];
        if(_time >= _seg.startTime && _time <= _seg.endTime){
           return;
        }
      }
      //获取最新的当前时间所在的索引
      var _index = this.getIndexByCurrentTime(_time);
      if(_index > -1){
          this.curIndex = _index;
          this.ifBlank = false;
          this.startTime = this.segments[this.curIndex].startTime;
          this.endTime = this.segments[this.curIndex].endTime;
          //Control.subtitleAxis.changeCurrentIndex(_index, true);
      }else{
          this.ifBlank = true;
          this.startTime = -1;
          this.endTime = -1;
          clearInterval( this.interval);
          this.interval = null;
          this.fIndex = -1;
          this.peaksInstance.segments.changeCurrentMarker(this.curIndex);
          Control.subtitleAxis.changeCurrentIndex(-1, true);
      }
  };

  segmentPart.timeUpdate = function(_time){
    //console.log("timeupdate :"+_time);
    if(this.segments.length < 1){
       return;
    }
    // if(!this.segments){
    //   this.segments =  this.getSegments();
    //   this.curIndex = 0;
    //   this.time(this.segments[0].startTime);
    //   return;
    // }
    //如果有startTime和endTime 则播放该段时间内的视频
    if(this.endTime > 0 && Math.abs(_time - this.endTime) < 0.05 && !this.ifBlank){
        //console.log("segmentPart.timeUpdate:当前的时间+"+_time+"  this.endTime:"+this.endTime);
        this.peaksInstance.player.pause();
        this.time(this.endTime);
        clearInterval( this.interval );
        this.interval = null;
        return;
    }
    var _curSeg = this.segments[this.curIndex];
    if(_curSeg && _time >= _curSeg.startTime && _time <= _curSeg.endTime){
        this.ifBlank = false;
        if(this.curIndex !== Control.subtitleAxis.curIndex){
            Control.subtitleAxis.changeCurrentIndex(this.curIndex, true);
        }
        return;
    }else{
        var _nextSeg;
        if((this.curIndex + 1) < this.segments.length){
           _nextSeg = this.segments[this.curIndex + 1];
        }
        if(_nextSeg &&  _time >= _nextSeg.startTime && _time <= _nextSeg.endTime){
            this.curIndex ++;
            this.ifBlank = false;
            //console.log("segmentPart.timeUpdate:timeUpdate||curIndex: "+this.curIndex+" ||ifBlank: "+this.ifBlank);
            Control.subtitleAxis.changeCurrentIndex(this.curIndex, true);
        }else {
            this.ifBlank = true;
            Control.subtitleAxis.changeCurrentIndex(-1, true);
            this.fIndex = -1;
            this.startTime = -1;
            this.endTime = -1;
            //this.peaksInstance.segments.changeCurrentMarker(this.curIndex);
            //Control.subtitleAxis.changeCurrentIndex(-1, true);
        }
    }
    //console.log("this.ifBlank "+this.ifBlank+"  "+this.curIndex );
  };
  
  /**
   * 点击某一个时间轴的回调方法
   * @param  {[type]} segment 当前被点击的时间轴对象
   * @return {[type]}         [description]
   */
  segmentPart.changeSegment = function(segment){
      this.curIndex = this.fIndex = segment.index;
      this.peaksInstance.player.pause();
      clearInterval( this.interval );
      this.interval = null;
      this.time(segment.startTime);
      this.endTime = segment.endTime;
      this.startTime = segment.startTime;
      Control.subtitleAxis.changeCurrentIndex(this.curIndex, true);
      this.ifBlank = false;
  };
  /**
   * 获取当前时间点所在的时间轴对象
   * @param  {object} peaksInstance peak对象
   * @return {int}   如果返回去1-时间空隙不够  返回0-说明改段已经存在时间轴  返回对象-可以添加
   */
  segmentPart.getSegmentIndex = function(){
        var _currentTime = Number(this.peaksInstance.time.getCurrentTime().toFixed(2)),
            _oldSegments = this.peaksInstance.segments.getSegments();
        var  i = 0,_len = _oldSegments.length;
        var newSegment = {};
        if( _len === 0){
            newSegment.startTime = _currentTime < 1 ? 0 : _currentTime;
            newSegment.endTime = newSegment.startTime + 1;
            newSegment.index = 0;
            return newSegment;
        }
        
        if(_currentTime < _oldSegments[0].startTime){
              if(_oldSegments[0].startTime < 1){
                return 0;
              }
              if(_currentTime < 1){
                  newSegment.startTime  = 0;
              }else if(_oldSegments[0].startTime - _currentTime >= 1){
                  newSegment.startTime = _currentTime;
              }else{
                  newSegment.startTime = _currentTime - 1;
              }
              //newSegment.startTime = _currentTime < 1  ||  _oldSegments[0].startTime - _currentTime < 1 && ? 0 : _currentTime;
              newSegment.endTime = newSegment.startTime + 1;
              newSegment.index = 0;
              return newSegment;
        }
        
        //如果是大于则返回该值
        if(_currentTime > _oldSegments[_len-1].endTime){
            var _duration = this.peaksInstance.time.getDuration(),
                _oldEndtime = _oldSegments[_len-1].endTime;
            //剩下的时间空间不足1s
            if(_duration - _oldEndtime < 1){
               return 0;
            }else if(_duration === _oldEndtime){
               return 1;
            }
            
            newSegment.startTime = (_duration - _currentTime < 1 || _currentTime - _oldEndtime < 1) ? _oldEndtime : _currentTime;
            newSegment.endTime = newSegment.startTime + 1;
            newSegment.index = _len;
            return newSegment;
        }

        var index = -1;
        while(i < _len){
            if(_currentTime > _oldSegments[i].startTime && _currentTime < _oldSegments[i].endTime){
                return 1;
            }
            if(_currentTime > _oldSegments[i].endTime && _currentTime < _oldSegments[i+1].startTime){
                index = i;
                break;
            }else{
                i++;
            }
        }
        if(index < 0){
          return 1;
        }
        //确定比较的上一个的endTime
        var _oldEndtime  = _oldSegments[index].endTime ;
        if(_oldSegments[index + 1].startTime - _oldEndtime === 0){
           return 1;
        }else if(_oldSegments[index + 1].startTime - _oldEndtime < 1){
           return 0;
        }else{
            newSegment.startTime = (_currentTime - _oldSegments < 1) || (_oldSegments[index + 1].startTime - _currentTime < 1) ? _oldEndtime : _currentTime;
            newSegment.endTime =  newSegment.startTime + 1;
            newSegment.index = index;
            return newSegment;
        }
  };
 
  segmentPart.addSegment = function(segment,segmentId){
        var segment = this.getSegmentIndex();
        if(segment === 0){
            showNote("当期位置时间空隙不够，无法添加，请删除相邻时间轴之后再添加!",true);
        }else if(segment === 1){
            showNote("当期位置已有时间轴，无法添加!",true);
            return ;
        }else{
            segment.editable = true;
            if(segment.index % 2 === 0){
                segment.color = "#646464";
            }else{
                segment.color = "#343434";
            }
            segment.segmentId = segmentId ? segmentId : 'b_'+ new Date().getTime();
            segment = this.peaksInstance.segments.add([segment]);
            if(segment && segment.length > 0){
                this.segments = this.peaksInstance.segments.getSegments();
                this.segsNum = this.segments.length;
                this.curIndex = this.fIndex = segment[0].index;//更新当前的时间轴索引
                this.ifBlank = false;
                this.startTime = segment[0].startTime;
                this.endTime = segment[0].endTime;
                this.time(this.startTime);
                Control.subtitleAxis.addSubtitle(segment);
            }else{
                showNote("时间轴添加失败，请重试!!",true);
            }
        }
  };
  
  segmentPart.getSegments  =  function(){
     return this.peaksInstance.segments.getSegments();
  };
  segmentPart.updateSegment = function(segment){
      if(segment.length < 1){
         return;
      }
      this.startTime = segment.startTime;
      this.endTime = segment.endTime;
      if(this.time() > this.endTime){
        this.time(this.endTime );
      }else if(this.time() < this.startTime){
        this.time(this.startTime);
      }
      // if(this.time() < this.startTime){
      //   this.time(this.startTime);
      // }else if(this.time() > this.endTime){
      //   this.time(this.endTime);
      // }
      Control.subtitleAxis.updateSubtitle(segment);
      this.getSegments();
  };

  segmentPart.deleteSegment = function (index,segment) {
        var _segment ,_index;
        if(segment){
            _segment = segment;
        }else if(!index && index !== 0){
            _index = this.getIndexByCurrentTime();
            if(_index === -1){
               showNote("当期位置没有可删除的时间轴",true);
               return false;
            }
        }else{
           _index = index;
        }
        segment = _segment ? _segment : this.peaksInstance.segments.getSegments()[_index];
        var _startTime = segment.startTime;
        var _endTime = segment.endTime;
        var ret = this.peaksInstance.segments.removeByTime(_startTime,_endTime);
        if(ret > 0){
           this.segments = this.peaksInstance.segments.getSegments();
           this.segsNum = this.segments.length;
           this.curIndex = -1;//this.curIndex < this.segsNum ? this.curIndex : this.curIndex-1;
           this.fIndex = -1;//当前焦点的时间轴
           this.ifBlank = true;
           this.startTime = -1;
           this.endTime = -1;
           clearInterval( this.interval );
           return true;
        }else{
           showNote("删除时间轴失败，请重试！",true);
           return false;
        }
  };

  segmentPart.time = function(time,curIndex){
      if(time){
        this.peaksInstance.time.setCurrentTime(time);
      }
      if(curIndex){
        this.curIndex = curIndex;
      }
      return this.peaksInstance.time.getCurrentTime();
  };

  /**
   * 设置开始播放和结束播放的时间点，并且开始播放
   * @param {[type]} _startTime 开始播放的时间
   * @param {[type]} _endTime   结束播放的时间
   */
  segmentPart.setPlayTime = function(_startTime,_endTime){
      // this.startTime = _startTime;
      // this.endTime = _endTime;
      if(_startTime < 0 && _endTime < 0){
          return;
      }
      this.time(this.startTime);
      this.peaksInstance.player.play();
      if(this.interval){
         return;
      }
      this.interval = setInterval(function(){
        var _time = segmentPart.time();
        //console.log("this.interval1"+segmentPart.interval1+" currentTime:"+_time);
        segmentPart.timeUpdate(_time);
      },50);
  };
  
  /**
   * 把手开始拖拽的时候回调
   * @param  {[type]} segment [description]
   * @return {[type]}         [description]
   */
  segmentPart.dragStartCallBack = function(segment){
      //开始拖拽 直接暂停播放
      this.peaksInstance.player.pause();
      clearInterval( this.interval );
      this.interval = null;
  };
  /**
   * 修改当前的时间轴获取焦点显示调整把手 用于字幕列表点击回调
   * @param  {[type]} _index [description]
   * @return {[type]}        [description]
   */
  segmentPart.changeMarker = function(_index){
      console.log("segmentPart.changeMarker");
      if(_index > -1 && _index < this.segments.length){
          var segment = this.segments[_index];
          this.peaksInstance.segments.changeCurrentMarker(segment);
          this.peaksInstance.player.pause();
          this.time(segment.startTime);
          this.endTime = segment.endTime;
          this.startTime = segment.startTime;
          this.curIndex = _index;
          this.fIndex = _index;
          this.ifBlank = false;
      }
  };


  /******/
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
   * @param {boolean} 1 是否自动隐藏
   * @return {[type]}     null
   */
  var showNote = function(msg,type,time){
      $("#js_mask").show();
      if(msg){
         $("#js_note .layui-layer-content").html(msg);
      }
      $("#js_note .layui-layer-btn").hide();
      $("#js_note").show();
      if(type){
          var _time = time ? time : 1000;
          var timeIntervalId = setTimeout(function(){
            $("#js_mask").hide();
            $("#js_note").hide();
            clearTimeout(timeIntervalId);
          },_time);
      }
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
            if(_successback ){
               if(typeof _successback === "string"){
                   _self[_successback](data);
               }else if(typeof _successback === 'function'){
                   _successback(data);
               }
            }else{
               console.log(data);
            }
        },
        error : function(data){
            console.error("getData error | "+_url+" | "+_params);
            if(_errorcallback ){
               if(typeof _errorcallback === "string"){
                   _self[_errorcallback](data);
               }else if(typeof _errorcallback === 'function'){
                   _errorcallback(data);
               }
            }else{
              console.log(data);
            }
        }
      });
  };
  //
  subtitleAxis.init = function(options,containerId){
    this.options = options;
    this.containerId = containerId;
    this.container = $('#'+containerId);
    this.checkIfDatData();
    //本地存储key 整体数据存储
    this.localKey = this.options.videoId + "_SUBTITLEAXIS";

    //提交字幕失败的时候的数据存储key
    this.remainKey =  "REMAIN_SUBTITL";

    //提交时间轴数据失败的时候的本地存储key
    this.remainSKey = "REMAIN_SUBTITLEAXIS";
    this.baseLanguage = options.language;

    //this.staicState = true; //字幕静态化状态 初始 需要获取数据
    
    //用于存储新的时间轴
    this.newSegments = [];  //存储未提交的时间轴信息
    this.newSubtitles = [];   //存储未提交的字幕数据
    //this.getServerSubTitles();    //获取服务端数据
    return this;
  };
  
  /**
   * 检查时间轴二进制文件是否正常
   * @return {[type]} [description]
   */
  subtitleAxis.checkIfDatData = function(){
      var url = 'http://alicdnsub.yxgapp.com/waveMap/'+this.options.videoId+'.dat';
      //var url = 'http://m.yxgapp.com/waveMap/'+this.options.videoId+'.dat';
      var _self = this;
      getAjax(url , {}, function(data){
         if(data.status === 404 || data.status === 503){
            console.error("video dat 是error");
            showNote("抱歉，当前视频暂不支持制作字幕，请通过app告诉我们，谢谢！");
            return;
         }else{
           _self.getServerSubTitles();
         }
      },function(data){
         if(data.status === 404 || data.status === 503){
            console.error("video dat 是error");
            showNote("抱歉，当前视频暂不支持制作字幕，请通过app告诉我们，谢谢！");
         }else{
            _self.getServerSubTitles();
         }
      });
  };
  
  /**
   * 获取服务端已经合成的字幕数据
   * @return {[type]} [description]
   */
  subtitleAxis.getServerSubTitles =  function(){
      var _localSubtitles = LocalStorage.getItem(this.localKey);
      //json解析本地存储，如果本地存储解解析失败，直接讲staticState 置为true，重新获取
      try{

          _localSubtitles = JSON.parse(_localSubtitles);

      }catch(e){

          console.error("本地存储数据解析失败||"+_localSubtitles);
          this.staticState = true;

      }
      
      //如果检测到当前的本地存储中没有字幕时间轴信息 直接获取
      if(!_localSubtitles || this.staticState){
          var params = {
              videoId : this.options.videoId,
              userName : this.options.userName,
              token : this.options.token
          };
          var _url  = this.urls.doload;
          _url = _url.replace("{@videoId}",this.options.videoId);
          _url += "?_t=" + new Date().getTime();
          getAjax(_url, {}, "downLoadSubTitlesCallBack");

      //检测到本地有存储的字幕数据，先判断线上的字幕是否有更新
      }else{

          this.localSubtitles = _localSubtitles;
          this.getStaticState();

      }
      
  };
 
  /**
   * 下载视频相关的字幕数据处理回调
   * @return {[type]} [description]
   */
  subtitleAxis.downLoadSubTitlesCallBack = function(data){
      var _subtitle = {};
      if(!data.result){
          showNote("视频字幕数据获取失败，请检查网络状态或者回到二维码页面重新扫码");
          return;
      }
      _subtitle = data.subtitle ||{};

      //对下载下来的数据进行排序
      if(_subtitle.subtitleItems.length > 0){

          _subtitle.subtitleItems = this.sort(_subtitle.subtitleItems);
      }

      //处理规范下载的字幕数据
      var _subtitles =  this.dealLoadSubTitle(_subtitle);

      //如果存在本地数据 进行本地数据和线上数据的合并处理
      if( this.localSubtitles ){

         this.mergeLocalItems1(_subtitles);

      }else{

         this.subtitles = _subtitles;

      }
      this.startInitContent();
  };
  
  /**
   * 开始初始化相关界面dom并绑定事件
   * @return {[type]} [description]
   */
  subtitleAxis.startInitContent = function(){
      //初始化时间轴
      this.segmentPart();

      //初始化dom结构
      this.initDom();

      //更新播放器的播放时间段
      if(this.subtitles.subtitleItems.length > 0){
          var _item = this.subtitles.subtitleItems[this.curIndex];
          this.changeCurrentTime(_item.startTime/1000, _item.endTime/1000);
      }

      //进行相关事件的绑定
      this.addEvent();
      //快捷键绑定
      this.addKeyDownEvent();
      //启动提交检查机制
      this.startPostInterval();
  };

  /**
   * 获取字幕静态化状态
   * @return {[type]} [description]
   */
  subtitleAxis.getStaticState = function(){
    var params = {
      videoId : this.options.videoId,
      userName : this.options.userName,
      token : this.options.token
    };
    getAjax(this.urls.getState, params, "staticStateCallBack",'staticStateError');
  };
  
  /**
   * 获取字幕静态化状态回调函数
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  subtitleAxis.staticStateCallBack = function(data,type){
      if(type === 'error'){
          this.staticState = true;
          this.getServerSubTitles();
      }else{
         if(data.result && !data.result.result){
            this.staticState = true;
            //this.options.errorCallBack ? this.options.errorCallBack("登陆凭证过期，请重新登陆") : this.showNote("字幕静态化数据获取失败");
            this.getServerSubTitles();
         }else{
            this.staitcState = data.subtitleResult;
            if(this.staticState){

                this.getServerSubTitles();

            }else{
                 //线上字幕没有更新,直接使用本地的字幕
                this.mergeLocalItems1();

                this.startInitContent();
            }
         }
      }
  };


  subtitleAxis.staticStateError = function(){
      this.staticState = true;
      this.getServerSubTitles();
  };
  /**
   * 对获取到的数据进行时间排序
   * @return {} [description]
   */
  subtitleAxis.sort = function(subtitleItems){
      function selectmin(arr,n, i){
          var k = i;
          for(var j = i+1 ;j < n; ++j) {
              if(parseInt(arr[k].startTime) > parseInt(arr[j].startTime)){ 
                k = j;
              }
          }
          return k;
      }
      var i = 0, len = subtitleItems.length;
      for(i; i<len; i++){
          var min = selectmin(subtitleItems, len, i);
          if(min !== i){
             console.log("min:"+min+"  i"+i);
             var temp = subtitleItems[i];
             subtitleItems[i] = subtitleItems[min];
             subtitleItems[min] = temp;
          }
      }
      return subtitleItems;
  };

  /**
   * 重构从数据接口下载下来的字幕数据
   * @param  {[type]} subtitle [Object]
   * @return {[type]}          [Object]  返回处理好格式的字幕
   */
  subtitleAxis.dealLoadSubTitle = function(subtitle){
      var _newSubtitle = {
      };
      this.segments = [];
      if(!subtitle){
         _newSubtitle.timeStamp = Math.ceil(new Date().getTime()/1000);
         _newSubtitle.baseLanguage = this.baseLanguage;
         _newSubtitle.subtitleItems  = [];
      }else{
         _newSubtitle.timeStamp = subtitle.subtitleTimestamp;
         _newSubtitle.baseLanguage = this.baseLanguage;
         _newSubtitle.subtitleItems = [];
         var i = 0,
             _len =  subtitle.subtitleItems.length;

         for(; i < _len ;i++){
            var _item  = subtitle.subtitleItems[i],
                j = 0,
                _iLen = _item.data.length;
           
            var _newseg = {};

            _newseg.startTime = _item.startTime < 0 ? 0 : parseInt(_item.startTime) / 1000;
            _newseg.endTime = parseInt(_item.endTime) / 1000;
            
            _newseg.editable = true;
            _newseg.id = _item.id;
            _newseg.segmentId = _item.id;
            _newseg.overview = "Kinetic.Group";
            _newseg.zoom = "Kinetic.Group";

            var _newItem = {};
            _newItem.startTime = parseInt( _item.startTime );
            _newItem.endTime = parseInt( _item.endTime ) ;
            _newItem.id = _item.id;
            _newItem.subtitleItemId = _item.id;
            _newItem.isDifficult =  3;
            if(_iLen === 0){
                 _newItem.content = "";
                 _newItem.language = this.baseLanguage;
            }else{
                for( ; j < _iLen ; j++){
                   if(_item.data[j].language === this.baseLanguage){
                      _newItem.content = _item.data[j].content ? _item.data[j].content : "";
                      _newItem.explanation = _item.data[j].explanation;
                      //_newItem.language =  _item.data[j].language;
                      _newItem.updateTime = _item.data[j].updateTime;
                      _newItem.username  =  _item.data[j].username;
                      _newItem.userNickname = _item.data[j].userNickname;
                      _newItem.language = this.baseLanguage;
                      _newItem.subtitleItemId = _item.id;
                      continue;

                   }
                }
            }
            
            _newSubtitle.subtitleItems.push(_newItem);
            this.segments.push(_newseg);
         }
      }
      return _newSubtitle;
  };
  
  /**
   * 合并本地存储的字幕数据   如何合并待定
   * @return {[type]} [description]
   */
  subtitleAxis.mergeLocalItems = function(subtitles){
      var i = 0 ,_len = this.localSubtitles.subtitleItems.length;
      this.segments =[];
      //如果没有传参数，即直接使用本地存储
      if(!subtitles){
          for( ;i < _len ;i++){
              var _newseg = {},
                  _item = this.localSubtitles.subtitleItems[i];
              _newseg.startTime = _item.startTime < 0 ? 0 : _item.startTime / 1000;
              _newseg.endTime = _item.endTime / 1000;
            
              _newseg.editable = true;
              _newseg.id = _item.subtitleItemId;
              _newseg.segmentId = _item.subtitleItemId;
              _newseg.overview = "Kinetic.Group";
              _newseg.zoom = "Kinetic.Group";
              this.segments.push(_newseg);
          }
      //否则将本地存储和传入的subtitle合并，并生成新的segments
      }else{
          var _nLen = subtitles.subtitleItems.length,
              _len = this.localSubtitles.subtitleItems.length,
              _segments = [];
          if(_len < _nLen && subtitles.subtitleTimestamp > this.localSubtitles.subtitleTimestamp){
            _len = _nlen;
          }
          for( ;i < _len ;i++){

              var _localItem = this.localSubtitles.subtitleItems[i];
              var j = 0, _nLen = subtitles.subtitleItems.length;

              for(; j < _nLen ;j++){

                  var _item = subtitles.subtitleItems[j];
                  if(_localItem.subtitleItemId === _item.subtitleItemId || (_localItem.content !=="" && _localItem.content === _item.content )
                      || (_localItem.startTime === _item.startTime && _localItem.endTime === _item.endTime)){
                    if(_localItem.updateTime < _item.updateTime){
                        _localItem = _item;
                    }else if(_localItem.subtitleItemId.indexOf("b_") > 0){
                        _localItem.subtitleItemId = _item.subtitleItemId;
                    }
                    break;
                  }
              }
              var _newseg = {};
              _newseg.startTime = _localItem.startTime < 0 ? 0 : _localItem.startTime / 1000;
              _newseg.endTime = _localItem.endTime / 1000;
        
              _newseg.editable = true;
              _newseg.id = _localItem.subtitleItemId;
              _newseg.segmentId = _localItem.subtitleItemId;
              _newseg.overview = "Kinetic.Group";
              _newseg.zoom = "Kinetic.Group";
              this.segments.push(_newseg);
          }
          this.subtitles =  this.localSubtitles;
          //this.localSubtitles = null;
      }
  };
  
  subtitleAxis.mergeLocalItems1 = function(subtitles){
      this.segments = [];
      var _timeStamp  = subtitles.timeStamp,
          _localTimeStamp = this.localSubtitles.timeStamp;
      var _newSubtitleItems ,_oldSubtitleItems;
      if(_timeStamp > _localTimeStamp){
         this.subtitles = subtitles;
         _newSubtitleItems = subtitles.subtitleItems;
         _oldSubtitleItems = this.localSubtitles.subtitleItems;
      }else{
         this.subtitles = this.localSubtitles;
         _newSubtitleItems = this.localSubtitles.subtitleItems;
         _oldSubtitleItems = subtitles.subtitleItems;
      }

      var _len = _newSubtitleItems.length, i = 0, j = 0;

      for( ;i < _len ;i++){
          var _newItem = _newSubtitleItems[i];
          //var j = 0, _nLen = subtitles.subtitleItems.length;

          for(; j < _len ;j++){

              var _item = _oldSubtitleItems[j];
              if(_newItem.subtitleItemId === _item.subtitleItemId || (_newItem.content !=="" && _newItem.content === _item.content )
                  || (_newItem.startTime === _item.startTime && _newItem.endTime === _item.endTime)){
                if(_newItem.updateTime < _item.updateTime){
                    _newItem = _item;
                }else if(_newItem.subtitleItemId.indexOf("b_") > 0){
                    _newItem.subtitleItemId = _item.subtitleItemId;
                }
                break;
              }
          }
          var _newseg = {};
          _newseg.startTime = _newItem.startTime < 0 ? 0 : _newItem.startTime / 1000;
          _newseg.endTime = _newItem.endTime / 1000;
    
          _newseg.editable = true;
          _newseg.id = _newItem.subtitleItemId;
          _newseg.segmentId = _newItem.subtitleItemId;
          _newseg.overview = "Kinetic.Group";
          _newseg.zoom = "Kinetic.Group";
          this.segments.push(_newseg);
      }
       this.subtitles.subtitleItems = _newSubtitleItems;
  };
  /**
   * 初始化时间轴
   * @return {[type]} [description]
   */
  subtitleAxis.segmentPart = function(){
    var  i = 0, _len = this.segments.length;
    for(; i < _len ; i++){
        if(i % 2 === 0){
            this.segments[i].color = "#646464";
        }else{
            this.segments[i].color = "#343434";
        }
    }
    // TODO 再看是否有必要留着
   // window.globalSegments = {};
    // 储存根据starttime排序的片段，数值为{id: '', startime: ''}
   // window.orderedSegments = [];
    var options = {
      container: document.getElementById('peaks-container'),
      mediaElement: document.querySelector('video'),
      dataUri: {
         //arraybuffer: 'http://m.yxgapp.com/waveMap/'+this.options.videoId+'.dat'
        arraybuffer: 'http://alicdnsub.yxgapp.com/waveMap/'+this.options.videoId+'.dat'/*,
        json: 'http://m.yxgapp.com/wave_map_file/'+this.options.videoId+'.json'*/
      },
      keyboard: false,
      height: 150,
      // Colour for the overview waveform rectangle that shows what the zoom view shows
      overviewHighlightRectangleColor: '#0c6d8f',
      // Colour for the zoomed in waveform
      zoomWaveformColor: '#cecece',
      // Colour for the overview waveform
      overviewWaveformColor: '#cecece',
      // Colour of the play head(move line)
      playheadColor: '#df1f1e',
      // Colour of the axis gridlines
      axisGridlineColor: '#fff',
      // Colour of the axis labels
      axisLabelColor: '#fff',
      markerHeight:5,//时间刻度表与边缘的位置差
      // 覆盖在总体波形图上面的矩形宽度
      zoomLevels: [512, 1024, 2048, 4096],
      pointMarkerColor:     '#FF0000', //Color for the point marker
      inMarkerColor: '#df1f1e',

      // Colour for the out marker of segments
      outMarkerColor: '#df1f1e',
      outlineColor:"#32a0c6",
      inlineColor:"#35c5f7",
      /**
       * Colour for the in marker of segments
       */
      //inMarkerColor:         'black',
      /**
       * Colour for the out marker of segments
       */
      //每一个时间抽的颜色非随机
      randomizeSegmentColor : false,
    };
    if(this.segments.length > 0){
      options.segments =  this.segments;
    }else{
      options.segments = [];
    }
    /*this.peaksInstance = Peaks.init(options);
    this.peaksInstance.zoom.zoomOut();
     var _self = subtitleAxis;
    this.peaksInstance.on('segments.dragend', function (segment) {
      console.log("-------"+segment);
      //segmentPart.draggSegment(_self.peaksInstance, segment);
      //peaksInstance.waveform.segments.updateSegments();
      Control.subtitleAxis.updateSubtitle(segment);
    });
    this.peaksInstance.on('dbclickAddSegment', function () {
        segmentPart.addSegment(_self.peaksInstance);
    });*/
      /**************使用segments和peakURLs 初始化时间轴**************/
      //初始化时间轴
      segmentPart.init(options);
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
      this.ulDom = this.container.find(".sublist").length === 0 ? $(document.createElement("ul")) : $(this.container.find(".sublist")[0]);
      this.ulDom.css({positon:"relative",top:0,left:0});

      for(; i < _len ;  i++){
          var _segmentObj = _subtitleItems[i];
          var _duration = ((_segmentObj.endTime - _segmentObj.startTime)/1000).toFixed(1);
          var _class = i=== this.curIndex ? "active" : "";
          var _content = _segmentObj.content ? _segmentObj.content : "";
          var _wps = (this.getWordsNum(_content) / _duration).toFixed(1)+"WPS";
          var _liStr = limodel.replace('{@startTime}', this.getTimeModel(_segmentObj.startTime/1000))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@textId}', _segmentObj.subtitleItemId)
                 .replace('{@wps}', _wps)
                 .replace('{@word}',this.getWordsNum(_content))
                 .replace('{@class}',_class)
                 .replace('{@content}',_content)
                 .replace('{@content}',_content)
                 .replace('{@data-index}', i)
                 .replace('{@data-index}', i)
                 .replace('{@data-index}', i);
          //this.liList.push(_liStr);
          $(this.ulDom).append(_liStr);
      }

      this.container.append(this.ulDom);
      this.lis = $(this.container).find("li");
      var _height = ((this.lis.length + 1) * 150) + "px";
      $(this.ulDom).css("height",_height);
      if(_len === 0){
         $(this.container.find(".sublistnote")).show();
         $(this.ulDom).hide();
      }
      try{
          $("#"+this.containerId).mCustomScrollbar({
              theme:"my-theme",
              mouseWheel:{scrollAmount:131}
          });
      }catch(e){
          var _self = this;
          setTimeout(function(){
            $("#"+_self.containerId).mCustomScrollbar({
                theme:"my-theme",
                mouseWheel:{scrollAmount:131}
            });
          },500);
      }
  };
 
  /**
   * 根据字幕插入索引和字幕数据，在dom中插入一条数据
   * @param {Int} index       字幕需要插入的索引位置
   * @param {Object} newSubtitle 要插入的新字幕数据
   */
  subtitleAxis.addLiDom = function(index, newSubtitle){
      if(this.lis.length === 0){
         $(this.container.find(".sublistnote")).hide();
         $(this.ulDom).show();
      }
      var _duration = ((newSubtitle.endTime - newSubtitle.startTime)/1000).toFixed(1);
      var _wps = (newSubtitle.content.length / _duration).toFixed(1)+"WPS";
      var _class = "active";
      var _liStr = limodel.replace('{@startTime}', this.getTimeModel( newSubtitle.startTime/1000 ))
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
      if(this.lis.length === 0){
          $(this.ulDom).append(liDom);
      }else if(index > 0){
          var lastDom = $(this.lis[index-1]);
          liDom.insertAfter(lastDom);
      }else if(index === 0){
          var nextDom = $(this.lis[index]);
          liDom.insertBefore(nextDom);
      }
      this.lis = $(this.container).find("li");
      this.updateDomIndex();
      var _height = (150 * (this.lis.length + 1))+"px";
      $(this.ulDom).css("height",_height);
      this.changeCurrentIndex(index,null,true);
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
      var _height = (150 * (this.lis.length + 1))+"px";
      $(this.ulDom).css("height",_height);
      if(this.lis.length === 0){
          console.log(this.container.find(".sublistnote"));
         $(this.container.find(".sublistnote")).show();
         $(this.ulDom).hide();
      }
  };

  /**
   * 格式化时间  以second为单位
   * @param  {Int} _time 时间轴
   * @return {String}       拼接好的时间轴数据
   */
  subtitleAxis.getTimeModel = function(_time){
        var _secondNum = Number(_time.toFixed(1));
        var _hours = parseInt(_secondNum / 3600);
        var _minutes = parseInt((_secondNum - _hours * 3600) / 60);
         _secondNum = Number((_secondNum - _hours * 3600 - _minutes * 60).toFixed(1));
         if(_secondNum === parseInt(_secondNum)){
            _secondNum = parseInt(_secondNum);
         }
        _minutes = _minutes > 9 ? _minutes : ("0"+_minutes);
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
  };

  
  /***************事件处理函数 绑定相关数据*****************/
  /**
   * 绑定相关事件
   */
  subtitleAxis.addEvent = function(){
      var _self = this;
      //添加li标签的点击事件
      this.container.delegate(".sub-content","click",function(e){
          //_self.changeCurrentIndex(this);
          console.log("---sub-content click");
          _self.subconClick($(this), e, true);
      });

      //添加编辑框失去焦点事件
      this.container.delegate("textarea","blur",function(e){
          _self.enBlur($(this),e);
          console.log("textarea blur");
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
        document.addEventListener('keydown',function(event){
            var e = event || window.event || arguments.callee.caller.arguments[0];
            //console.log(e.keyCode);
            /*if(e && e.keyCode === 32){
                _self.play();
                return;
            }*/
            if(e.ctrlKey){
               var keycode =  e.keyCode ;
               if(keycode === 83){
                  event.returnValue = false;
                  _self.play();
                  return;
               }
               switch(keycode){
                  case 65:
                     if(_self.clientY >= 326){
                        break;
                        return;
                     }
                     event.returnValue = false;
                     _self.addSubtitleAxis();
                     break;
                  case 82:
                     /*if(_self.clientY && _self.clientY < 70){
                        break;
                        return;
                     }*/
                     event.returnValue = false;
                     _self.playCurrent();
                     break;
                  case 68:
                      event.returnValue = false;
                      _self.deleteSubtitleCurrent();
                      break;
                  case 83:
                      event.returnValue = false;
                      _self.play();
                      break;
                  default:
                      return false;
               }
            }
            return false;
        });
        if(window.navigator.userAgent.indexOf("Windows") > -1){
          document.addEventListener("mouseover",function(event){
              _self.clientY = event.clientY;
              _self.clientX = event.clientX;
          });
        }
  };
  
  /**
   * 按tab键和shift tab键的处理流程
   * @return {[type]} [description]
   */
  subtitleAxis.tabClick  = function(e, type){
     var  _nextindex = type ? (this.curIndex + 1) : (this.curIndex - 1);
     if(_nextindex < 0 || _nextindex >= this.subtitles.subtitleItems.length){
        return false;
      }
     this.changeCurrentIndex(_nextindex,true);
  };
  /**
   * 点击编辑区域的时候的处理
   * @param  {[type]} target [description]
   * @param  {[type]} e      [description]
   * @return {[type]}        [description]
   */
  subtitleAxis.subconClick =  function (target, e, ifchageTime) {
       var _index = parseInt(target.attr("data-index"));
       if(!!e){
          this.changeCurrentIndex(_index,null,ifchageTime);
       }
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
        val = target.val();
        target.hide();
        var txtDom = target.siblings('.txt');
        txtDom.html(val).show();
        //target.siblings('.en-txt').removeClass("en-error");
        var _index = parseInt(target.attr("data-index"));
        var _basesubtitle = this.subtitles.subtitleItems[_index];//this.data.subtitleItems[_index].baseSubtitleItem;
        if(_basesubtitle.content !== val && val !== ""){
            _basesubtitle.content = val;
            this.subtitles.timeStamp  = _basesubtitle.updateTime =  parseInt(new Date().getTime()/1000);
            //_basesubtitle.autoCaption = 0;
            _basesubtitle.username = this.options.username;
            _basesubtitle.userNickname = this.options.nickname;
            _basesubtitle.isDifficult = 3;
            _basesubtitle.action = 0;
            _basesubtitle.language = this.baseLanguage;
            _basesubtitle.subtitleItemId = _basesubtitle.subtitleItemId;
            this.newSubtitles.push(_basesubtitle);
            this.updateLoacal(1);
            this.updateWps(target.parent(), _index);
            this.showCurVideotext(_basesubtitle.content);
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
           _wps = (this.getWordsNum(_subtitle.content) / _duration).toFixed(1)+"WPS";
      var _next = $(parentDom).next();
      _next.find(".js_wps").html(_wps);
      _next.find(".js_wordsCount").html(this.getWordsNum(_subtitle.content)+"word");
  };
  
  /**
   * 获取单词个数 
   * @param  {String} str 需要计算的字符串包含的单词数量
   * @return {Number}     包含的单词个数
   */
  subtitleAxis.getWordsNum = function(str){
      str = str.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|||\-|\_|\+|\=|\||\\|||\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g," ");
      str = str.replace(/(^\s*)/g, "").replace(/(\s*$)/g, "");
      var num = str.split(" ").length;
      return num ;
  };
  
  /**
   * 显示删除提示层
   * @param  {[type]} id     当前时间轴或者是字幕的segmentId
   * @param  {[type]} _index 当前时间轴或者是字幕所在的位置
   * @param  {[type]} type   删除的类型 1是时间轴，非1是字幕
   * @return {[type]}        [description]
   */
  subtitleAxis.showDeleteNote = function(id,_index,type){
      this.play(true);//暂停当前视频
      var dom = $("#js_delete");
      var subtitleItem = this.subtitles.subtitleItems[_index];
      var _typeStr = type == 1 ? "时间轴" : "字幕";
      //dom.find(".layui-layer-content").html("确定要删除开始时间为："+this.getTimeModel(Math.round(subtitleItem.startTime / 1000))+"的"+_typeStr+"?");
      dom.find(".layui-layer-content").html("确定要删除开始时间为："+ this.getTimeModel(subtitleItem.startTime / 1000) + "s的"+_typeStr+"?");
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
      var flag = segmentPart.deleteSegment(_index);
      if(flag){
        //移除字幕条
         this.curIndex = -1;
         this.removeSubtitle(_index);
      }
  };
  
  /**
   * 根据时间轴当前时间找到当前的时间轴的索引
   * @return {[type]} [description]
   */
  subtitleAxis.findCurrentIndexByCurrentTime = function(_time){
      var _currentTime = _time,
          i = 0 ,_len = this.segments.length;
      var _segment = null,_index = -1;
      for(; i < _len ;i++){
          if(_currentTime >= this.segments[i].startTime && _currentTime <= this.segments[i].endTime){
              _segment = this.segments[i];
              _index = i;
              break;
          }
      }
      return _index;
  };
  
  /**
   * 删除当前选中为焦点的时间轴
   * @return {[type]} [description]
   */
  subtitleAxis.deleteSubtitleCurrent = function(){
      var index = segmentPart.fIndex;//this.findCurrentIndexByCurrentTime(segmentPart.time());
      if(index >= 0){
          var segmentId = this.segments[index].segmentId;
          this.showDeleteNote(segmentId,index,1);
      }else{
         showNote("请在声波图上单击选中需要删除的时间轴",true);
      }
  };
  
  subtitleAxis.addSubtitleAxis = function(){
      segmentPart.addSegment();
  };
  /**
   * 添加一个时间轴对象之后的回调
   * @param {int} index 本次添加的时间轴插入的位置
   * @param {[type]} segs  时间轴对象
   */
  subtitleAxis.addSubtitle = function(segments) {
      var i = 0 , _len =  this.segments.length;
      //var _orderSeg = this.peaksInstance.segments.getSegments();
      var insertIndex = segments[0].index,
          _newSegment =segments[0] ;

      /*for(; i < _len; i++){
        if(this.subtitles.segments[i].id != _orderSeg[i].segmentId){
            insertIndex =  i;
            break;
        }else{
           continue;
        }
      }
      if(insertIndex === -1){
           insertIndex = _orderSeg.length - 1;
      }*/
      

      var _newSeg = {};
      _newSeg.id = _newSegment.segmentId;//"b_" + new Date().getTime();
      _newSeg.action  = 1;
      _newSeg.startTime = parseInt(_newSegment.startTime * 1000);
      _newSeg.endTime = parseInt(_newSegment.endTime * 1000);
      _newSeg.source = 1;
      console.log(_newSeg);
      //_newSegment.id = _newSegment.segmentId;
      this.segments.splice(insertIndex, 0 ,_newSegment);
      
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
                          userName : this.options.username,
                          userNickname : this.options.nickname
                        };
      this.subtitles.subtitleItems.splice(insertIndex, 0 ,_newSubtitle);
      this.subtitles.timeStamp = this.subtitles.subtitleItems[insertIndex].updateTime = Math.ceil(new Date().getTime() / 1000);
      //插入一条dom结构
      this.addLiDom(insertIndex,_newSubtitle);
      this.curIndex = insertIndex;
      //console.log("addSubtitle :"+this.curIndex);
      // if(insertIndex < this.curIndex){
      //    this.curIndex++;
      // }
      //更新整体数据本地存储
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
      this.segments.splice(index,1)[0];
      var delSeg  = {};
      delSeg.startTime = subtitleItem.startTime;
      delSeg.endTime = subtitleItem.endTime;
      delSeg.id = subtitleItem.subtitleItemId;
      delSeg.action = 3;
      this.subtitles.timeStamp = Math.ceil(new Date().getTime() / 1000);
      // delSeg.startTime = delSeg.startTime * 1000;
      // delSeg.endTime = delSeg.endTime * 1000;
      this.newSegments.push(delSeg);
      //this.updateLoacal(3);
      
      //移除dom结构
      this.deleteLiDom(delSeg.id, index);

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
     this.curIndex = _index;
     var _oldseg = this.segments[_index];
     /*if(Math.abs(seg.startTime * 1000 - _oldseg.startTime < 500) && Math.abs(seg.endTime * 1000 -_oldseg.endTime) < 500){
        return;
     }*/

     var _newSeg = {};
         _newSubtitle = this.subtitles.subtitleItems[_index];

     this.segments[_index].startTime = seg.startTime;
     this.segments[_index].endTime = seg.endTime;

     _newSeg.startTime = _newSubtitle.startTime = parseInt(seg.startTime * 1000);
     _newSeg.endTime = _newSubtitle.endTime = parseInt(seg.endTime * 1000);

     //_newSubtitle.updateTime  = this.subtitles.timeStamp =  Math.ceil(new Date().getTime()/1000);
     _newSubtitle.updateTime  =  Math.ceil(new Date().getTime()/1000);
     _newSeg.id = this.segments[_index].segmentId;
     _newSeg.source = 1;
     //和最近的一条重复且都是action=0编辑，则舍弃上一条，以当前这条为标准
     var _flag = this.findUpdateItem(2,_newSeg);
     if(_flag  < 0){
          _newSeg.action = 2;
          this.newSegments.push(_newSeg);
     }
     //this.updateLoacal(3);

     _li.find(".start-time").html(this.getTimeModel(_newSeg.startTime / 1000));
     var _duration = ((_newSeg.endTime - _newSeg.startTime)/1000).toFixed(1);
     _li.find(".js_alltime").html(_duration+"seconds");

     var _content = this.subtitles.subtitleItems[_index].content || "";
     var _wps = (this.getWordsNum(_content)/ _duration).toFixed(1)+"WPS";
     _li.find(".js_wps").html(_wps);

     this.updateLoacal(1);
  };
  
  subtitleAxis.findUpdateItem = function(type, obj){
    var list , id, key;
    if(type == 1){
       list = this.newSubtitles;
       key = "subtitleItemId";
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
      var _top = _index === 0 ? 0 : (_index) * 150;
      this.container.mCustomScrollbar("scrollTo",_top);
  };

  /**
   * 改变当前需要编辑的字幕
   * @return {[type]} [description]
   */
  subtitleAxis.changeCurrentIndex = function(_index, ifClick, ifchageTime){
       if(_index === this.curIndex && _index !== -1 && !ifchageTime){
          this.showCurVideotext(this.subtitles.subtitleItems[this.curIndex].content);
          return;
       }
       var _li;
       //当前所在的时间轴是空的时候
       if(_index === -1){
          if(this.curIndex >= 0 ){
             _li = $(this.lis[this.curIndex]);
             _li.removeClass("active");
             _li.find("textarea").hide();
             _li.find(".txt").show();
             this.curIndex = -1;
          }
          this.showCurVideotext("");
          return;
       }
       if(_index < 0 || _index >= this.subtitles.subtitleItems.length){
          console.log($(this.lis[this.curIndex]).find(".sub-content")[0]);
          $($(this.lis[this.curIndex]).find(".sub-content")[0]).click();
          this.showCurVideotext('');
          return;
       }
       if(this.curIndex >= 0 ){
           _li = $(this.lis[this.curIndex]);
           _li.removeClass("active");
           _li.find("textarea").hide();
           _li.find(".txt").show();
       }
       //只有当前获取焦点的时间轴对应的字幕显示当前状态
       var _newLi;
       if(segmentPart.fIndex > -1){
           _newLi = $(this.lis[_index]);
           _newLi.addClass("active");
           _newLi.find("textarea").hide();
           _newLi.find(".txt").show();
       }

       this.curIndex = _index;

       //是否由
       if(ifClick && _newLi){
           console.log("this.subconClick||segmentPart.fIndex:"+segmentPart.fIndex);
           this.subconClick($(_newLi.find(".sub-content")[0]), null, true);
           //$(_newLi.find(".sub-content")[0]).click();
           
       }
       this.scrollTo(this.curIndex);
       //更新播放器播放时间
       var _item = this.subtitles.subtitleItems[this.curIndex];
       this.showCurVideotext(_item.content);
       //this.changeCurrentTime(_item.startTime/1000, _item.endTime/1000);
       if(ifchageTime){
          segmentPart.time(_item.startTime/1000, this.curIndex);
          segmentPart.changeMarker(this.curIndex);
       }
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
          //console.log("字幕数据没有更新");
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
                subtitleAxises : JSON.stringify(_newsegs)
          };
          //更新本地缓存 提交成功之后清空
          this.updateLoacal(3);
          getAjax("http://m.yxgapp.com/d/mooc/UpdateSubtitleAxis.json", _params ,"sendAxisSuccessBack","sendAxisErrorBack","POST");
          //LocalStorage.setItem( this.remainSKey, JSON.stringify([]) );

      }else{
          //console.log("时间轴数据没有更新");
      }
      
      if( !this.interval1 ){
          var _self = this;
          this.interval1 = setInterval(function(){
              _self.startPostInterval();
          },2000);
      }
    
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
      if(data.result.result){
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
      console.log("时间轴数据提交失败"+data.result.msg);
      this.clearLocal(3);       
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
  subtitleAxis.changeCurrentTime = function(startTime,endTime){
      segmentPart.time(startTime);
  };
 
 /**
  * 播放当前时间点内的视频
  * @return {[type]} [description]
  */
  subtitleAxis.playCurrent = function(){
      var _index = segmentPart.fIndex;//this.curIndex;//this.findCurrentIndexByCurrentTime(segmentPart.time());
      console.log("subtitleAxis.playCurrent:"+this.curIndex);
      //this.curIndex = _index;
      if(_index >=0 && !segmentPart.ifBlank){
          var _startTime =  this.segments[_index].startTime,
              _endTime = this.segments[_index].endTime;
          segmentPart.setPlayTime(_startTime, _endTime);
      }else{
          segmentPart.setPlayTime(-1, -1);
          this.play();
      }
  };

  subtitleAxis.play = function(ifPause){
      if(ifPause){
        Control.course.player.pause();
        return;
      }
      Control.course.player.play();
  }

  subtitleAxis.showCurVideotext = function(text){
      if(!this.videotextDom){
        this.videotextDom = $("#js-videotext");
      }
      this.videotextDom.html(text);
  }
  return subtitleAxis;
});
