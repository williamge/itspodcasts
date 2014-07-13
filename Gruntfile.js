module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jsbeautifier: {
            "default": {
                files: {
                    src: ["scraper/**/*.js", "web/**/*.js"]
                },
                options: {
                    spaceInParen: true,
                    braceStyle: "expand"
                }
            },
            "verify": {
                files: {
                    src: ["scraper/**/*.js", "web/**/*.js"]
                },
                options: {
                    mode: "VERIFY_ONLY",
                    spaceInParen: true,
                    braceStyle: "expand"
                }
            }
        },
        githooks: {
            all: {
                'pre-commit': 'git-pre-commit'
            }
        },
        jshint: {
            all: ["scraper/**/*.js", "web/**/*.js"]
        },
        watch: {
            options : {
                livereload: true
            },
            scripts: {
                files: ['web/**/*.jade', 'web/**/*.css']
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-githooks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['jsbeautifier']);
    grunt.registerTask('git-pre-commit', ['jsbeautifier:verify', 'jshint']);

};