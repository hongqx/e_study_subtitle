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
        nickname : Cookie.get("nickname"),
        username : decodeURI(Cookie.get("nickname")),
        token : Cookie.get("token"),
        videoId : Cookie.get("videoId"),
        courseId : Cookie.get("courseId")
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
}

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
        var _loginurl = "http://t.yxgapp.com/d/mooc/webClient/login.html";//上线的时候需要改动
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
    	}
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
    }

};

function initVideoInfo(){
  var _userInfo = userInfo();
  var options = {
    courseId : _userInfo.courseId,
    videoId : _userInfo.videoId,
    token : _userInfo.token,
    username : _userInfo.username
  }
  var _course = Course.init(options);
  return _course;
}