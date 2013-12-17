'use strict';

var componentFiles = require('./index');

var BROWSERS = [
  'PhantomJS',
  'Opera',
  'Firefox',
  'Chrome',
  'ChromeCanary',
  'Safari'
];

var config = {
  src: 'src/'
};

module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    config: config,
    pkg: require('./package.json'),
    bower: require('./bower.json'),
    banner: '/**\n' +
      ' * @license <%= pkg.name %> v<%= pkg.version %>\n' +
      ' * (c) 2013-<%= grunt.template.today("yyyy") %> GoCardless, Ltd.\n' +
      ' * <%= pkg.repository.url %>\n' +
      ' * License: MIT\n' +
      ' */\n',
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        '<%= config.src %>/**/*.js'
      ]
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      watch: {
        options: {
          autoWatch: true,
          singleRun: false
        }
      },
      ci: {
        options: {
          browsers: ['Firefox', 'Chrome']
        }
      },
      unit: {
        options: {
          browsers: BROWSERS
        }
      },
      coverage: {
        options: {
          reporters: ['coverage'],
        }
      }
    },
    copy: {
      build: {
        src: componentFiles,
        dest: '<%= bower.name %>.js',
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        options: {
          sourceMap: '<%= bower.name %>.map'
        },
        files: {
          '<%= bower.name %>.min.js': componentFiles
        }
      }
    },
    'ddescribe-iit': {
      files: [
        'src/**/*.js',
      ]
    }
  });

  grunt.registerTask('sanity-check', [
    'jshint',
    'ddescribe-iit'
  ]);

  grunt.registerTask('test', [
    'sanity-check',
    'karma:unit'
  ]);

  grunt.registerTask('citest', [
    'sanity-check',
    'karma:ci'
  ]);

  grunt.registerTask('build', [
    'test',
    'copy',
    'uglify'
  ]);
};
