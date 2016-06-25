function SubtitleAxis(){
	this.limodel = [
            '<li class="{@class}" data-pindex="29" data-index="29" id="{@textId}">',
                  '<div class="subtitle">',
                      '<div class="subspan">',
                            '<span class="start-time">{@startTime}</span>',
                      '</div>',
                      '<div class="sub-content">',
                           '<div class="txt">Koreanclass101.com Hanna Hanna Hangul</div>',
                           '<textarea name="" cols="30" rows="10" placeholder="edit..."></textarea>',
                      '</div>',
                      '<div class="subspan">',
                          '<span class="js_wps">{@wps}</span>',
                          '<span class="js_alltime">{@alltime}seconds</span>',
                          '<span class="js_wordsCount">0word</span>',
                          '<span class="delete-icon">——</span>',
                      '</div>',
                  '</div>',
                  '<div class="buttomline"></div>',
            '</li>'
    ].join('');

    /**
     * 接口url
     * @type {Object}
     */
    this.urls = {
      updateS : "​http://m.yxgapp.com/d/mooc/UpdateSubtitleAxis.json",         //时间轴上传
      update : "​http://m.yxgapp.com/d/mooc/UpdateSubtitle.json",              //字幕上传
      doload : "http://m.yxgapp.com/mooc/{@videoId}/DownloadSubtitle.json"	,             //已合成的字幕下载
      getState :"http://m.yxgapp.com/mooc/GetStaticSubtitleState.json"        //字幕静态化状态获取
    };
}

SubtitleAxis.init = function(options,containerId){
    var _instance = new SubtitleAxis();
    _instance.options = options; /*{
      videoId : "ad1773cf-da42-4b69-ab9c-66994a8db66c", //视频id
      userName : null,   //用户名
      token : null,       //登陆凭证
      errorCallBack : null   //登陆凭证失败或者是接口调取失败的时候的回调
    };*/
    _instance.videoId = _instance.options.videoId;
    //本地存储key
    _instance.localKey = _instance.videoId + "_SUBTITLEAXIS";
    //本地存储结构
    _instance.localObj = null;/*{
       "segments" : null,
       "subtitleItems":null,
       "remainSegs" : null,
       "remainSubtitle" : null
    };*/
    _instance.containerId = containerId;  //容器id
    _instance.container = $(_instance.containerId);  //容器
    _instance.segs = [];   //时间轴存储
    _instance.subtitleItems = [];        //字幕存储
    _instance.staicState = true;        //字幕静态化状态 初始 需要获取数据
    _instance.getServerSubTitles();
    return _instance;
};

SubtitleAxis.prototype = {
  
  /**
   * 获取服务端已经合成的字幕数据
   * @return {[type]} [description]
   */
  getServerSubTitles : function(){
      if(!LocalStorage.getItem(this.localKey) || this.staicState){
          var params = {
              videoId : this.videoId,
              userName : this.options.userName,
              token : this.options
          };
          var _url  = this.urls.doload;
          _url = _url.replace("{@videoId}",this.videoId);
          this.getAjax(_url, {}, "downLoadSubTitlesCallBack");
      }else{
          this.getStaticState();
      }
  },
  
  /**
   * 下载视频相关的字幕数据处理回调
   * @return {[type]} [description]
   */
  downLoadSubTitlesCallBack : function(data){
      if(data.result && data.subtitle){
           //this.mergeLocalItems(data.subtitle);
           var _subtitle = data.subtitle
      }else{
        
      }
  },
  
  
    
  /**
   * 获取字幕静态化状态
   * @return {[type]} [description]
   */
  getStaticState : function(){
    var params = {
      videoId : this.videoId,
      userName : this.options.userName,
      token : this.options
    };
    this.getAjax(this.urls.getState, params, "staticStateCallBack");
  },
  
  /**
   * 获取字幕静态化状态回调函数
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  staticStateCallBack : function(data,type){
      if(type === 'error'){
          
      }else{
         if(data.result && !data.result.result){
            this.options.errorCallBack ? this.options.errorCallBack("登陆凭证过期，请重新登陆") : this.showNote("字幕静态化数据获取失败"); 
         }else{
            this.staicState = data.subtitleResult;
            this.getServerSubTitles();
         }
      }
  },
  
  getAjax : function(_url, _params ,_successback , _errorcallback,_getType){
      var _type = _getType==1 ? "POST" : "GET";
      var _self = this;
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
  },
  
  /**
   * 合并本地存储的字幕数据
   * @return {[type]} [description]
   */
  mergeLocalItems: function(subtitle){
      //if(!this.localObj){
          //this.localObj.subtitleItems = subtitle.subtitleItems;
          var _subtitleItems = subtitle.subtitleItems;
          var i = 0, _len = _subtitleItems.length;
          var segments = [];
          for(; i < _len ; i++){
              var _segment = {
                  servetId : _subtitleItems[i].id,
                  startTime : (_subtitleItems[i].startTime/1000).toFixed(1),
                  endTime : (_subtitleItems[i].endTime/1000).toFixed(1),
                  timeStamp : subtitle.subtitleTimestamp
              };
              segments.push(_segment);
          }
          this.localObj = {
             "segments" : segments,
             "subtitleItems":_subtitleItems,
             "remainSegs" : [],
             "remainSubtitle" : []
          };
          this.initData();

      // }else{

      // }
  },

  initData : function(){
     var peakURLs = {
        arraybuffer: 'http://cdn.yxgapp.com/wave_map_file/'+this.videoId+'.dat',
        json: 'http://cdn.yxgapp.com/wave_map_file/'+this.videoId+'.json'
     };
     /**************使用segments和peakURLs 初始化时间轴**************/
     this.initDom();
  },

  /**
   * 初始化整个结构
   * @return {[type]} [description]
   */
  initDom : function(){
      var _segments = this.localObj.segments,
          i = 0,
          _len = _segments.length;
      this.liList = [];
      this.ulDom = this.container.find("ul").length === 0 ? $(document.createElement("ul")) : $(this.container.find("ul")[0]);
      this.ulDom.css({positon:"relative",top:0,left:0});
      for(; i < _len ;  i++){
          var _segmentObj = _segments[i];
          var _duration = _segmentObj.endTime - _segmentObj.startTime;
          var _class = i===0 ? "active" : "";
          var _liStr = this.limodel.replace('{@startTime}', this.getTimeModel(_segmentObj.startTime))
                 .replace('{@alltime}', _duration)
                 .replace('{@textId}', _segmentObj.servetId)
                 .replace('{@wps}', '0WPS')
                 .replace('{@class}',_class);
          //this.liList.push(_liStr);
          $(this.ulDom).append(_liStr);
      }
      this.container.html(this.ulDom);
      this.lis = $(this.container).find("li");
  },
  
  getTimeModel : function(_time){
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
  },
  updateLoacal : function(){

  },
  /**
   * 绑定相关事件
   */
  addEvent : function(){

  },
  /**
   * 添加一个时间轴
   * @param {segment} seg 添加时间轴 {id,}
   */
	addSubtitle : function(segs) {
		
	},

  /**
   * 移除某一条字幕
   * @param  {[type]} seg [description]
   * @return {[type]}     [description]
   */
	removeSubtitle : function(seg){
      
	},

  /**
   * 更新某一条字幕
   * @param  {[type]} segs [description]
   * @return {[type]}      [description]
   */
	updateSubtitle : function(segs){

	},
  /**
   * 滚动字幕
   * @return {[type]} [description]
   */
	scrollTo : function(){
     
	},

  /**
   * 改变当前需要编辑的字幕
   * @return {[type]} [description]
   */
  changeCurrentIndex : function(){

  },

  /**
   * 上传字幕
   * @return {[type]} [description]
   */
	saveSubtitle : function(){

	},
  
  /**
   * 上传时间轴数据
   * @return {[type]} [description]
   */
  saveSegments : function(){

  },

  showNote : function(msg){
      $("#js_mask").show();
      if(msg){
         $("#js_note .layui-layer-content").html(msg);
      }
      $("#js_note .layui-layer-btn").hide();
      $("#js_note").show();
  },

  hideNote : function(){
         $("#js_mask").hide();
         $("#js_note").hide();
  }
};
