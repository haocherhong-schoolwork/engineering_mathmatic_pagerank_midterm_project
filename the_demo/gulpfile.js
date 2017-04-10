var gulp = require('gulp');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var livereload = require('gulp-livereload');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var gulpif = require('gulp-if');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var watchify = require('watchify');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var sass = require('gulp-sass');

var browserifyTask = function(options) {

	var bundleName = options.name || 'APP';

	//Add client side dependencies here
	var dependencies = options.dependencies || [];
	var tasks = [];

	// Our app bundler
	var appBundler = browserify({
		entries: [options.src], // Only need initial file, browserify finds the rest
		transform: [
			[babelify, {
				// plugins: ['transform-object-rest-spread'],
				plugins: ['transform-class-properties'],
				presets: options.presets
			}]
		], // We want to convert JSX to normal javascript
		debug: options.development, // Gives us sourcemapping
		cache: {},
		packageCache: {},
		fullPaths: options.development // Requirement of watchify
	});

	// We set our dependencies as externals on our app bundler when developing
	(options.development ? dependencies : []).forEach(function(dep) {
		appBundler.external(dep);
	});

	// The rebundle process
	var rebundle = function() {
		var start = Date.now();
		console.log('Building ' + bundleName + ' bundle');
		return appBundler.bundle()
			.on('error', gutil.log)
			.pipe(source(options.destFilename))
			.pipe(gulpif(!options.development, streamify(uglify())))
			.pipe(gulp.dest(options.dest))
			.pipe(gulpif(options.livereload, livereload()))
			.pipe(notify(function() {
				console.log(bundleName + ' bundle built in ' + (Date.now() - start) + 'ms');
			}));
	};

	// Fire up Watchify
	if (options.watch) {
		appBundler = watchify(appBundler);
		appBundler.on('update', rebundle);
	}

	tasks.push(rebundle());

	// We create a separate bundle for our dependencies as they
	// should not rebundle on file changes. This only happens when
	// we develop. When deploying the dependencies will be included
	// in the application bundle
	if (options.development) {
		var vendorsBundler = browserify({
			debug: true,
			require: dependencies
		});

		// Run the vendor bundle
		var start = new Date();
		console.log('Building VENDORS bundle');
		tasks.push(vendorsBundler.bundle()
			.on('error', gutil.log)
			.pipe(source(options.vendorsFilename))
			.pipe(gulpif(!options.development, streamify(uglify())))
			.pipe(gulp.dest(options.dest))
			.pipe(notify(function() {
				console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
			})));
	}

	return merge(...tasks);
}

var serverTask = function(options) {
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
				console.log('(Server) ' + file.relative + ' built in ' + (Date.now() - start) + 'ms');
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

var sassTask = function(options) {
	var build = () => {
		var start = new Date();
		return gulp.src(options.src)
			.pipe(concat('main.css'))
			.pipe(sass({
				outputStyle: options.development ? null : 'compressed'
			}).on('error', sass.logError))
			.pipe(gulp.dest(options.dest))
			.pipe(notify(function() {
				console.log('SASS bundle built in ' + (Date.now() - start) + 'ms');
			}));
	}

	gulp.watch(options.src, build);

	return build();
}


var copyTask = function(options) {
	var copy = function(options) {
		return gulp.src(options.src, options)
			.pipe(gulp.dest(options.dest))
			.pipe(notify(function(file) {
				console.log(file.relative + ' copied');
			}));
	}

	if (options.watch) {
		watch(options.src, function(file) {
			var _options = {};
			for (var i in options)
				_options[i] = options[i];
			_options.src = file.path;
			copy(_options);
		})
	}

	return copy(options);
}

// Starts our development workflow
gulp.task('default', function() {
	var tasks = [];

	tasks.push(serverTask({
		src: ['./src/server/**/*.js'],
		dest: './build'
	}));

	tasks.push(copyTask({
		watch: true,
		src: ['./src/static/**/*.*'],
		base: './src/static',
		dest: './build'
	}));

	tasks.push(browserifyTask({
		src: ['./src/client/app.js'],
		dest: './build/public'
	}));

	tasks.push(sassTask({
		src: ['./src/client/styles/**/*.css', './src/client/styles/**/*.scss'],
		dest: './build/public'
	}));

	return merge(...tasks);
});

// Starts our development workflow
gulp.task('watch', function() {
	var tasks = [];

	livereload.listen({
		port: 9418
	});

	tasks.push(serverTask({
		watch: true,
		development: true,
		src: ['./src/server/**/*.js'],
		dest: './build'
	}));

	tasks.push(copyTask({
		watch: true,
		src: ['./src/static/**/*.*'],
		base: './src/static',
		dest: './build'
	}));

	//Build Game
	tasks.push(browserifyTask({
		name: 'Game',
		watch: true,
		livereload: true,
		development: true,
		src: ['./src/client/app.js'],
		dest: './build/public',
		destFilename: 'main.js',
		vendorsFilename: 'vendors.js',
		dependencies: ['eases', 'javascript-astar'],
		presets: ['stage-3']
	}));

	//Build Debugger
	tasks.push(browserifyTask({
		name: 'Debugger',
		watch: true,
		livereload: true,
		development: true,
		src: ['./src/client/Debugger/app.jsx'],
		dest: './build/public/debugger',
		destFilename: 'main.js',
		vendorsFilename: 'vendors.js',
		dependencies: [
			'react',
			'react-dom'
		],
		presets: ['react', 'stage-3']
	}));

	tasks.push(sassTask({
		development: true,
		watch: true,
		src: ['./src/client/styles/**/*.css', './src/client/styles/**/*.scss'],
		dest: './build/public'
	}));

	tasks.push(sassTask({
		development: true,
		watch: true,
		src: ['./src/client/Debugger/styles/**/*.css', './src/client/Debugger/styles/**/*.scss'],
		dest: './build/public/debugger'
	}));

	return merge(...tasks);
});