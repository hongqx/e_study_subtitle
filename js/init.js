requirejs.config({
    paths: {
      peaks: 'http://192.168.1.107:3002/threeParty/peaks',
      jquery: "http://192.168.1.107:3002/threeParty/jquery-2.1.4.min",
      utility: 'http://192.168.1.107:3002/js/utility',
      segmentPart: 'http://192.168.1.107:3002/js/segmentPart',
      mCustomScrollbar : "http://192.168.1.107:3002/threeParty/jquery.mCustomScrollbar.concat.min",
      localstorage:"http://192.168.1.107:3002/js/localstorage",
      videoPlayer:"http://192.168.1.107:3002/js/videoPlayer",
      videoInfo:"http://192.168.1.107:3002/js/videoInfo",
      subtitleAxis:"http://192.168.1.107:3002/js/subtitleAxis"
    }
});
var Control ;
require(["videoPlayer","videoInfo","subtitleAxis","localstorage"], function(player,videoInfo,subtitleAxis,localstorage) {
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
         taskType:1,
         errorCallBack : Control.course.showErrorNote
     };

     Control.subtitleAxis = subtitleAxis.init(segSubtitlsoptions,"#subTitleDom");
     return Control;
   }

   initVideoInfo();
});