function SubTitle(){
	this.limodel = [
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
    this.urls = {
    	segs : "",
    	
    }
}
subTitle.init = function(options,containerId){
    var _instance = new subTitle();
    _instance.options = {
    	videoId : "ad1773cf-da42-4b69-ab9c-66994a8db66c",
    	userName : null,
    	token : null
    };
    _instance.subtitleItems = [];//字幕存储
    _instance.containerId = containerId;
    _instance.segs = [];
    _instance.showNum = 3;
    return _instance;
};

subTitle.prototype = {
	getSubTitles : function(){
       
	},
	checkLocalItems: function(){

	},
	initData : function(){

	},
	addSubtitle : function(seg, index) {
		
	},
	removeSubtitle : function(seg, index){

	},
	updateSubtitle : function(seg, index){

	},
	scrollTo : function(){

	},
	saveData : function(){

	}


}
