define(['jquery'], function ($) {
    var utility = {
        /**
         * 将单位为s的时间戳转换为时间格式 eg: 10:23:23.22
         * 
         * @param {timeStamp} string 时间戳
         */
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
        },

        /**
         * 获取textarea中的字数（其他的input也okay）
         */
        getLength: function (id) {
            var content = $('#' + id).val();
            return content.split(/\s+/).length;
        }
    };

    return utility;
})