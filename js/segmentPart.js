define(['jquery', 'peaks', 'utility'], function ($, peaks, utility) {
    var segmentPart = {};

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
            segment.segmentId = 'b' + new Date().getTime();
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
     * 添加片段
     * 
     * @param {Object} instance 实例对象
     * @pram {Object} segment 片段对象
     */
    segmentPart.addSegment = function (instance, segment) {
        // TODO如果当前位置已经添加了，就自动focus到相应的textarea

        // 如果没有传递segment就默认从当前时间开始1秒钟
        if (!segment) {
            segment = {
              startTime: instance.time.getCurrentTime(),
              endTime: instance.time.getCurrentTime() + 1,
              editable: true
            }
        }
        // 如果空白的地方小于1秒添加不成功提示删除后面的片断
        var startTime = segment.startTime;
        var endTime = segment.endTime;
        var allSegments = instance.segments.getSegments();
        if (this.processSegments(instance, segment)) {
            instance.segments.add([segment]);   
            // TODO调用textarea接口添加textarea
            //addTextArea(instance);
            
        }
        for (var i = 0, len = allSegments.length; i < len; i++) {
            if (!allSegments[i].segmentId) {
                allSegments[i].segmentId = 'b' + new Date().getTime();
            }
        }
        // 添加后重新排序
        this.sortSegments(instance);
        Control.subtitleAxis.addSubtitle();
    };


    /**
     * 删除当前片段
     *
     * @param {Object} instance 实例
     */
    segmentPart.deleteSegment = function (instance, segmentId) {
        // 删除当前点击的segment
        var allSegments = instance.segments.getSegments();
        for (var i = 0, len = allSegments.length; i < len; i++) {
            var seg = allSegments[i];
            if (segmentId === seg.segmentId) {
                instance.segments.remove(seg);
                this.sortSegments(instance);
                len--;
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
    