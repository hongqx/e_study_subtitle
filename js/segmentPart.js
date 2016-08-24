var segmentPart = {};
segmentPart.init = function(options,events){
    this.peaksInstance = Peaks.init(options);
    this.peaksInstance.zoom.zoomOut();
    var _self = subtitleAxis;
    this.peaksInstance.on('segments.dragend', function (segment) {
        subtitleAxis.updateSubtitle(segment);
    });
    this.peaksInstance.on('dbclickAddSegment', function () {
        segmentPart.addSegment(_self.peaksInstance);
    });
};

segmentPart.addSegment = function(segment){

};

segmentPart.removeSegmentByTime = function(){

};

segmentPart.deleteSegment = function(index){

}