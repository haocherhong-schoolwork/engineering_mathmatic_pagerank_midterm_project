var gulp = require('gulp');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var babelify = require('babelify');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var gulpif = require('gulp-if');
var streamify = require('gulp-streamify');
var watchify = require('watchify');
var concat = require('gulp-concat');

var appTask = function(options) {
	var rebuild = function() {
		var start = new Date();
		return gulp.src(options.src)
			// .pipe(sourcemaps.init())
			.pipe(babel({
				plugins: ['transform-runtime'],
				presets: ['es2015', 'stage-3']
			}))
			.on('error', gutil.log)
			// .pipe(sourcemaps.write('.'))
			.pipe(gulp.dest(options.dest))
			.pipe(notify(function(file) {
				console.log('(App) ' + file.relative + ' built in ' + (Date.now() - start) + 'ms');
			}));
	}

	if (options.watch) {
		watch(options.src, function(file) {
			var _options = {};
			for (var i in options)
				_options[i] = options[i];
			_options.src = file.path;
			rebuild(_options);
		});
	}

	return rebuild();
}

// Starts our development workflow
gulp.task('watch', function() {
	var tasks = [];

	tasks.push(appTask({
		watch: true,
		development: true,
		src: ['./src/**/*.js'],
		dest: './build'
	}));

	return merge(...tasks);
});