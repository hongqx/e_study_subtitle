/**
 * 播放组件
 * @type {Object}
 */
function videoPlayer(containerId){
    this.containerId = containerId;
    this.startTime = 0;
    this.options = {
        autoPlay : false,
        onDataError : null,
        onDataOk : null,
        onEnd : null,
        onUpdate : null

    }
}
/**
     * 初始化播放组件
     * @param  {String} containerId    容器id
     * @param  {Object} options 配置信息
     * @return {}         [description]
     */
videoPlayer.init  = function(containerId,options,data){
    var instance = new videoPlayer(containerId);
    instance.data = data;
    instance.container = $("#"+containerId);
    instance.width =  instance.container.width();
    instance.height = instance.width * 9 / 16;
    instance.container.height(instance.height);
    instance.video = instance.container.find("video")[0];
    instance.options = options;
    //instance.userInfo = options.userInfo;
    instance.controlBtn = $(instance.container).find(".play-btn")[0];
    instance.trigger = $(instance.container).find(".video-trigger")[0];
    instance.mask = $(instance.container).find(".video-mask")[0];
    instance.startPlay = false;
    $(instance.video).attr("preload","auto");
    instance.startTime = 0;
    instance.endTime = 0;
    //instance.videoId = instance.options.videoId;
        //this.data = data;
    instance.initData(data);
    return instance;
};
videoPlayer.prototype = {
    changeVideo:function(data,videoId){
        this.dataIsok = false;
        this.startPlay = false;
        this.videoId = videoId;
        this.currentTime = 0;
        this.totalTime = 0;
        this.data = data;
    },
    initData:function(data,callback){
       if(!data){
          //console.log("data result is error");
          if(this.options.onDataError){
            this.options.onDataError(data);
          }
       }else if(!this.dataIsok){
          this.dataIsok = true;
          this.data = data;
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
       if(this.endTime && this.endTime > 0 && this.currentTime >= this.endTime){
           this.pause();
           this.endTime = -1;
           //this.video.currentTime  = this.startTime;
       }
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
       if(!this.startPlay){
         //this.hideControl();
         if(this.startTime > 0){
           this.video.currentTime = this.startTime;
           //this.startTime = 0;
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
    },
    //设置播放的时间范围
    setPlayTime : function(_startTime,_endTime){
         //this.video.currentTime = _startTime;
         this.startPlay = false;
         //$(this.video).on("canPlay")
         this.startTime = _startTime;
         this.endTime = _endTime;
    }
};