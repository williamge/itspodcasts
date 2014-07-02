module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jsbeautifier: {
            files: ["scraper/**/*.js", "web/**/*.js"],
            options: {
                spaceInParen: true,
                braceStyle: "expand"
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsbeautifier');

    // Default task(s).
    grunt.registerTask('default', ['jsbeautifier']);

};
