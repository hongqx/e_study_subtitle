requirejs.config({
    paths: {
      jquery: "http://m.yxgapp.com/d/threeParty/jquery1_11_3.min",
      mCustomScrollbar : "http://m.yxgapp.com/d/threeParty/jquery.mCustomScrollbar.concat.min",
      peaks: 'http://10.10.151.24:3003/threeParty/peaks.min',
      segmentPart: 'http://10.10.151.24:3003/js/segmentPart',
      subtitleAxis:"http://10.10.151.24:3003/js/subtitleAxis"
      control:"http://10.10.151.24:3003/subtitlecontrol"
     /* localstorage:"http://10.10.151.24:3003/js/localstorage",
      videoPlayer:"http://10.10.151.24:3003/js/videoPlayer",
      videoInfo:"http://10.10.151.24:3003/js/videoInfo",*/
    }
});
var Control ;
require(["jquery","control","subtitleAxis","mCustomScrollbar"], function(jquery,control,subtitleAxis,mCustomScrollbar) {
   function initVideoInfo(){
     Control = {

     };
     var _userInfo = userInfo();
     var options = {
       courseId : _userInfo.courseId,
       videoId : _userInfo.videoId,//'ad1773cf-da42-4b69-ab9c-66994a8db66c',//_userInfo.videoId,
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
     
     Control.subtitleAxis = subtitleAxis.init(segSubtitlsoptions,"#subTitleDom");
     return Control;
   }

   initVideoInfo();
});