var userInfo = {
    username:Cookie.get("userId"),
    token:Cookie.get("token")
};
var videoId = "ad512d90-8a31-4df4-872b-876a378824bd";
/*初始化播放器*/
var playerOption = {
	onStartPlay:null,
	onEnd:function(){
		//subtitle.resetOption();
	},
	onError:null,
	onDataError:null,
	onPause:null,
	onDataok : function(data){
    /* _self.videoData = data;
    _self.videoOk = true;
     _self.showVideoInfo(_self.videoData);
      if(_self.subTitleOK){
      _self.hideLoadNote();
  }*/
	},
	onUpdate:function(time){
		//subtitle.changByTime(time);
	},
	userInfo:this.userInfo,
	videoId : videoId
};
videoPlayer.init("video_container",playerOption);
var _json ;
function getJsonData(){
	$.ajax({
		url:"http://m.yxgapp.com/d/mooc/webClient/wave_map_file/ad512d90-8a31-4df4-872b-876a378824bd.json",
		dataType:"json",
		success:function(data){
           _json = data;
           console.log(data);
		},
		error:function(){
			console.log("getdata error");
		}

	});
	/*$.ajax({
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
       });*/
}
//getJsonData();
var options = {
   container : document.getElementById("peaks-container"),
   mediaElement : document.querySelector("video"),
   dataUri:{
   	 json: "http://m.yxgapp.com/wave_map_file/ad512d90-8a31-4df4-872b-876a378824bd.json",
   },
   logger: console.error.bind(console),

  // default height of the waveform canvases in pixels
  height: 200,

  // Array of zoom levels in samples per pixel (big >> small)
  zoomLevels: [512, 1024, 2048, 4096],

  // Bind keyboard controls
  keyboard: false,

  // Keyboard nudge increment in seconds (left arrow/right arrow)
  nudgeIncrement: 0.01,

  // Colour for the in marker of segments
  inMarkerColor: '#a0a0a0',

  // Colour for the out marker of segments
  outMarkerColor: '#a0a0a0',

  // Colour for the zoomed in waveform
  zoomWaveformColor: 'rgba(0, 225, 128, 1)',

  // Colour for the overview waveform
  overviewWaveformColor: 'rgba(0,0,0,0.2)',

  // Colour for the overview waveform rectangle that shows what the zoom view shows
  overviewHighlightRectangleColor: 'grey',

  // Colour for segments on the waveform
  segmentColor: 'rgba(255, 161, 39, 1)',

  // Colour of the play head
  playheadColor: 'rgba(0, 0, 0, 1)',

  // Colour of the play head text
  playheadTextColor: '#aaa',

  // the color of a point marker
  pointMarkerColor: '#FF0000',

  // Colour of the axis gridlines
  axisGridlineColor: '#ccc',

  // Colour of the axis labels
  axisLabelColor: '#aaa',

  // Random colour per segment (overrides segmentColor)
  randomizeSegmentColor: true,

  // Zoom view adapter to use. Valid adapters are: 'animated' (default) and 'static'
  zoomAdapter: 'animated',

  // Array of initial segment objects with startTime and
  // endTime in seconds and a boolean for editable.
  // See below.
  segments: [{
    startTime: 120,
    endTime: 140,
    editable: true,
    color: "#ff0000",
    labelText: "My label"
  },
  {
    startTime: 220,
    endTime: 240,
    editable: false,
    color: "#00ff00",
    labelText: "My Second label"
  }]
};
peaks.js.init(options);