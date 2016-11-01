var Control ;
require([ "subtitleAxis"], function(subtitleAxis) {
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
     if( !Control.userInfo.token || !Control.userInfo.username || !Control.userInfo.videoId){
          Control.course.showErrorNote('登录状态失效或者参数缺失，请用App重新扫描二维码进行登录');
          return;
     }
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