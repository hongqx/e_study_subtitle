module.exports = function(grunt){
	grunt.initConfig({
		pkg:grunt.file.readJSON('package.json'),
		concat:{
		 	options:{
		 		separator:"/*--------*/\n",
		 		banner:'/*! <%= pkg.name %>\n *version <%= pkg.version %>\n *<%= grunt.template.today("yyyy-mm-dd  hh:MM:ss") %>\n *<%= pkg.description %>\n */\n',
		 		footer:''
		 	},
		 	dist:{
	 			/*one : {
	 				src :['js/localstorage.js','js/videoPlayer.js','js/videoInfo.js','js/init.js'],
	 				dest :"js/subtitlecontrol.js"
	 			},
	 			css : {
                   src: ['jquery.mCustomScrollbar.min.css','css/style.css'],
                   dest:'css/yxgstyle.css'
                }*/
                files : {
                	'js/subtitlecontrol.js':['js/localstorage.js','js/videoPlayer.js','js/videoInfo.js','js/init.js'],
                    'css/yxgstyle.css':['jquery.mCustomScrollbar.min.css','css/style.css']
                } 
		 	}
		},
		uglify : {
	   		options:{
	   			//定义banner注释，将插入到输出的文件顶部
	   			banner:'/*! <%= pkg.name %> version<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd  hh:MM:ss") %>*/\n',
	   			mangle:{
	   				except:['$scope','userController']//压缩的时候忽略这几个字符
	   			}
	   		},
	   		dist:{
	   			files: {
                    'build/js/subtitlecontrol.min.js':['js/subtitlecontrol.js'],
                    'build/js/segmentPart.min.js':['js/segmentPart.js'],
                    'build/js/subtitleAxis.min.js':['js/subtitleAxis.js'],
	   			}
	   		}
	   	},
	   	cssmin : {
	   		options:{
	   			//定义banner注释，将插入到输出的文件顶部
	   			banner:'/*! <%= pkg.name %> version<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd  hh:MM:ss") %>*/\n'
	   		},
	   		dist : {
	   			css :{
	   				src : "css/yxgstyle.css",
	   				dest : 'build/css/yxgstyle.min.css'
	   			}
	   		}
	   	}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-css');
    //注册任务
	grunt.registerTask('default',['concat','uglify','cssmin']);
	grunt.registerTask('default',['concat']);
};
