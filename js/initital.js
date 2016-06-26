requirejs.config({
    paths: {
      peaks: 'threeParty/peaks',
      jquery: "threeParty/jquery-2.1.4.min",
      utility: 'js/utility',
      segmentPart: 'js/segmentPart',
      mCustomScrollbar : "threeParty/jquery.mCustomScrollbar.concat.min",
      localstorage:"js/localstorage",
      videoPlayer:"js/videoPlayer",
      videoInfo:"js/videoInfo",
      subtitleAxis:"js/subtitleAxis"
    }
});
require(['jquery',"videoPlayer","localstorage","videoInfo"], function($,player,localstorage,videoInfo) {
  initVideoInfo();
});

require(['jquery', 'peaks', 'segmentPart', 'utility'], function ($, Peaks, segmentPart, utility) {
    // TODO 再看是否有必要留着
    window.globalSegments = {};
    // 储存根据starttime排序的片段，数值为{id: '', startime: ''}
    window.orderedSegments = [];
    var options = {
      container: document.getElementById('peaks-container'),
      mediaElement: document.querySelector('video'),
      dataUri: {
        arraybuffer: 'data/ad512d90-8a31-4df4-872b-876a378824bd.dat',
        json: 'data/ad512d90-8a31-4df4-872b-876a378824bd.json'
      },
      keyboard: false,
      height: 150,
      // Colour for the overview waveform rectangle that shows what the zoom view shows
      overviewHighlightRectangleColor: 'red',
      // Colour for the zoomed in waveform
      zoomWaveformColor: 'rgba(0, 225, 128, 1)',
      // Colour for the overview waveform
      overviewWaveformColor: 'rgba(0, 0, 0, 0.2)',
      // Colour of the play head(move line)
      playheadColor: 'rgba(0, 0, 0, 1)',
      // Colour of the axis gridlines
      axisGridlineColor: '#ccc',
      // Colour of the axis labels
      axisLabelColor: '#aaa',
      // 覆盖在总体波形图上面的矩形宽度
      zoomLevels: [512, 1024, 2048, 4096],
      pointMarkerColor:     'red', //Color for the point marker
      /**
       * Colour for the in marker of segments
       */
      //inMarkerColor:         'black',
      /**
       * Colour for the out marker of segments
       */
      outMarkerColor:        'red',
    };
    var peaksInstance = Peaks.init(options);
  
    peaksInstance.on('segments.dragged', function (segment) {
      console.log(segment);
      segmentPart.draggSegment(peaksInstance, segment);
      //peaksInstance.waveform.segments.updateSegments();
    })
    peaksInstance.on('dbclickAddSegment', function () {
       segmentPart.addSegment(peaksInstance);
    })
})