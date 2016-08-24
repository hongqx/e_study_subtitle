define(['jquery', 'peaks'], function ($, peaks) {
    var segmentPart = {};
    var utility = {
      getTime: function (timeStamp) {
            var formatTime = '';
            var hour = Math.floor(timeStamp / 3600);
            var minute = Math.floor(timeStamp / 60);
            var seconds = Math.round(timeStamp % 60 * 100) / 100;
            if (hour && hour < 10) {
              formatTime = '0' + hour + ':';
            }
            else {
              formatTime = hour + ':';
            }
            if (minute < 10) {
               formatTime += '0' + minute + ':';
            }
            else {
              formatTime += minute + ':'
            }
            formatTime += seconds >= 10 ? seconds : '0' + seconds;
            return formatTime;
        }
    };
    
    /**
     * 获取当前时间点所在的时间轴对象
     * @param  {object} peaksInstance peak对象
     * @return {int}   如果返回去1-时间空隙不够  返回0 说明改段已经存在时间轴  返回对象 可以添加
     */
    function getSegmentIndex(peaksInstance){
        var _currentTime = peaksInstance.time.getCurrentTime(),
            _oldSegments = peaksInstance.segments.getSegments();
        var  i = 0,_len = _oldSegments.length;
        var newSegment = {};
        if( _len === 0){
            newSegment.startTime = _currentTime < 1 ? 0 : _currentTime;
            newSegment.endTime = newSegment.startTime + 1;
            newSegment.index = 0;
            return newSegment;
        }
        
        if(_currentTime < _oldSegments[0].startTime){
              if(_oldSegments[0].startTime < 1){
                return 0;
              }
              if(_currentTime < 1){
                  newSegment.startTime  = 0;
              }else if(_oldSegments[0].startTime - _currentTime >= 1){
                  newSegment.startTime = _currentTime;
              }else{
                  newSegment.startTime = _currentTime - 1;
              }
              //newSegment.startTime = _currentTime < 1  ||  _oldSegments[0].startTime - _currentTime < 1 && ? 0 : _currentTime;
              newSegment.endTime = newSegment.startTime + 1;
              newSegment.index = 0;
              return newSegment;
        }
        
        //如果是大于则返回该值
        if(_currentTime > _oldSegments[_len-1].endTime){
            var _duration = peaksInstance.time.getDuration(),
                _oldEndtime = _oldSegments[_len-1].endTime;
            //剩下的时间空间不足1s
            if(_duration - _oldEndtime < 1){
               return 0;
            }else if(_duration === _oldEndtime){
               return 1;
            }
            
            newSegment.startTime = (_duration - _currentTime < 1 || _currentTime - _oldEndtime < 1) ? _oldEndtime : _currentTime;
            newSegment.endTime = newSegment.startTime + 1;
            newSegment.index = _len;
            return newSegment;
        }

        var index = -1;
        while(i < _len){
            if(_currentTime > _oldSegments[i].startTime && _currentTime < _oldSegments[i].endTime){
                return 1;
            }
            if(_currentTime > _oldSegments[i].endTime && _currentTime < _oldSegments[i+1].startTime){
                index = i;
                break;
            }else{
                i++;
            }
        }
        if(index < 0){
          return 1;
        }
        //确定比较的上一个的endTime
        var _oldEndtime  = _oldSegments[index].endTime ;
        if(_oldSegments[index + 1].startTime - _oldEndtime === 0){
           return 1;
        }else if(_oldSegments[index + 1].startTime - _oldEndtime < 1){
           return 0;
        }else{
            newSegment.startTime = (_currentTime - _oldSegments < 1) || (_oldSegments[index + 1].startTime - _currentTime < 1) ? _oldEndtime : _currentTime;
            newSegment.endTime =  newSegment.startTime + 1;
            newSegment.index = index;
            return newSegment;
        }
    };
    /**
     * 添加textarea
     *
     * @param {Object} peaksInstance instance实例
     */
    var addTextArea = function (peaksInstance) {
      var segmentObj = {};
        // A new segment created
      var allSegments = peaksInstance.segments.getSegments();
      var currentSegment = allSegments[allSegments.length -1];
      var startTime = currentSegment.startTime;
      var endTime = currentSegment.endTime;
      var textId = 'text_' + (currentSegment.id || 'segment');
      segmentObj.textId = textId;
      segmentObj.startTime = utility.getTime(startTime);
      segmentObj.alltime = Math.round((endTime - startTime) * 100) / 100;
      segmentObj.wordsCount = 0;
      // edit words
      // add a li
      var li = [
          '<li class="active" data-pindex="29" data-index="29" id="{@textId}">',
                '<div class="subtitle">',
                    '<div class="subspan">',
                          '<span class="start-time">{@startTime}</span>',
                    '</div>',
                    '<div class="sub-content">',
                         '<div class="txt">Koreanclass101.com Hanna Hanna Hangul</div>',
                         '<textarea name="" cols="30" rows="10" placeholder="edit..."></textarea>',
                    '</div>',
                    '<div class="subspan">',
                        '<span class="js_wps">{@wps}</span>',
                        '<span class="js_alltime">{@alltime}seconds</span>',
                        '<span class="js_wordsCount">0word</span>',
                        '<span class="delete-icon">——</span>',
                    '</div>',
                '</div>',
                '<div class="buttomline"></div>',
             '</li>'
      ].join('');
      li = li.replace('{@startTime}', segmentObj.startTime)
             .replace('{@alltime}', segmentObj.alltime)
             .replace('{@textId}', segmentObj.textId)
             .replace('{@wps}', '0WPS');
      $('#contentList').prepend(li);  
      // store in global parametes
      globalSegments[textId] = segmentObj;      
      // tetxarea监听以修改字数等信息
      $('#' + textId + ' textarea').on('propertychange input', function () {
          // TODO more accurate
          var wordsCount = $(this).val().replace(/\s+$/, '').split(/\s+/).length;
          globalSegments[textId].wordsCount = wordsCount;
          var alltime = globalSegments[textId].alltime;
          var wps = alltime ? Math.round(wordsCount / alltime * 100) / 100 : 0;
          $(this).parent().parent().find('.js_wordsCount').html(wordsCount + 'words');
          $(this).parent().parent().find('.js_wps').html(wps + 'WPS');
      }).blur(function () {
          // store the content in localstorage
          localStorage.setItem('textId', $(this).val());
          // when send?
          // editable?
      })
    };

    /**
     * 有序插入segment
     *
     * @param {Object} segment 要插入的segment
     */
    var insertSegment = function (segment) {
        // 数组为空的话直接push
        if (!orderedSegments.length) {
            segment.pos = 0;
            orderedSegments.push(segment);
            return;
        }
        if (!segment.segmentId) {
            segment.segmentId = 'b_' + new Date().getTime();
        }
        var i = 0, len = orderedSegments.length;
        while (i < len && segment.startTime > orderedSegments[i].startTime) {
            i++;
        }
        // 从i开始整体后移
        for (var j = len - 1; j >= i; j--) {
            orderedSegments[j + 1] = orderedSegments[j];
            orderedSegments[j + 1].pos = j + 1;
        }
        segment.pos = i;
        orderedSegments[i] = segment;
    };

    /**
     * TODO是否暴露此接口，再定
     *
     * @param {Object} instance 片段对象
     * @return {Object} orderedSegments 排序后的数组
     */
    segmentPart.sortSegments = function (instance) {
        orderedSegments = [];
        var allSegments = instance.segments.getSegments();
        for (var i = 0, len = allSegments.length; i < len; i++) {
            var seg = allSegments[i];
            insertSegment(seg);
        }
        return orderedSegments;
    };

    /**
     * 对片段进行处理
     */
    segmentPart.processSegments = function (instance, segment) {
        var startTime = segment.startTime;
        var endTime = segment.endTime;
        for (var i = 0, len = orderedSegments.length; i < len; i++) {
            var seg = orderedSegments[i];
            var nextSeg = '';
            if (orderedSegments[i + 1]) {
                nextSeg = orderedSegments[i + 1];
            }
            // 当点击片段中间的某一处时，提示是否删除
            if (startTime < seg.endTime && startTime > seg.startTime) {
                if (nextSeg && endTime < nextSeg.endTime && endTime > nextSeg.startTime) {
                    if (confirm('是否删除前后两个片段？')) {    
                        this.deleteSegment(instance, seg.segmentId);
                        len--;
                        this.deleteSegment(instance, nextSeg.segmentId);
                        len--;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    if (confirm('是否删除前一个片段？')) {
                        this.deleteSegment(instance, seg.segmentId);
                        len--;
                    }
                    else {
                        return false;
                    }    
                }
                
            }
            // 当点击空白区域，但是向后不足1s钟时提示，删掉后面的
            if (endTime < seg.endTime && endTime > seg.startTime) {
                if (confirm('空白区域不足1s钟，是否删除后一个片段？')) {
                    this.deleteSegment(instance, seg.segmentId);
                    len--;
                }
                else {
                    return false;  
                }
            }
        }
        return true;
    };
    /**
     * 根据当前时间获取时间轴的索引
     * @param  {Object} peaksInstance [description]
     * @return {int}               -1 当前位置没有是时间轴   大于等于0 时间轴的索引位置
     */
    function getIndexByCurrentTime(peaksInstance){
        var _currentTime = peaksInstance.time.getCurrentTime(),
            segments = peaksInstance.segments.getSegments(), i = 0,_len = segments.length;
        if(_len === 0 || _currentTime > segments[_len-1].endTime){
           return -1;
        }
        while(i < _len-1){
          if(_currentTime >= segments[i].startTime && _currentTime <= segments[i].endTime){
             return i;
          }else if((i+1) < _len && _currentTime > segments[i].endTime && _currentTime < segments[i+1].startTime){
             return -1
          }
          i++;
        }
        return -1;
    }
    /**
     * 添加片段
     * 
     * @param {Object} instance 实例对象
     * @pram {Object} segment 片段对象
     */
    segmentPart.addSegment = function (instance, segmentId) {
        var segment = getSegmentIndex(instance);
        if(segment === 0){
          alert("时间空隙不够，无法添加");
        }else if(segment === 1){
            return ;
        }else{
            segment.editable = true;
            segment.segmentId = segmentId ? segmentId : 'b_'+ new Date().getTime();
            var segment = instance.segments.add([segment]);
            Control.subtitleAxis.addSubtitle(segment);
        }/*= {
          startTime: peaksInstance.time.getCurrentTime(),
          endTime: peaksInstance.time.getCurrentTime() + 5,
          editable: true
        };*/
    };


    /**
     * 删除当前片段
     *
     * @param {Object} instance 实例
     */
    segmentPart.deleteSegment = function (instance,index) {
        if(index){
           instance.segments.remove(instance.segments.getSegments()[index]);   
           return true;
        }else{
           var index = getIndexByCurrentTime(instance);
           if(index === -1){
              return false;
           }else{
              instance.segments.remove(instance.segments.getSegments()[index]);
              return true;
           }
        }
    };

    /**
     * 获取相邻有重叠的片段
     *
     * @param {Object} segment 片段对象
     * @param {string} tag 平移的位置量即当前位置+tag，比如1：后面的一个; -1: 前面的一个;默认后面的
     */
    segmentPart.getNeighborSegment = function (segment, tag) {
        if (!tag) {
            tag = 1;
        }
        var index = segment.pos + tag;
        if (index < 0 || index >= orderedSegments.length) {
            return '';
        }
        else {
            return orderedSegments[index];
        }
    };

    /**
     * 根据传过来的segment调整前后相邻的片段
     *
     * @param {Object} instance 实例对象
     * @param {Object} segment getSegments()中的片段
     */
    segmentPart.moveSegment = function (instance, segment) {
        var allSegments = instance.segments.getSegments();
        this.sortSegments(instance);
        // 找到前后两个片段，调整前面片段的endtime，调整后面片段的starttime
        var prevSegment = this.getNeighborSegment(segment, -1);
        var nextSegment = this.getNeighborSegment(segment, 1);
        if (prevSegment) {
            if (segment.startTime <= prevSegment.endTime) {
                // 阻止继续拖拽
                segment.zoom.inMarker.attrs.draggable = false;
                //console.log(segment);
                return false;
            }
            segment.zoom.inMarker.attrs.draggable = true;
        }
        if (nextSegment) {
            if (segment.endTime >= nextSegment.startTime) {
                // 阻止继续拖拽
                segment.zoom.outMarker.attrs.draggable = false;
                return false;
            }
            segment.zoom.outMarker.attrs.draggable = true;
        }
        return true;
    };
    /**
     * 拖动时间轴时进行的操作
     * 
     * @param {Object} instance 实例对象
     * @param {Object} segment 片段对象
     */
    segmentPart.draggSegment = function (instance, segment) {
        // 调整前后有重合的时间轴
        //this.ajustSegments(instance, segment);
        // 如果触碰到邻居就停止
        if (this.moveSegment(instance, segment)) {
            // 更新对应textarea的字段
            //utility.updateData(segment);
            Control.subtitleAxis.updateSubtitle(segment);
        }
    };
    
    return segmentPart;
})
// 提出来封装成单独的模块
    