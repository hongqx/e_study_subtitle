requirejs.config({
    paths: {
      peaks: 'http://10.10.151.56:3002/threeParty/peaks',
      jquery: "http://10.10.151.56:3002/threeParty/jquery-2.1.4.min",
      utility: 'http://10.10.151.56:3002/js/utility',
      segmentPart: 'http://10.10.151.56:3002/js/segmentPart',
      mCustomScrollbar : "http://10.10.151.56:3002/threeParty/jquery.mCustomScrollbar.concat.min",
      localstorage:"http://10.10.151.56:3002/js/localstorage",
      videoPlayer:"http://10.10.151.56:3002/js/videoPlayer",
      videoInfo:"http://10.10.151.56:3002/js/videoInfo",
      subtitleAxis:"http://10.10.151.56:3002/js/subtitleAxis"
    }
});
var Control ;
require(["jquery","videoPlayer","videoInfo","subtitleAxis","localstorage"], function(jquery,player,videoInfo,subtitleAxis,localstorage,mCustomScrollbar) {
   function initVideoInfo(){
     Control = {

     };
     var _userInfo = userInfo();
     var options = {
       courseId : _userInfo.courseId,
       videoId : 'ad1773cf-da42-4b69-ab9c-66994a8db66c',//_userInfo.videoId,
       token : _userInfo.token,
       username : _userInfo.username
     };
     Control.course = Course.init(options);
     Control.userInfo = _userInfo;

     var segSubtitlsoptions = {
         videoId : 'ad1773cf-da42-4b69-ab9c-66994a8db66c',
         token : _userInfo.token,
         username : _userInfo.username,
         nickname : _userInfo.nickname,
         taskType:1,
         errorCallBack : Control.course.showErrorNote
     };
     
     Control.subtitleAxis = subtitleAxis.init(segSubtitlsoptions,"#subTitleDom");
     return Control;
   }

   initVideoInfo();
});