/**
 * 播放组件
 * @type {Object}
 */
var videoPlayer = {
    /**
     * 初始化播放组件
     * @param  {String} containerId    容器id
     * @param  {Object} options 配置信息
     * @return {}         [description]
     */
    init:function(containerId,options){
        this.containerId = containerId;
        this.container = $("#"+this.containerId);
        var _width = this.container.width();
        var _height = _width * 9 / 16;
        this.container.height(_height);
        this.video = $(this.container).find("video")[0];
        this.options = options;
        this.userInfo = options.userInfo;
        this.controlBtn = $(this.container).find(".play-btn")[0];
        this.trigger = $(this.container).find(".video-trigger")[0];
        this.mask = $(this.container).find(".video-mask")[0];
        this.startPlay = false;
        $(this.video).attr("preload","auto");
        this.videoId = this.options.videoId;
        this.getData();
        this.requestTime = 0;
        this.startTime = 0;
        //this.data = data;
    },
    changeVideo:function(data,videoId){
        this.dataIsok = false;
        this.startPlay = false;
        this.videoId = videoId;
        this.currentTime = 0;
        this.totalTime = 0;
        this.data = data;
    },
    initData:function(data,callback){
       if(!data.result.result){
          //console.log("data result is error");
          if(this.options.onDataError){
            this.options.onDataError(data);
          }
       }else if(!this.dataIsok){
          this.dataIsok = true;
          this.data = data.video;
          if(this.options.onDataok){
             this.options.onDataok(this.data);
          }
          if(!this.eventIfOk){
            this.eventIfOk = true;
            this.addEvent();
          }
          this.initPlayer();
          if(callback){
            callback(data);
          }
       }
       
    },
    getData:function(){
        var _url = "http://m.yxgapp.com/d/mooc/GetVideo.json",
            _self = this;
        var _params = {
            videoId:this.videoId,
            token:this.userInfo.token,
            username:this.userInfo.username
        };
        _self.requestTime++;
        $.ajax({
            url:_url,
            data:_params,
            dataType:"json",
            success:function(data){
               _self.initData(data);
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
    initPlayer:function(){
        this.poster = document.createElement("img");
        this.poster.src = this.data.coverUrl;
        $(this.video).after(this.poster);
        this.video.src = this.data.url;
        this.video.load();
        $(this.video).show();
        this.totalTime = this.data.durationHour;
        if(this.options.autoPlay){
            this.video.play();
        }
    },
    addEvent:function(){
        var _self = this;
        $(this.controlBtn).on("click",function(){
           _self.play();
           return false;
        });
        $(this.trigger).on("mouseenter",function(e){
           //console.log("mouseenter");
           _self.showControl();
        });
        $(this.trigger).on("mouseleave",function(e){
           //console.log("mouseleave");
           _self.hideControl();
        });
        $(this.trigger).on("click",function(){
           _self.showControl();
        });
        var eventList = {
           "play":"onPlay",
           "pause":"onPause",
           "timeupdate":"onTimeUpdate",
           "error":"onError",
           "ended":"onEnded",
           "seeking":"onSeeking",
           "seeked":"onSeeked",
           "waiting":"onWating"
        };
        function addEventHander(object,fun){
            var args = Array.prototype.slice.call(arguments).slice(2);
               return function(event) {
                //console.log("$ " + fun);
                return fun.apply(object, [event || window.event].concat(args));
            };
        }
        for(var key in eventList){
          var keyFn = addEventHander(this,this[eventList[key]]);
          $(this.video).on(key,keyFn);
        }
    },
    hideControl : function(){
        if(!this.startPlay || this.video.paused ||  $(this.controlBtn).css("display") === "none"){
            return;
        }
        $(this.controlBtn).fadeOut();
        $(this.mask).fadeOut();
    },
    showControl : function(){
        //console.log(this.startPlay+"  " +!this.video.paused+"  "+ ($(this.controlBtn).css("display")==="none"));
        if(this.startPlay){
            $(this.controlBtn).fadeIn();
            $(this.mask).fadeIn();
        }
    },
    showLoading : function(){
        if($(".loading")){
         $(".loading").show();
        }
    },
    hideLoading : function(){
       if($(".loading")){
         $(".loading").hide();
       }
    },
    changeBtnState:function(state){
        //播放状态 显示暂停
        if(state){
            $(this.trigger).removeClass("playbtn");
            $(this.trigger).addClass("pausebtn");
        //暂停状态
        }else{
            $(this.trigger).addClass("playbtn");
            $(this.trigger).removeClass("pausebtn");
        }
    },
    removeEvent : function(){
    },
    onPlay : function(){
       this.startPlay = true;
       $(this.poster).fadeOut("slow");
       //this.hideControl();
       this.changeBtnState(true);
       this.hideControl();
    },
    onPlaying : function(){
       //console.log("onplaying");
    },
    onEnded : function(){
        this.showControl();
        this.changeBtnState(false);
        if(this.options.onEnd){
            this.options.onEnd();
        }
    },
    onPause : function(){
        //console.log("onPause");
        this.changeBtnState(false);
        this.showControl();
    },
    onWating : function(){
        //console.log("onWating");
        this.showLoading();
    },
    onTimeUpdate : function(){
       this.hideLoading();
       this.currentTime = this.video.currentTime;
       this.options.onUpdate ? this.options.onUpdate(this.video.currentTime) : "";
    },
    onError : function(){
        alert("the video play is error");
    },
    onSeeking : function(argument) {
      //console.log("onSeeking");
    },
    onSeeked : function (argument) {
       this.showLoading();
    },
    play : function(){
       $(this.poster).fadeOut("slow");
       if(!this.startPlay){
         //this.hideControl();
         if(this.startTime > 0){
           this.video.currentTime = this.startTime;
           this.startTime = 0;
         }
         this.video.play();
       }else{
         if(this.video.paused){
            this.video.play();
         }else{
            this.video.pause();
         }
       }
    },
    pause:function(){
      this.video.pause();
    },
    isPause : function(){
       return this.video.paused;
    },
    seek : function(time, callback){
     // console.log("seek:"+time);
       this.video.currentTime = time;
       if(callback){
         callback(this.currentTime);
       }
       //this.video.load();
       this.video.play();
    },
    //设置第一次播放的时间
    setStartTime : function(_time){
       this.startTime = _time;
    }
};