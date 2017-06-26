module.exports = function (grunt) {
    var folderName = grunt.option('target');
    var isProduction = grunt.option('production');
    var isTesting = grunt.option('testing');
    if (isProduction || isTesting) {
        grunt.registerTask('ui', ["ejs:ui", "sass:development", "cssmin:production", "concat:production", "uglify"]);
    } else {
        grunt.registerTask('ui', ["ejs:ui", "sass:development", "concurrent:watchDevelopment"]);
    }

};