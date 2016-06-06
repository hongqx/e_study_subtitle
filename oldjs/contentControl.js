var contentControl = {
     init : function(videoPlayer,subtitle){
         this.getUserInfo();
         this.showUserInfo();
         var _self = this;
            /*初始化字幕信息*/
         var subTitleOption = {
           errorFun : function(){
              _self.showErrorNote();
           },
           onDataok : function(){
              _self.subTitleOK = true;
              if(_self.videoOk){
                 _self.hideLoadNote();
              }
           },
           userInfo : this.userInfo,
           videoId : this.videoId
         };
         subtitle.init("js_tranList",subTitleOption);
         /*初始化播放器*/
         var playerOption = {
           onStartPlay:null,
           onEnd:function(){
              subtitle.resetOption();
           },
           onError:null,
           onDataError:null,
           onPause:null,
           onDataok : function(data){
              _self.videoData = data;
              _self.videoOk = true;
              _self.showVideoInfo(_self.videoData);
              if(_self.subTitleOK){
                 _self.hideLoadNote();
              }
           },
           onUpdate:function(time){
              subtitle.changByTime(time);
           },
           userInfo:this.userInfo,
           videoId : this.videoId
         };
         videoPlayer.init("video_container",playerOption);
         
         /*获取课程信息*/
         this.getCourseData();
         this.courseRequestTime = 0;

     },
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
     // 接口获取失败提示处理
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
    showUserInfo : function(data){
        if(this.userInfo.avatarUrl && this.userInfo.avatarUrl != "null"){
          $("#js_userpic").attr("src",this.userInfo.avatarUrl);
        }
        var _name = this.userInfo.nickname && this.userInfo.nickname!= "null"? this.userInfo.nickname :'';
        $("#js_nickname").html(_name);
    },
    /*获取课程详细信息*/
    getCourseData : function(){
       var _params = {};
       this.courseRequestTime ++;
       _params.username = this.userInfo.username;
       _params.token = this.userInfo.token;
       _params.courseId = this.courseId;
       _params.command="command_detail";
       var _self = this;
       $.ajax({
         url:"http://m.yxgapp.com/d/mooc/PutOpenCourseRecord.json",
         data:_params,
         type:"GET",
         dataType:"json",
         success : function(data){
            _self.showCourseInfo(data);
         },
         error:function(data){
          if(this.courseRequestTime < 3){
              _self.getCourseData();
          }else{
             _self.showLoadNote("网络不通畅，请检查之后刷新页面");
          }
         }
       });
    },
    showCourseInfo:function(data){
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
    /**
     * 显示该视频相关的数据 视频标题 翻译情况等
     * @return {[type]} [description]
     */
    showVideoInfo : function(data){
         $("#js_videotitle").html(data.name);
         var transInfo = data.translateInfo,
             allNum = transInfo.allTranslateSentencesNumber,
             baseNum = transInfo.baseSentencesNumber,
             ratio = (allNum/baseNum * 100).toFixed(0);
         $("#js_progress").html(ratio+"%");
         $("#js_total").html(baseNum+"句");
    },
    /*从cookie中获取二维码扫描页面中拿到的数据*/
    getUserInfo : function(){
        this.userInfo = {};
        this.userInfo.username = Cookie.get("userId");
        this.userInfo.token = Cookie.get("token");
        this.courseId = Cookie.get("courseId");
        this.videoId = Cookie.get("videoId");
        this.userInfo.nickname = Cookie.get("nickname");
        this.userInfo.avatarUrl = Cookie.get("avatarUrl");
    },
    showNote : function(msg,css,callback){
        var dom = $("#js_note1");
        dom.find(".layui-layer-content").html(msg);
        $("#js_mask").show();
        if(callback){
          var dombtn = dom.find(".layui-layer-btn0");
          var _self = this;
          dombtn.show();
          dombtn.on("click",function(){
              _self.hideNote();
              callback();
          });
        }else{
           dom.find(".layui-layer-btn0").hide();
        }
        dom.show();
    },
    hideNote : function(callback){
        $("#js_mask").hide();
        var dom = $("#js_note1");
        dom.hide();
    },
    checkSupport : function(){
        var noteText = [
           "您的浏览器版本较低，请更换为Chrome或者Firefox最新版本再来使用。",
           "注意：我们未对您的浏览器进行过兼容性测试，使用过程中可能会存在问题，建议使用Chrome或者Firefox浏览器最新版本。"
        ];
        if(!window.localStorage || !window.localStorage.setItem){
            this.hideLoadNote();
            this.showNote(noteText[0]);
            return false;
        }
        var ua =  window.navigator.userAgent;
        if(ua.indexOf("Chrome") < 0 && ua.indexOf("Safari") < 0 && ua.indexOf("Firefox") < 0){
           var _self = this;
           var fun = function(){
              _self.hideNote();
              _self.showLoadNote();
              _self.init(videoPlayer,subtitle);
           };
           this.showNote(noteText[1],{},fun);
           return false;
        }
        this.init(videoPlayer,subtitle);
        return true;
    }
};
window.onload = function(){
    contentControl.checkSupport();
    $(document).on("visibilitychange",function(){
       if(document.hidden){
           videoPlayer.pause();
       }
    });
};
window.onbeforeunload = function(){
    if(subtitle.remainSubtitles.length > 0 && !windows.tokenError){
       return '当前尚有字幕未同步到平台，离开可能会导致数据丢失，是否确认离开？';
    }
};
window.onblur = function(){
   videoPlayer.pause();
};