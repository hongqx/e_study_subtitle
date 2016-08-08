/*!estudysubtitle
 *version 1.1.0
 *2016-08-01  05:17:04
 *完善提交逻辑，时间轴线和字幕列表联动
 */
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
                  this.removeItem(_key+"_SUBTITLEAXIS_REMAIN");
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
};/*--------*/
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
         //this.startPlay = false;
         //$(this.video).on("canPlay")
         //this.startTime = _startTime;
         //this.endTime = _endTime;
         this.video.currentTime = _startTime;
         var _self = this;
         $(this.video).on("canPlay",function(){
              this.currentTime = _startTime;
         });
    }
};/*--------*/
/**
 * 用户信息初始化
 * @return {[type]} [description]
 */
var userInfo = function(){
	var _nickname = Cookie.get("nickname"),
		_avatarUrl = Cookie.get("avatarUrl");
	if(_nickname){
		$('#js_nickname').html(_nickname);
	}
	if(_avatarUrl){
		$("#js_userpic").attr("src",_avatarUrl);
	}
	return {
        avatarUrl : Cookie.get("avatarUrl"),
        nickname : decodeURI(Cookie.get("nickname")),
        username : decodeURI(Cookie.get("userId")),
        token : Cookie.get("token"),
        videoId : Cookie.get("videoId"),
        courseId : Cookie.get("courseId"),
        language : Cookie.get("language"),
        action : Cookie.get("action")
    };
};



/**
 * 课程信息初始化 依赖于VideoPlayer
 * [Course description]
 */
function Course(){
	this.interUrl = {
		courseUrl : "http://m.yxgapp.com/d/mooc/PutOpenCourseRecord.json",
		videoUrl : "http://m.yxgapp.com/d/mooc/GetVideo.json"
	}
	this.options = {
      
	}
}

Course.init = function(options,data){
    var _instance = new Course();
    _instance.options = options;
    _instance.data =  data;
    _instance.videoData = null;
    _instance.courseData = null;
    _instance.getData();
    _instance.player = null;
    return _instance;
};

Course.prototype = {

	showLoadNote : function(msg){
         $("#js_mask").show();
         if(msg){
             $("#js_note .layui-layer-content").html(msg);
         }
         $("#js_note .layui-layer-btn").hide();
         $("#js_note").show();
  },

  hideLoadNote : function(){
         $("#js_mask").hide();
         $("#js_note").hide();
  },

	showErrorNote : function(msg){
        this.hideLoadNote();
        msg = msg ? msg : "登陆状态失效，请重新扫描二维码进行登录";
        var _loginurl = "http://t.yxgapp.com/index.html";//上线的时候需要改动
        $("#js_mask").show();
        var btn = $("#js_note .layui-layer-btn0");
        var _conten = $("#js_note .layui-layer-content").html(msg);
        btn.html("前往扫描二维码");
        btn.attr("href",_loginurl);
        $("#js_note .layui-layer-btn").show();
        $("#js_note").show();
        window.tokenError = true;
    },

  getAjax : function(_url,_params,_successCallBack,_errorCallback){
      var _self = this;
         $.ajax({
            url:_url,
            data:_params,
            type:"GET",
            dataType:"json",
            context : this,
            success : function(data){
               _successCallBack ? this[_successCallBack](data) : console.log("get data success");
            },
            error:function(data){
                _errorCallback ? this[_errorCallback](data) : console.error(" get data error||"+data);
            }
         });
	},
    
  getData : function() {
      var _self = this;
      var  _cparams =  {
          username : this.options.username,
          token : this.options.token,
          courseId : this.options.courseId,
          command : "command_detail"
      };
      this.getAjax(this.interUrl.courseUrl , _cparams , "courseCallback");
      var _vparams = {
            videoId : this.options.videoId,
            token : this.options.token,
            username : this.options.username
        };

        this.getAjax(this.interUrl.videoUrl, _vparams , "videoInfoCallback");
    },

	courseCallback : function(data){
        if(!data.result.result){
           this.showErrorNote();
           //window.tokenError = true;
        }else{
          this.courseData = data.data;
          if(this.courseData.videoNumber  > 1){
            $("#js_coursetitle").html(this.courseData.name);
          }else{
            $("#js_coursetitle").html(this.courseData.enName);
          }
          this.showUniversity();
        }
	},
    
	videoInfoCallback : function(data) {
		if(!data.result.result){
           this.showErrorNote();
           //window.tokenError = true;
    }else{
          this.videoData = data.video;
          this.showVideoInfo();
          this.createPLayer();
    }
	},
    
  createPLayer : function(){
		var playerOption = {
			onStartPlay:null,
			onEnd:function(){
			},
			onError:null,
			onDataError:null,
			onPause:null,
			onDataok : function(data){
			},
			onUpdate:function(time){
			}
		};
		this.player =  videoPlayer.init("video_container",playerOption,this.videoData);
    },

    showUniversity : function(){
      if(this.courseData.joinNumber){
        $("#js_joinCount").html(this.courseData.joinNumber+"次");
      }
      if(!this.courseData.university && !this.courseData.authors){
         $("#js_courseInfo").hide();
      }else{
         if(this.courseData.university){
            var img = document.createElement("img");
            $(img).attr("src",this.courseData.university.iconUrl);
            var span = document.createElement("span");
            $(span).html(this.courseData.university.name);
            var _unit = $("#js_courseinfo .unit");
            _unit.append(img);
            _unit.append(span);
         }
         var teacherInfo = document.createElement("div");
         $(teacherInfo).attr("class","teacher-info");
         var techDom = $("#js_courseinfo .teacher");
         var _techimg = document.createElement("img");
         if(this.courseData.authors.length > 0){
           var _author = this.courseData.authors[0];
           //var _techimg = document.createElement("img");
           $(_techimg).attr("src", _author.iconUrl);
           $(teacherInfo).html('<div class="name">'+_author.name+'</div><div class="rank">'+_author.jobTitle+'</div>');
           techDom.append(_techimg);
           techDom.append(teacherInfo);
         }else{
           $(teacherInfo).html('<div style="margin:11px 0 0 4px;" class="name">迷你课</div>');
           $(_techimg).attr("src", this.courseData.marketCoverUrl);
           techDom.append(_techimg);
           techDom.append(teacherInfo);
         }
      }
    },

    showVideoInfo : function(data){
         $("#js_videotitle").html(this.videoData.name);
         var  _time = this.getTimeModel(this.videoData.durationHour);
         $("#js_totaltime").html(_time);
    },

    getTimeModel : function(_time){
        var _secondNum = _time ;
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

    /**
     * 调用播放器的接口 seek到相应的时间点
     * @return {[type]} [description]
     */
    changePlayerTime : function(startTime, endTime){
      if(this.player){
         this.player.setPlayTime(startTime,endTime);
         //this.player.play();
      }
    }

};/*--------*/
var Control ;
require(["jquery","subtitleAxis"], function($, subtitleAxis) {
   function initVideoInfo(){
     Control = {

     };
     var _userInfo = userInfo();
     var options = {
       courseId : _userInfo.courseId,
       videoId :_userInfo.videoId,//'ad1773cf-da42-4b69-ab9c-66994a8db66c',//_userInfo.videoId,
       token : _userInfo.token,
       username : _userInfo.username
     };
     Control.course = Course.init(options);
     Control.userInfo = _userInfo;

     var segSubtitlsoptions = {
         videoId : _userInfo.videoId,//'ad1773cf-da42-4b69-ab9c-66994a8db66c',
         token : _userInfo.token,
         username : _userInfo.username,
         nickname : _userInfo.nickname,
         language : _userInfo.language,
         errorCallBack : Control.course.showErrorNote
     };
     
     Control.subtitleAxis = subtitleAxis.init(segSubtitlsoptions,"subTitleDom");
     return Control;
   }

   initVideoInfo();
});